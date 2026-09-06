/**
 * Submodule 3.3: Threshold Violation & Compliance Tracker
 * Evaluates readings against upper/lower safety limits, tracking violation counts,
 * highest recorded breach, timestamp of latest breach, and total cumulative time above threshold.
 * Fulfills SRS Section 10 (FR-04.4 Threshold Analysis).
 */

import { SENSOR_METADATA } from '../telemetry/sensorSchema.js';

export class ThresholdAnalyzer {
  /**
   * Evaluates historical readings against a specific safety threshold
   * @param {Array<Object>} readings Array of telemetry readings sorted chronologically
   * @param {string} sensorKey Sensor identifier (e.g. 'gas', 'temperature', 'distance')
   * @param {number} threshold Target threshold value
   * @param {string} operator Comparison operator: '>' (upper bound) or '<' (lower bound)
   * @returns {Object} Comprehensive threshold analysis
   */
  static analyzeThreshold(readings, sensorKey, threshold, operator = '>') {
    const meta = SENSOR_METADATA[sensorKey] || { name: sensorKey, unit: '', decimals: 1 };
    const decimals = meta.decimals ?? 1;

    const fallback = {
      sensorKey,
      sensorName: meta.name,
      unit: meta.unit,
      currentValue: 0,
      threshold,
      operator,
      status: 'NORMAL',
      statusBadge: '🟢 NORMAL',
      isViolated: false,
      violationCount: 0,
      totalViolationSamples: 0,
      peakViolation: null,
      latestViolationTime: null,
      timeAboveThresholdMs: 0,
      timeAboveThresholdFormatted: '0s',
      violationPercentage: 0
    };

    if (!Array.isArray(readings) || readings.length === 0) {
      return fallback;
    }

    // Filter valid points
    const points = [];
    for (const r of readings) {
      const val = r[sensorKey];
      if (typeof val === 'number' && !Number.isNaN(val)) {
        points.push({
          val,
          timeMs: new Date(r.timestamp).getTime(),
          timestamp: r.timestamp
        });
      }
    }

    if (points.length === 0) {
      return fallback;
    }

    const isBreach = (val) => operator === '<' ? val < threshold : val > threshold;

    const currentVal = points[points.length - 1].val;
    const isCurrentlyViolated = isBreach(currentVal);

    let violationEpisodes = 0;
    let inViolationEpisode = false;
    let totalViolationSamples = 0;
    let peakViolation = null;
    let latestViolationTime = null;
    let timeAboveThresholdMs = 0;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const breached = isBreach(p.val);

      if (breached) {
        totalViolationSamples++;
        latestViolationTime = p.timestamp;

        // Track peak violation magnitude
        if (peakViolation === null) {
          peakViolation = p.val;
        } else if (operator === '<') {
          if (p.val < peakViolation) peakViolation = p.val;
        } else {
          if (p.val > peakViolation) peakViolation = p.val;
        }

        // Detect new discrete violation episode
        if (!inViolationEpisode) {
          violationEpisodes++;
          inViolationEpisode = true;
        }

        // Estimate time spent in violation based on interval to adjacent point
        if (i > 0) {
          const prev = points[i - 1];
          const diff = p.timeMs - prev.timeMs;
          // Only add reasonable delta (ignore huge data gaps > 1 hour)
          if (diff > 0 && diff < 3600 * 1000) {
            timeAboveThresholdMs += diff;
          } else {
            timeAboveThresholdMs += 3000; // default 3s sample
          }
        } else {
          timeAboveThresholdMs += 3000;
        }
      } else {
        inViolationEpisode = false;
      }
    }

    // Status label & badge matching SRS Section 10
    let status = 'NORMAL';
    let statusBadge = '🟢 NORMAL';
    if (isCurrentlyViolated) {
      if (operator === '<') {
        status = 'LOW';
        statusBadge = '🔴 CRITICAL LOW';
      } else {
        status = 'HIGH';
        statusBadge = '🔴 HIGH';
      }
    }

    // Format human-readable time
    const formatDuration = (ms) => {
      const totalSec = Math.floor(ms / 1000);
      if (totalSec < 60) return `${totalSec}s`;
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      if (min < 60) return `${min}m ${sec}s`;
      const hrs = Math.floor(min / 60);
      const remMin = min % 60;
      return `${hrs}h ${remMin}m`;
    };

    const violationPercentage = points.length > 0 
      ? Number(((totalViolationSamples / points.length) * 100).toFixed(1)) 
      : 0;

    return {
      sensorKey,
      sensorName: meta.name,
      unit: meta.unit,
      currentValue: Number(currentVal.toFixed(decimals)),
      threshold: Number(threshold.toFixed(decimals)),
      operator,
      status,
      statusBadge,
      isViolated: isCurrentlyViolated,
      violationCount: violationEpisodes,
      totalViolationSamples,
      peakViolation: peakViolation !== null ? Number(peakViolation.toFixed(decimals)) : null,
      latestViolationTime,
      timeAboveThresholdMs,
      timeAboveThresholdFormatted: formatDuration(timeAboveThresholdMs),
      violationPercentage
    };
  }

  /**
   * Analyzes an array of thresholds across multiple sensors
   * @param {Array<Object>} readings 
   * @param {Object} thresholdMap e.g. { gas: 500, temperature: 32, distance: { val: 10, op: '<' } }
   * @returns {Object} Map of sensorKey -> analysis
   */
  static analyzeAll(readings, thresholdMap) {
    const results = {};
    for (const [key, cfg] of Object.entries(thresholdMap)) {
      const threshold = typeof cfg === 'number' ? cfg : cfg.val;
      const op = typeof cfg === 'object' && cfg.op ? cfg.op : '>';
      results[key] = this.analyzeThreshold(readings, key, threshold, op);
    }
    return results;
  }
}
