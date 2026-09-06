/**
 * Submodule 2: Telemetry & Ingestion - Sensor Schema & Metadata
 * Defines specifications, units, ranges, and validation for ESP32 Explorer Box.
 * Fulfills SRS Section 6 (FR-02) & Section 28.
 */

export const SENSOR_METADATA = {
  temperature: {
    id: 'temperature',
    name: 'Temperature',
    sensor: 'BME280',
    unit: '°C',
    icon: 'thermometer',
    color: '#ffffff',
    minRange: -40,
    maxRange: 85,
    defaultWarning: 32.0,
    defaultCritical: 36.0,
    decimals: 1,
    description: 'Ambient air temperature measured via digital BME280 sensor over I2C.'
  },
  humidity: {
    id: 'humidity',
    name: 'Humidity',
    sensor: 'BME280',
    unit: '%',
    icon: 'droplet',
    color: '#94a3b8',
    minRange: 0,
    maxRange: 100,
    defaultWarning: 70.0,
    defaultCritical: 85.0,
    decimals: 1,
    description: 'Relative humidity of the surrounding air measured via BME280 capacitive element.'
  },
  pressure: {
    id: 'pressure',
    name: 'Atmospheric Pressure',
    sensor: 'BME280',
    unit: 'hPa',
    icon: 'gauge',
    color: '#cbd5e1',
    minRange: 300,
    maxRange: 1100,
    defaultWarning: 1025.0,
    defaultCritical: 1040.0,
    decimals: 1,
    description: 'Barometric air pressure measured via BME280 piezo-resistive sensor.'
  },
  gas: {
    id: 'gas',
    name: 'Gas Level',
    sensor: 'MQ-2',
    unit: 'ppm',
    icon: 'flame',
    color: '#ffffff',
    minRange: 0,
    maxRange: 1000,
    defaultWarning: 450.0,
    defaultCritical: 600.0,
    decimals: 0,
    description: 'Combustible gas and smoke concentration measured via MQ-2 electrochemical sensor.'
  },
  light: {
    id: 'light',
    name: 'Light Level',
    sensor: 'LDR',
    unit: 'ADC',
    icon: 'sun',
    color: '#e2e8f0',
    minRange: 0,
    maxRange: 1023,
    defaultWarning: 900.0,
    defaultCritical: 980.0,
    decimals: 0,
    description: 'Ambient lighting intensity measured via Light Dependent Resistor voltage divider.'
  },
  distance: {
    id: 'distance',
    name: 'Distance',
    sensor: 'HC-SR04',
    unit: 'cm',
    icon: 'ruler',
    color: '#94a3b8',
    minRange: 2,
    maxRange: 400,
    defaultWarning: 15.0,
    defaultCritical: 5.0,
    decimals: 1,
    description: 'Obstacle proximity measured using 40kHz ultrasonic burst timing via HC-SR04.'
  },
  motion: {
    id: 'motion',
    name: 'Motion Status',
    sensor: 'PIR HC-SR501',
    unit: '',
    icon: 'radar',
    color: '#ffffff',
    minRange: 0,
    maxRange: 1,
    defaultWarning: null,
    defaultCritical: null,
    decimals: 0,
    description: 'Infrared motion detection of humans/animals via pyroelectric PIR sensor.'
  }
};

/**
 * Validates and normalizes raw sensor readings matching SRS Section 28
 * @param {Object} raw 
 * @returns {Object} validated reading
 */
export function validateReading(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid reading payload: object expected');
  }

  const timestamp = raw.timestamp ? new Date(raw.timestamp).toISOString() : new Date().toISOString();

  return {
    timestamp,
    temperature: typeof raw.temperature === 'number' ? Number(raw.temperature.toFixed(1)) : 25.0,
    humidity: typeof raw.humidity === 'number' ? Math.max(0, Math.min(100, Number(raw.humidity.toFixed(1)))) : 50.0,
    pressure: typeof raw.pressure === 'number' ? Number(raw.pressure.toFixed(1)) : 1013.2,
    gas: typeof raw.gas === 'number' ? Math.max(0, Math.round(raw.gas)) : 250,
    light: typeof raw.light === 'number' ? Math.max(0, Math.min(1023, Math.round(raw.light))) : 500,
    distance: typeof raw.distance === 'number' ? Math.max(2, Number(raw.distance.toFixed(1))) : 30.0,
    motion: Boolean(raw.motion),
    telemetry: raw.telemetry || {
      rssi: -58,
      ssid: 'ESP32_Explorer_Lab',
      ip: '192.168.1.142',
      firmware: 'v1.0.0-ioe',
      freeHeap: 185000
    }
  };
}
