/**
 * Submodule 3.6: Anomaly Detection Engine
 * Detects statistical outliers and sudden irregular spikes in sensor data
 * using rolling Z-Score (Z = (x - mu) / sigma) and moving-window normal ranges.
 * Fulfills SRS Section 13 (FR-04.7 Anomaly Detection).
 */

import { SENSOR_METADATA } from '../telemetry/sensorSchema.js';

export class AnomalyDetector {
  /**
   * Evaluates a sensor reading against recent historical baseline to detect anomalies
   * @param {Array<Object>} historicalReadings Recent readings (last 30-60 minutes)
   * @param {Object} latestReading The current reading to evaluate
   * @param {string} sensorKey Sensor identifier (e.g. 'gas', 'temperature', 'humidity')
   * @param {number} zThreshold Z-Score threshold (default: 2.5 standard deviations)
   * @returns {Object|null} Anomaly report or null if normal
   */
  static evaluateSensor(historicalReadings, latestReading, sensorKey, zThreshold = 2.5) {
    if (!latestReading || typeof latestReading[sensorKey] !== 'number') {
      return null;
    }

    const meta = SENSOR_METADATA[sensorKey] || { name: sensorKey, unit: '', decimals: 1 };
    const currentVal = latestReading[sensorKey];

    // Need at least 5 historical points to compute meaningful statistical baseline
    if (!Array.isArray(historicalReadings) || historicalReadings.length < 5) {
      return null;
    }

    const values = [];
    for (const r of historicalReadings) {
      const v = r[sensorKey];
      if (typeof v === 'number' && !Number.isNaN(v)) {
        values.push(v);
      }
    }

    if (values.length < 5) {
      return null;
    }

    // Exclude current point from baseline calculation if it is already in array
    const baselineValues = values.slice(0, -1);
    const n = baselineValues.length;
    if (n < 4) return null;

    const sum = baselineValues.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;

    let varianceSum = 0;
    for (let i = 0; i < n; i++) {
      const diff = baselineValues[i] - mean;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / n);

    // If standard deviation is extremely tiny (sensor is completely flat), establish minimal noise floor
    const minNoiseFloor = {
      temperature: 0.3,
      humidity: 1.0,
      pressure: 0.5,
      gas: 15,
      light: 25,
      distance: 2.0
    }[sensorKey] || 1.0;

    const effectiveStdDev = Math.max(stdDev, minNoiseFloor);
    const diffFromMean = currentVal - mean;
    const zScore = diffFromMean / effectiveStdDev;

    // Estimate normal expected range (mean +- 2 * effectiveStdDev)
    const normalMin = Math.round((mean - 2 * effectiveStdDev) * 10) / 10;
    const normalMax = Math.round((mean + 2 * effectiveStdDev) * 10) / 10;

    const isAnomaly = Math.abs(zScore) >= zThreshold;

    if (!isAnomaly) {
      return null;
    }

    const direction = zScore > 0 ? 'higher' : 'lower';
    const formattedCurrent = currentVal.toFixed(meta.decimals);
    const message = `The current reading (${formattedCurrent} ${meta.unit}) is significantly ${direction} than recent baseline (avg ${mean.toFixed(meta.decimals)} ${meta.unit}, normal range: ${normalMin}–${normalMax} ${meta.unit}).`;

    return {
      sensorKey,
      sensorName: meta.name,
      unit: meta.unit,
      timestamp: latestReading.timestamp || new Date().toISOString(),
      currentValue: Number(formattedCurrent),
      mean: Number(mean.toFixed(meta.decimals)),
      stdDev: Number(effectiveStdDev.toFixed(meta.decimals)),
      zScore: Number(zScore.toFixed(2)),
      expectedRange: `${normalMin}–${normalMax} ${meta.unit}`,
      direction,
      severity: Math.abs(zScore) >= 3.5 ? 'CRITICAL' : 'WARNING',
      message
    };
  }

  /**
   * Scans all numerical sensors in the latest reading for anomalies
   * @param {Array<Object>} historicalReadings 
   * @param {Object} latestReading 
   * @returns {Array<Object>} List of detected anomalies
   */
  static scanAll(historicalReadings, latestReading) {
    const keys = ['temperature', 'humidity', 'pressure', 'gas', 'light', 'distance'];
    const anomalies = [];

    for (const key of keys) {
      const anomaly = this.evaluateSensor(historicalReadings, latestReading, key);
      if (anomaly) {
        anomalies.push(anomaly);
      }
    }

    return anomalies;
  }
}
