/**
 * Submodule 4.1: Threshold Configuration & Persistence Store
 * Manages user-configurable Warning and Critical thresholds for all sensors.
 * Fulfills SRS Section 4.2 (Project Administrator) & Section 16 (FR-05 Alerts).
 */

const STORAGE_KEY = 'esp32_threshold_config_v1';

export const DEFAULT_THRESHOLDS = {
  gas: {
    sensorKey: 'gas',
    name: 'Gas Level',
    unit: 'ppm',
    warning: 450,
    critical: 600,
    operator: '>',
    description: 'Combustible gas and smoke detection limit.'
  },
  temperature: {
    sensorKey: 'temperature',
    name: 'Temperature',
    unit: '°C',
    warning: 32.0,
    critical: 36.0,
    operator: '>',
    description: 'Ambient high heat warning threshold.'
  },
  humidity: {
    sensorKey: 'humidity',
    name: 'Humidity',
    unit: '%',
    warning: 70.0,
    critical: 85.0,
    operator: '>',
    description: 'High relative humidity / mold risk limit.'
  },
  pressure: {
    sensorKey: 'pressure',
    name: 'Atmospheric Pressure',
    unit: 'hPa',
    warning: 1025.0,
    critical: 1040.0,
    operator: '>',
    description: 'Elevated barometric pressure threshold.'
  },
  light: {
    sensorKey: 'light',
    name: 'Light Level',
    unit: 'ADC',
    warning: 900,
    critical: 980,
    operator: '>',
    description: 'Excessive brightness threshold.'
  },
  distance: {
    sensorKey: 'distance',
    name: 'Distance',
    unit: 'cm',
    warning: 15.0,
    critical: 5.0,
    operator: '<',
    description: 'Obstacle proximity hazard threshold.'
  }
};

export class ThresholdConfigStore {
  constructor() {
    this.thresholds = this.load();
  }

  /**
   * Returns a deep clone of the factory default thresholds
   */
  getDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS));
  }

  /**
   * Retrieves all active threshold configurations
   */
  getAll() {
    return { ...this.thresholds };
  }

  /**
   * Retrieves threshold config for a specific sensor
   * @param {string} sensorKey 
   */
  get(sensorKey) {
    return this.thresholds[sensorKey] || DEFAULT_THRESHOLDS[sensorKey] || null;
  }

  /**
   * Updates warning and critical thresholds for a sensor
   * @param {string} sensorKey 
   * @param {Object} partial { warning, critical }
   */
  update(sensorKey, partial = {}) {
    if (!this.thresholds[sensorKey]) {
      this.thresholds[sensorKey] = { ...(DEFAULT_THRESHOLDS[sensorKey] || {}) };
    }

    if (typeof partial.warning === 'number' && !Number.isNaN(partial.warning)) {
      this.thresholds[sensorKey].warning = partial.warning;
    }
    if (typeof partial.critical === 'number' && !Number.isNaN(partial.critical)) {
      this.thresholds[sensorKey].critical = partial.critical;
    }

    this.save();
    return this.thresholds[sensorKey];
  }

  /**
   * Resets all sensor thresholds to factory defaults
   */
  resetToDefaults() {
    this.thresholds = this.getDefaults();
    this.save();
    return this.thresholds;
  }

  save() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.thresholds));
    } catch (e) {
      console.warn('Failed to persist threshold configuration:', e);
    }
  }

  load() {
    if (typeof localStorage === 'undefined') {
      return this.getDefaults();
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...this.getDefaults(), ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load threshold config:', e);
    }
    return this.getDefaults();
  }
}

// Export singleton instance
export const thresholdStore = new ThresholdConfigStore();
