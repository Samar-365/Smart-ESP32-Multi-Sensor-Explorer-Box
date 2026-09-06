/**
 * Submodule 4.3: Historical Alert Logging & Multi-Filter Query Engine
 * Maintains persistent timestamped ledger of alerts matching SRS table schema
 * and provides filtering by sensor, status/severity, and date.
 * Fulfills SRS Section 17 (FR-06 Alert History).
 */

const STORAGE_KEY = 'esp32_alert_history_v1';
const MAX_ALERTS = 500;

export class AlertHistoryStore {
  constructor() {
    this.alerts = [];
    this.load();
    if (this.alerts.length === 0) {
      this.seedInitialHistory();
    }
  }

  /**
   * Logs a new alert entry
   * @param {Object} alert Alert object from AlertRuleEvaluator
   * @returns {Object} Formatted and saved alert
   */
  logAlert(alert) {
    if (!alert || alert.level === 'normal') return null;

    const ts = alert.timestamp ? new Date(alert.timestamp) : new Date();
    const pad = n => String(n).padStart(2, '0');
    const hours = ts.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    const formattedTime = `${pad(h12)}:${pad(ts.getMinutes())} ${ampm}`;
    const dateStr = ts.toISOString().slice(0, 10);

    const entry = {
      id: `alert_${ts.getTime()}_${alert.sensorKey}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: ts.toISOString(),
      formattedTime,
      dateStr,
      sensorKey: alert.sensorKey,
      sensorName: alert.sensorName,
      value: alert.value,
      unit: alert.unit,
      formattedValue: `${alert.value} ${alert.unit}`,
      level: alert.level, // 'warning' | 'critical'
      status: alert.badge, // '🔴 Critical' | '🟡 Warning'
      message: alert.message
    };

    // Prepend (latest first)
    this.alerts.unshift(entry);
    if (this.alerts.length > MAX_ALERTS) {
      this.alerts.pop();
    }

    this.save();
    return entry;
  }

  /**
   * Queries alerts matching multi-criteria filters
   * Fulfills SRS FR-06 filter requirement
   * @param {Object} filters { sensor, level, dateRange, search }
   * @returns {Array<Object>} Filtered alerts
   */
  query(filters = {}) {
    let results = [...this.alerts];

    // Filter by Sensor
    if (filters.sensor && filters.sensor !== 'all') {
      results = results.filter(a => a.sensorKey === filters.sensor);
    }

    // Filter by Severity
    if (filters.level && filters.level !== 'all') {
      results = results.filter(a => a.level === filters.level);
    }

    // Filter by Date
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = Date.now();
      const todayStr = new Date().toISOString().slice(0, 10);

      if (filters.dateRange === 'today') {
        results = results.filter(a => a.dateStr === todayStr);
      } else if (filters.dateRange === '24h') {
        const cutoff = now - (24 * 3600 * 1000);
        results = results.filter(a => new Date(a.timestamp).getTime() >= cutoff);
      } else if (filters.dateRange === '7d') {
        const cutoff = now - (7 * 24 * 3600 * 1000);
        results = results.filter(a => new Date(a.timestamp).getTime() >= cutoff);
      } else if (typeof filters.dateRange === 'string' && filters.dateRange.length === 10) {
        // Specific date string: 'YYYY-MM-DD'
        results = results.filter(a => a.dateStr === filters.dateRange);
      }
    }

    // Filter by Search Query
    if (filters.search && typeof filters.search === 'string') {
      const q = filters.search.toLowerCase().trim();
      results = results.filter(a => 
        a.sensorName.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q) ||
        a.formattedValue.toLowerCase().includes(q)
      );
    }

    return results;
  }

  /**
   * Generates summary statistics across alert history
   */
  getStats() {
    const todayStr = new Date().toISOString().slice(0, 10);
    let criticalCount = 0;
    let warningCount = 0;
    let todayCount = 0;
    const sensorCounts = {};

    for (const a of this.alerts) {
      if (a.level === 'critical') criticalCount++;
      if (a.level === 'warning') warningCount++;
      if (a.dateStr === todayStr) todayCount++;
      sensorCounts[a.sensorKey] = (sensorCounts[a.sensorKey] || 0) + 1;
    }

    // Find most frequent sensor
    let mostFrequentSensor = 'None';
    let maxCount = 0;
    for (const [k, count] of Object.entries(sensorCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentSensor = k;
      }
    }

    return {
      total: this.alerts.length,
      criticalCount,
      warningCount,
      todayCount,
      sensorCounts,
      mostFrequentSensor
    };
  }

  /**
   * Populates initial realistic seed alerts matching SRS Section 17 table example:
   * 10:15 PM | Gas | 620 ppm | 🔴 Critical
   * 09:40 PM | Temperature | 34°C | 🟡 Warning
   * 09:05 PM | Gas | 510 ppm | 🟡 Warning
   */
  seedInitialHistory() {
    const now = Date.now();
    const seedEvents = [
      {
        timestamp: new Date(now - 30 * 60000).toISOString(),
        sensorKey: 'gas',
        sensorName: 'Gas',
        value: 620,
        unit: 'ppm',
        level: 'critical',
        badge: '● Critical',
        message: 'Gas Level (620 ppm) exceeded critical safety threshold (600 ppm).'
      },
      {
        timestamp: new Date(now - 65 * 60000).toISOString(),
        sensorKey: 'temperature',
        sensorName: 'Temperature',
        value: 34.0,
        unit: '°C',
        level: 'warning',
        badge: '● Warning',
        message: 'Temperature (34.0 °C) exceeded ambient warning limit (32.0 °C).'
      },
      {
        timestamp: new Date(now - 100 * 60000).toISOString(),
        sensorKey: 'gas',
        sensorName: 'Gas',
        value: 510,
        unit: 'ppm',
        level: 'warning',
        badge: '● Warning',
        message: 'Gas Level (510 ppm) exceeded warning threshold (450 ppm).'
      },
      {
        timestamp: new Date(now - 180 * 60000).toISOString(),
        sensorKey: 'distance',
        sensorName: 'Distance',
        value: 4.5,
        unit: 'cm',
        level: 'critical',
        badge: '● Critical',
        message: 'Obstacle proximity hazard (4.5 cm) breached critical threshold (5.0 cm).'
      }
    ];

    for (const ev of seedEvents.reverse()) {
      this.logAlert(ev);
    }
  }

  save() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.alerts));
    } catch (e) {
      console.warn('Failed to save alert history:', e);
    }
  }

  load() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.alerts = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse alert history:', e);
      this.alerts = [];
    }
  }

  clear() {
    this.alerts = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

// Export singleton instance
export const alertHistory = new AlertHistoryStore();
