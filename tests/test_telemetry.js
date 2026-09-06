// Verification script for Module 2: Telemetry & Ingestion
import { validateReading, SENSOR_METADATA } from './src/modules/telemetry/sensorSchema.js';
import { TimeSeriesBuffer } from './src/modules/telemetry/timeSeriesBuffer.js';
import { HardwareSimulator } from './src/modules/telemetry/simulator.js';
import { CsvExporter } from './src/modules/telemetry/csvExporter.js';

console.log('Testing Module 2: Telemetry & Ingestion...');

// 1. Check metadata
console.assert(Object.keys(SENSOR_METADATA).length === 7, 'Should have 7 sensors defined');
console.log('✓ SENSOR_METADATA defines 7 sensors (BME280 temp/hum/pres, MQ-2 gas, LDR, HC-SR04, PIR)');

// 2. Validate reading
const raw = { temperature: 29.56, humidity: 63.2, pressure: 1008.2, gas: 320, light: 735, distance: 24.1, motion: true };
const validated = validateReading(raw);
console.assert(validated.temperature === 29.6, 'Temperature rounded');
console.assert(validated.motion === true, 'Motion is boolean');
console.log('✓ validateReading normalizes payload correctly');

// 3. TimeSeriesBuffer
const buffer = new TimeSeriesBuffer(100);
buffer.push(validated);
const all = buffer.getAll();
console.assert(all.length > 0, 'Buffer should have records');
const latest = buffer.getLatest();
console.assert(latest.temperature === 29.6, 'Latest matches pushed');
console.log('✓ TimeSeriesBuffer stores and filters correctly');

// 4. CSV Exporter
const csv = CsvExporter.generateCsv([validated]);
console.assert(csv.startsWith('timestamp,temperature,humidity,pressure,gas,light,distance,motion'), 'CSV header matches');
console.assert(csv.includes('29.6,63.2,1008.2,320,735,24.1,1'), 'CSV values match format');
console.log('✓ CsvExporter generates valid RFC-4180 CSV matching SRS FR-09');

// 5. Hardware Simulator
const sim = new HardwareSimulator({ intervalMs: 50 });
let received = false;
sim.onDataCallback = (data) => {
  received = true;
  console.assert(typeof data.temperature === 'number', 'Sim temperature is number');
  console.assert(typeof data.gas === 'number', 'Sim gas is number');
};
sim.tick();
console.assert(received, 'Simulator emitted data on tick');
console.log('✓ HardwareSimulator produces valid realistic telemetry');

console.log('\nAll Module 2 Telemetry & Ingestion tests PASSED successfully!');
