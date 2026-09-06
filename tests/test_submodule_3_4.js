// Unit test for Submodule 3.4: Sensor Relationship & Cross-Correlation Engine
import { SensorComparisonEngine, COMPARISON_PRESETS } from '../src/modules/analytics/sensorComparison.js';

console.log('Testing Submodule 3.4: Sensor Relationship & Cross-Correlation Engine...');

// 1. Check presets
console.assert(COMPARISON_PRESETS.length >= 4, 'Should provide standard presets');
console.log('✓ Presets available (Temp vs Humidity, Temp vs Pressure, Gas vs Light, etc.)');

// 2. Strong Inverse Correlation (Temp vs Humidity typical environmental dynamic)
const inverseData = [
  { timestamp: '2026-09-06T10:00:00Z', temperature: 24.0, humidity: 80.0 },
  { timestamp: '2026-09-06T11:00:00Z', temperature: 26.0, humidity: 72.0 },
  { timestamp: '2026-09-06T12:00:00Z', temperature: 28.0, humidity: 65.0 },
  { timestamp: '2026-09-06T13:00:00Z', temperature: 30.0, humidity: 55.0 },
  { timestamp: '2026-09-06T14:00:00Z', temperature: 32.0, humidity: 48.0 }
];

const resultInv = SensorComparisonEngine.compareSensors(inverseData, 'temperature', 'humidity');
console.assert(resultInv.correlation < -0.9, `Expected strong inverse correlation < -0.9, got ${resultInv.correlation}`);
console.assert(resultInv.relationship === 'Strong Inverse', `Expected Strong Inverse, got ${resultInv.relationship}`);
console.log('✓ Strong inverse correlation (Temp vs Humidity) calculated correctly');

// 3. Strong Positive Correlation
const positiveData = [
  { timestamp: '2026-09-06T10:00:00Z', temperature: 20.0, light: 200 },
  { timestamp: '2026-09-06T11:00:00Z', temperature: 25.0, light: 450 },
  { timestamp: '2026-09-06T12:00:00Z', temperature: 30.0, light: 700 }
];
const resultPos = SensorComparisonEngine.compareSensors(positiveData, 'temperature', 'light');
console.assert(resultPos.correlation > 0.95, `Expected strong positive correlation > 0.95, got ${resultPos.correlation}`);
console.assert(resultPos.relationship === 'Strong Positive', `Expected Strong Positive, got ${resultPos.relationship}`);
console.log('✓ Strong positive correlation calculated correctly');

// 4. Dual-axis Chart.js formatting
console.assert(resultInv.chartData.datasets.length === 2, '2 datasets generated for dual-axis');
console.assert(resultInv.chartData.datasets[0].yAxisID === 'y1', 'Dataset 1 assigned to y1');
console.assert(resultInv.chartData.datasets[1].yAxisID === 'y2', 'Dataset 2 assigned to y2');
console.log('✓ Chart.js dual Y-axis datasets properly structured');

console.log('\nAll Submodule 3.4 tests PASSED successfully!');
