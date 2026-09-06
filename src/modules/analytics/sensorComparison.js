/**
 * Submodule 3.4: Sensor Relationship & Cross-Correlation Engine
 * Compares two sensor parameters on synchronized dual-axis timelines,
 * calculates Pearson correlation coefficient (r), and interprets environmental dynamics.
 * Fulfills SRS Section 11 (FR-04.5 Sensor Comparison).
 */

import { SENSOR_METADATA } from '../telemetry/sensorSchema.js';

export const COMPARISON_PRESETS = [
  { id: 'temp_vs_humidity', sensor1: 'temperature', sensor2: 'humidity', title: 'Temperature vs Humidity' },
  { id: 'temp_vs_pressure', sensor1: 'temperature', sensor2: 'pressure', title: 'Temperature vs Pressure' },
  { id: 'gas_vs_light', sensor1: 'gas', sensor2: 'light', title: 'Gas Level vs Light Level' },
  { id: 'temp_vs_gas', sensor1: 'temperature', sensor2: 'gas', title: 'Temperature vs Gas Level' },
  { id: 'distance_vs_light', sensor1: 'distance', sensor2: 'light', title: 'Distance vs Light Level' }
];

export class SensorComparisonEngine {
  /**
   * Evaluates relationship and prepares dual-axis charting data for two sensors
   * @param {Array<Object>} readings Chronological array of telemetry readings
   * @param {string} sensorKey1 First sensor identifier
   * @param {string} sensorKey2 Second sensor identifier
   * @returns {Object} Comparison and correlation result
   */
  static compareSensors(readings, sensorKey1, sensorKey2) {
    const meta1 = SENSOR_METADATA[sensorKey1] || { name: sensorKey1, unit: '', color: '#ffffff', decimals: 1 };
    const meta2 = SENSOR_METADATA[sensorKey2] || { name: sensorKey2, unit: '', color: '#cbd5e1', decimals: 1 };

    const fallback = {
      sensor1: { key: sensorKey1, name: meta1.name, unit: meta1.unit, color: meta1.color },
      sensor2: { key: sensorKey2, name: meta2.name, unit: meta2.unit, color: meta2.color },
      correlation: 0,
      relationship: 'Insufficient Data',
      description: 'Not enough data points to compute correlation.',
      sampleCount: 0,
      chartData: {
        labels: [],
        datasets: []
      }
    };

    if (!Array.isArray(readings) || readings.length < 2) {
      return fallback;
    }

    // Extract aligned pairs
    const pairs = [];
    const labels = [];
    const data1 = [];
    const data2 = [];

    for (const r of readings) {
      const v1 = r[sensorKey1];
      const v2 = r[sensorKey2];
      if (typeof v1 === 'number' && !Number.isNaN(v1) &&
          typeof v2 === 'number' && !Number.isNaN(v2)) {
        pairs.push({ x: v1, y: v2 });
        labels.push(r.timestamp);
        data1.push(Number(v1.toFixed(meta1.decimals)));
        data2.push(Number(v2.toFixed(meta2.decimals)));
      }
    }

    const n = pairs.length;
    if (n < 2) {
      return fallback;
    }

    // Pearson correlation: r = sum((x - mx)(y - my)) / sqrt(sum(dx^2) * sum(dy^2))
    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < n; i++) {
      sumX += pairs[i].x;
      sumY += pairs[i].y;
    }
    const meanX = sumX / n;
    const meanY = sumY / n;

    let numerator = 0;
    let sumSqX = 0;
    let sumSqY = 0;

    for (let i = 0; i < n; i++) {
      const dx = pairs[i].x - meanX;
      const dy = pairs[i].y - meanY;
      numerator += dx * dy;
      sumSqX += dx * dx;
      sumSqY += dy * dy;
    }

    const denominator = Math.sqrt(sumSqX * sumSqY);
    let r = 0;
    if (denominator !== 0) {
      r = Math.max(-1.0, Math.min(1.0, numerator / denominator));
    }

    // Classify correlation
    let relationship = '';
    let description = '';

    if (r >= 0.7) {
      relationship = 'Strong Positive';
      description = `Strong positive correlation (r = ${r.toFixed(2)}). As ${meta1.name} increases, ${meta2.name} tends to increase significantly.`;
    } else if (r >= 0.3) {
      relationship = 'Moderate Positive';
      description = `Moderate positive correlation (r = ${r.toFixed(2)}). General upward co-movement observed between ${meta1.name} and ${meta2.name}.`;
    } else if (r <= -0.7) {
      relationship = 'Strong Inverse';
      description = `Strong inverse correlation (r = ${r.toFixed(2)}). As ${meta1.name} increases, ${meta2.name} decreases significantly.`;
    } else if (r <= -0.3) {
      relationship = 'Moderate Inverse';
      description = `Moderate inverse correlation (r = ${r.toFixed(2)}). Moderate opposite trend between ${meta1.name} and ${meta2.name}.`;
    } else {
      relationship = 'Weak / Uncorrelated';
      description = `Weak or negligible correlation (r = ${r.toFixed(2)}). ${meta1.name} and ${meta2.name} vary independently.`;
    }

    return {
      sensor1: { key: sensorKey1, name: meta1.name, unit: meta1.unit, color: meta1.color },
      sensor2: { key: sensorKey2, name: meta2.name, unit: meta2.unit, color: meta2.color },
      correlation: Number(r.toFixed(2)),
      relationship,
      description,
      sampleCount: n,
      chartData: {
        labels,
        datasets: [
          {
            label: `${meta1.name} (${meta1.unit})`,
            data: data1,
            borderColor: meta1.color,
            backgroundColor: `${meta1.color}20`,
            yAxisID: 'y1',
            tension: 0.3,
            fill: false
          },
          {
            label: `${meta2.name} (${meta2.unit})`,
            data: data2,
            borderColor: meta2.color,
            backgroundColor: `${meta2.color}20`,
            yAxisID: 'y2',
            tension: 0.3,
            fill: false
          }
        ]
      }
    };
  }
}
