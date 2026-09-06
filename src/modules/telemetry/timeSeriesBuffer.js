/**
 * Submodule 2: Telemetry & Ingestion - TimeSeries Buffer
 * In-memory rolling circular buffer with local persistence and query filtering.
 * Fulfills SRS FR-08 (Historical Data Storage & Retrieval).
 */

import { validateReading } from './sensorSchema.js';

const STORAGE_KEY = 'esp32_explorer_history_v1';
const MAX_BUFFER_POINTS = 2500;

export class TimeSeriesBuffer {
  constructor(maxPoints = MAX_BUFFER_POINTS) {
    this.maxPoints = maxPoints;
    this.buffer = [];
    this.loadFromStorage();
    if (this.buffer.length === 0) {
      this.generateHistoricalSeedData();
    }
  }

  /**
   * Appends a validated reading and enforces circular buffer limits
   */
  push(rawReading) {
    const reading = validateReading(rawReading);
    this.buffer.push(reading);
    if (this.buffer.length > this.maxPoints) {
      this.buffer.shift();
    }
    this.saveToStorageDebounced();
    return reading;
  }

  /**
   * Returns all readings in memory
   */
  getAll() {
    return [...this.buffer];
  }

  /**
   * Returns latest single reading
   */
  getLatest() {
    if (this.buffer.length === 0) return null;
    return this.buffer[this.buffer.length - 1];
  }

  /**
   * Queries records by time duration
   * @param {string} range '1h' | '6h' | '24h' | '7d' | 'all' | 'custom'
   * @param {Object} customRange { start: Date|string, end: Date|string }
   */
  getByTimeRange(range = '1h', customRange = null) {
    if (this.buffer.length === 0) return [];
    const now = Date.now();

    if (range === 'custom' && customRange?.start && customRange?.end) {
      const startMs = new Date(customRange.start).getTime();
      const endMs = new Date(customRange.end).getTime();
      return this.buffer.filter(item => {
        const itemMs = new Date(item.timestamp).getTime();
        return itemMs >= startMs && itemMs <= endMs;
      });
    }

    const durationMap = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };

    const windowMs = durationMap[range] || durationMap['1h'];
    const cutoffMs = now - windowMs;

    return this.buffer.filter(item => new Date(item.timestamp).getTime() >= cutoffMs);
  }

  /**
   * Generates realistic historical dataset spanning the past 24 hours
   * so graphs and analytics look rich on first load
   */
  generateHistoricalSeedData() {
    const points = 160;
    const now = Date.now();
    const intervalMs = (24 * 3600 * 1000) / points;

    for (let i = points; i >= 0; i--) {
      const time = new Date(now - i * intervalMs).toISOString();
      const hourOfDay = new Date(time).getHours();

      // Diurnal curve for ambient temperature and humidity
      const diurnalOffset = Math.sin(((hourOfDay - 6) / 24) * 2 * Math.PI) * 4.2;
      const temp = 28.5 + diurnalOffset + (Math.random() - 0.5) * 0.7;
      const humidity = 63.0 - diurnalOffset * 2.2 + (Math.random() - 0.5) * 1.5;
      const pressure = 1008.5 + Math.sin(i / 15) * 2.5 + (Math.random() - 0.5) * 0.8;

      // Realistic Gas (ppm) baseline with a simulated threshold event
      let gas = 310 + Math.floor((Math.random() - 0.45) * 40);
      if (i >= 30 && i <= 34) {
        gas = 580 + (i - 30) * 35; // Simulated gas warning spike
      }

      // Light level depends on day vs night
      const isDay = hourOfDay >= 6 && hourOfDay <= 18;
      const light = isDay ? 680 + Math.floor(Math.random() * 250) : 70 + Math.floor(Math.random() * 50);

      // Distance and motion
      const distance = Math.max(12, Math.min(180, 42 + Math.sin(i / 7) * 25 + (Math.random() - 0.5) * 8));
      const motion = Math.random() < (isDay ? 0.22 : 0.04);

      this.buffer.push({
        timestamp: time,
        temperature: Number(temp.toFixed(1)),
        humidity: Number(Math.max(20, Math.min(95, humidity)).toFixed(1)),
        pressure: Number(pressure.toFixed(1)),
        gas: Math.max(50, gas),
        light: Math.max(0, Math.min(1023, light)),
        distance: Number(distance.toFixed(1)),
        motion: motion,
        telemetry: {
          rssi: -55 - Math.floor(Math.random() * 10),
          ssid: 'ESP32_Explorer_Lab',
          ip: '192.168.1.142',
          firmware: 'v1.0.0-ioe',
          freeHeap: 184500
        }
      });
    }

    this.saveToStorage();
  }

  saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const slice = this.buffer.slice(-400); // Persist latest 400 points
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slice));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  saveToStorageDebounced() {
    if (typeof localStorage === 'undefined') return;
    if (this._saveTimeout) return;
    this._saveTimeout = setTimeout(() => {
      this.saveToStorage();
      this._saveTimeout = null;
    }, 4000);
  }

  loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.buffer = parsed.map(validateReading);
        }
      }
    } catch (e) {
      console.warn('Failed to restore telemetry history:', e);
      this.buffer = [];
    }
  }

  clear() {
    this.buffer = [];
    localStorage.removeItem(STORAGE_KEY);
  }
}
