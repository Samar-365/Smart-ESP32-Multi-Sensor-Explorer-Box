/**
 * Submodule 3.1: Statistical & Aggregation Engine
 * Calculates descriptive statistics for numerical sensor data.
 * Fulfills SRS Section 8 (FR-04.2 Statistical Analysis).
 */

import { SENSOR_METADATA } from '../telemetry/sensorSchema.js';

export class StatsEngine {
  /**
   * Computes statistical metrics for a specific sensor over an array of readings
   * @param {Array<Object>} readings Array of telemetry readings
   * @param {string} sensorKey e.g. 'temperature', 'humidity', 'pressure', 'gas', 'light', 'distance'
   * @returns {Object} Statistics object
   */
  static computeStats(readings, sensorKey) {
    const meta = SENSOR_METADATA[sensorKey] || { decimals: 1, unit: '' };
    const decimals = meta.decimals ?? 1;

    const emptyResult = {
      sensorKey,
      unit: meta.unit,
      current: 0,
      min: 0,
      max: 0,
      avg: 0,
      stdDev: 0,
      rateOfChange: 0,
      rateOfChangePerHour: 0,
      delta: 0,
      sampleCount: 0,
      firstTimestamp: null,
      latestTimestamp: null
    };

    if (!Array.isArray(readings) || readings.length === 0) {
      return emptyResult;
    }

    // Extract valid numerical values and timestamps
    const validPoints = [];
    for (const r of readings) {
      const val = r[sensorKey];
      if (typeof val === 'number' && !Number.isNaN(val)) {
        validPoints.push({
          val,
          time: new Date(r.timestamp).getTime()
        });
      }
    }

    if (validPoints.length === 0) {
      return emptyResult;
    }

    const n = validPoints.length;
    const values = validPoints.map(p => p.val);
    const current = values[values.length - 1];

    // Min & Max
    let min = values[0];
    let max = values[0];
    let sum = 0;

    for (let i = 0; i < n; i++) {
      const v = values[i];
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
    }

    // Average (Mean)
    const avg = sum / n;

    // Standard Deviation (Population StdDev: sigma = sqrt(sum((x - mu)^2) / n))
    let varianceSum = 0;
    for (let i = 0; i < n; i++) {
      const diff = values[i] - avg;
      varianceSum += diff * diff;
    }
    const variance = varianceSum / n;
    const stdDev = Math.sqrt(variance);

    // Rate of Change (Delta x / Delta t)
    let rateOfChangePerHour = 0;
    let rateOfChangePerMin = 0;
    let delta = 0;

    if (n >= 2) {
      const first = validPoints[0];
      const last = validPoints[n - 1];
      const timeDiffMs = last.time - first.time;
      delta = last.val - first.val;

      if (timeDiffMs > 0) {
        const hours = timeDiffMs / (3600 * 1000);
        const minutes = timeDiffMs / (60 * 1000);
        rateOfChangePerHour = delta / hours;
        rateOfChangePerMin = delta / minutes;
      }
    }

    const round = (val, d = decimals) => Number(val.toFixed(d));

    return {
      sensorKey,
      unit: meta.unit,
      current: round(current),
      min: round(min),
      max: round(max),
      avg: round(avg),
      stdDev: round(stdDev, Math.max(1, decimals)),
      rateOfChange: round(rateOfChangePerMin, 2),
      rateOfChangePerHour: round(rateOfChangePerHour, 2),
      delta: round(delta),
      sampleCount: n,
      firstTimestamp: new Date(validPoints[0].time).toISOString(),
      latestTimestamp: new Date(validPoints[n - 1].time).toISOString()
    };
  }

  /**
   * Computes statistics for all numerical sensors simultaneously
   * @param {Array<Object>} readings 
   * @returns {Object} Map of sensorKey -> stats
   */
  static computeAllStats(readings) {
    const sensorKeys = ['temperature', 'humidity', 'pressure', 'gas', 'light', 'distance'];
    const results = {};
    for (const key of sensorKeys) {
      results[key] = this.computeStats(readings, key);
    }
    return results;
  }
}
