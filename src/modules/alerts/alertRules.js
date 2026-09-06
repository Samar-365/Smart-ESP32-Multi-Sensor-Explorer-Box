/**
 * Submodule 4.2: Real-Time Rule Evaluation & Severity Classifier
 * Evaluates live telemetry against thresholds, classifies into Normal, Warning, Critical,
 * and manages edge-triggered alert transition events.
 * Fulfills SRS Section 16 (FR-05 Alerts).
 */

import { SENSOR_METADATA } from '../telemetry/sensorSchema.js';
import { thresholdStore } from './thresholdConfig.js';

export const ALERT_LEVELS = {
  NORMAL: { id: 'normal', label: 'Normal', badge: '🟢 Normal', color: '#10b981', priority: 0 },
  WARNING: { id: 'warning', label: 'Warning', badge: '🟡 Warning', color: '#f59e0b', priority: 1 },
  CRITICAL: { id: 'critical', label: 'Critical', badge: '🔴 Critical', color: '#ef4444', priority: 2 }
};

export class AlertRuleEvaluator {
  /**
   * Evaluates a single sensor reading against configured thresholds
   * @param {Object} reading Latest telemetry reading
   * @param {string} sensorKey Sensor key
   * @param {Object} customStore Optional threshold store override
   * @returns {Object} Alert evaluation result
   */
  static evaluateSensor(reading, sensorKey, customStore = thresholdStore) {
    if (!reading || typeof reading[sensorKey] !== 'number') {
      return null;
    }

    const meta = SENSOR_METADATA[sensorKey] || { name: sensorKey, unit: '', decimals: 1 };
    const cfg = customStore.get(sensorKey);
    if (!cfg) return null;

    const val = reading[sensorKey];
    const op = cfg.operator || '>';
    const warningLimit = cfg.warning;
    const criticalLimit = cfg.critical;

    let level = ALERT_LEVELS.NORMAL;
    let breachedLimit = null;

    if (op === '<') {
      // Lower bound check (e.g. proximity distance hazard)
      if (typeof criticalLimit === 'number' && val <= criticalLimit) {
        level = ALERT_LEVELS.CRITICAL;
        breachedLimit = criticalLimit;
      } else if (typeof warningLimit === 'number' && val <= warningLimit) {
        level = ALERT_LEVELS.WARNING;
        breachedLimit = warningLimit;
      }
    } else {
      // Upper bound check (e.g. gas, temperature, humidity)
      if (typeof criticalLimit === 'number' && val >= criticalLimit) {
        level = ALERT_LEVELS.CRITICAL;
        breachedLimit = criticalLimit;
      } else if (typeof warningLimit === 'number' && val >= warningLimit) {
        level = ALERT_LEVELS.WARNING;
        breachedLimit = warningLimit;
      }
    }

    const timestamp = reading.timestamp || new Date().toISOString();
    const formattedVal = Number(val.toFixed(meta.decimals));

    let message = `${meta.name} is within normal parameters.`;
    if (level === ALERT_LEVELS.CRITICAL) {
      message = `${meta.name} (${formattedVal} ${meta.unit}) has breached critical safety threshold (${breachedLimit} ${meta.unit}).`;
    } else if (level === ALERT_LEVELS.WARNING) {
      message = `${meta.name} (${formattedVal} ${meta.unit}) is elevated, exceeding warning limit (${breachedLimit} ${meta.unit}).`;
    }

    return {
      sensorKey,
      sensorName: meta.name,
      value: formattedVal,
      unit: meta.unit,
      level: level.id,
      label: level.label,
      badge: level.badge,
      color: level.color,
      priority: level.priority,
      thresholdBreached: breachedLimit,
      operator: op,
      message,
      timestamp
    };
  }

  /**
   * Evaluates all sensors in a reading payload
   * @param {Object} reading 
   * @param {Object} customStore 
   * @returns {Array<Object>} List of alerts for all sensors
   */
  static evaluateAll(reading, customStore = thresholdStore) {
    const keys = ['gas', 'temperature', 'humidity', 'distance', 'pressure', 'light'];
    const results = [];

    for (const k of keys) {
      const result = this.evaluateSensor(reading, k, customStore);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Filters results to only return active warnings and critical alerts
   * @param {Object} reading 
   * @param {Object} customStore 
   * @returns {Array<Object>} Active non-normal alerts
   */
  static getActiveAlerts(reading, customStore = thresholdStore) {
    return this.evaluateAll(reading, customStore).filter(a => a.level !== ALERT_LEVELS.NORMAL.id);
  }
}

/**
 * State tracker that handles alert transitions and suppresses identical continuous repeats
 */
export class AlertStateTracker {
  constructor() {
    this.sensorStates = {}; // sensorKey -> last level ('normal', 'warning', 'critical')
  }

  /**
   * Processes a new reading and returns alert transition events if state changed
   * @param {Object} reading 
   * @param {Object} customStore 
   * @returns {Array<Object>} Newly triggered or escalated alert events
   */
  processReading(reading, customStore = thresholdStore) {
    const evaluations = AlertRuleEvaluator.evaluateAll(reading, customStore);
    const transitionEvents = [];

    for (const ev of evaluations) {
      const prevLevel = this.sensorStates[ev.sensorKey] || ALERT_LEVELS.NORMAL.id;
      const currentLevel = ev.level;

      // Only trigger an alert record if state transitioned or escalated
      if (currentLevel !== prevLevel) {
        this.sensorStates[ev.sensorKey] = currentLevel;

        if (currentLevel !== ALERT_LEVELS.NORMAL.id) {
          transitionEvents.push({
            ...ev,
            isEscalation: currentLevel === ALERT_LEVELS.CRITICAL.id && prevLevel === ALERT_LEVELS.WARNING.id,
            previousLevel: prevLevel
          });
        }
      }
    }

    return transitionEvents;
  }

  reset() {
    this.sensorStates = {};
  }
}
