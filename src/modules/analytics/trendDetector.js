/**
 * Submodule 3.2: Trend & Velocity Detector
 * Computes directional momentum, linear regression slope, and classifications
 * (Increasing, Decreasing, Stable, Rapidly Changing).
 * Fulfills SRS Section 9 (FR-04.3 Trend Detection).
 */

import { SENSOR_METADATA } from '../telemetry/sensorSchema.js';

export const TREND_TYPES = {
  INCREASING: { id: 'increasing', label: 'Increasing', icon: '↗', color: '#f59e0b' },
  DECREASING: { id: 'decreasing', label: 'Decreasing', icon: '↘', color: '#3b82f6' },
  STABLE: { id: 'stable', label: 'Stable', icon: '→', color: '#10b981' },
  RAPIDLY_CHANGING: { id: 'rapidly_changing', label: 'Rapidly Changing', icon: '⚡', color: '#ef4444' }
};

// Sensitivity criteria for classification (units per hour)
const SENSOR_SENSITIVITY = {
  temperature: { stableThreshold: 0.3, rapidThreshold: 4.0 },
  humidity: { stableThreshold: 1.5, rapidThreshold: 12.0 },
  pressure: { stableThreshold: 0.5, rapidThreshold: 4.0 },
  gas: { stableThreshold: 15, rapidThreshold: 120 },
  light: { stableThreshold: 30, rapidThreshold: 300 },
  distance: { stableThreshold: 2.0, rapidThreshold: 30.0 }
};

export class TrendDetector {
  /**
   * Detects the trend of a sensor parameter over a recent window
   * @param {Array<Object>} readings Array of telemetry readings
   * @param {string} sensorKey Sensor identifier
   * @param {number} windowMinutes Evaluation time window in minutes (default: 30)
   * @returns {Object} Trend analysis result
   */
  static detectTrend(readings, sensorKey, windowMinutes = 30) {
    const meta = SENSOR_METADATA[sensorKey] || { name: sensorKey, unit: '', decimals: 1 };
    const sensitivity = SENSOR_SENSITIVITY[sensorKey] || { stableThreshold: 1.0, rapidThreshold: 5.0 };

    const fallback = {
      sensorKey,
      trend: TREND_TYPES.STABLE.id,
      label: TREND_TYPES.STABLE.label,
      icon: TREND_TYPES.STABLE.icon,
      color: TREND_TYPES.STABLE.color,
      slopePerHour: 0,
      delta: 0,
      windowMinutes,
      sampleCount: 0,
      summary: `${meta.name} is stable.`
    };

    if (!Array.isArray(readings) || readings.length === 0) {
      return fallback;
    }

    // Filter readings within recent window
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    const cutoff = now - windowMs;

    let windowReadings = readings.filter(r => new Date(r.timestamp).getTime() >= cutoff);
    // If window has too few points, use the last N points available (minimum 2 points)
    if (windowReadings.length < 2) {
      windowReadings = readings.slice(-15);
    }
    if (windowReadings.length < 2) {
      return fallback;
    }

    // Extract time (in minutes from start) and values
    const startTime = new Date(windowReadings[0].timestamp).getTime();
    const points = [];
    for (const r of windowReadings) {
      const val = r[sensorKey];
      if (typeof val === 'number' && !Number.isNaN(val)) {
        const tMinutes = (new Date(r.timestamp).getTime() - startTime) / 60000;
        points.push({ x: tMinutes, y: val });
      }
    }

    if (points.length < 2) {
      return fallback;
    }

    const n = points.length;
    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < n; i++) {
      sumX += points[i].x;
      sumY += points[i].y;
    }
    const meanX = sumX / n;
    const meanY = sumY / n;

    // Linear regression slope: m = sum((x - meanX) * (y - meanY)) / sum((x - meanX)^2)
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      const dx = points[i].x - meanX;
      const dy = points[i].y - meanY;
      numerator += dx * dy;
      denominator += dx * dx;
    }

    // Slope in units per minute
    const slopePerMinute = denominator !== 0 ? numerator / denominator : 0;
    const slopePerHour = slopePerMinute * 60;
    const delta = points[points.length - 1].y - points[0].y;
    const absSlopePerHour = Math.abs(slopePerHour);

    // Classify
    let classification = TREND_TYPES.STABLE;

    if (absSlopePerHour >= sensitivity.rapidThreshold) {
      classification = TREND_TYPES.RAPIDLY_CHANGING;
    } else if (slopePerHour > sensitivity.stableThreshold) {
      classification = TREND_TYPES.INCREASING;
    } else if (slopePerHour < -sensitivity.stableThreshold) {
      classification = TREND_TYPES.DECREASING;
    } else {
      classification = TREND_TYPES.STABLE;
    }

    // Generate human-readable summary matching SRS FR-04.3 example
    const actualElapsedMin = Math.round(points[points.length - 1].x);
    const timePhrase = actualElapsedMin > 0 ? `the last ${actualElapsedMin} minutes` : 'recent readings';
    const deltaSigned = delta > 0 ? `+${delta.toFixed(meta.decimals)}` : `${delta.toFixed(meta.decimals)}`;

    let summary = '';
    if (classification === TREND_TYPES.RAPIDLY_CHANGING) {
      summary = `${meta.name} is rapidly changing (${deltaSigned} ${meta.unit}) during ${timePhrase}.`;
    } else if (classification === TREND_TYPES.INCREASING) {
      summary = `${meta.name} has increased by ${deltaSigned} ${meta.unit} during ${timePhrase}.`;
    } else if (classification === TREND_TYPES.DECREASING) {
      summary = `${meta.name} has decreased by ${deltaSigned} ${meta.unit} during ${timePhrase}.`;
    } else {
      summary = `${meta.name} has remained stable during ${timePhrase}.`;
    }

    return {
      sensorKey,
      trend: classification.id,
      label: classification.label,
      icon: classification.icon,
      color: classification.color,
      slopePerHour: Number(slopePerHour.toFixed(2)),
      delta: Number(delta.toFixed(meta.decimals)),
      windowMinutes: actualElapsedMin,
      sampleCount: n,
      summary
    };
  }

  /**
   * Detects trends across all sensors simultaneously
   * @param {Array<Object>} readings 
   * @param {number} windowMinutes 
   * @returns {Object} Map of sensorKey -> trend result
   */
  static detectAllTrends(readings, windowMinutes = 30) {
    const keys = ['temperature', 'humidity', 'pressure', 'gas', 'light', 'distance'];
    const results = {};
    for (const k of keys) {
      results[k] = this.detectTrend(readings, k, windowMinutes);
    }
    return results;
  }
}
