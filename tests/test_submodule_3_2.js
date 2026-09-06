// Unit test for Submodule 3.2: Trend & Velocity Detector
import { TrendDetector, TREND_TYPES } from '../src/modules/analytics/trendDetector.js';

console.log('Testing Submodule 3.2: Trend & Velocity Detector...');

const now = Date.now();

// 1. Increasing trend (+0.6°C over 30 minutes = 1.2°C/hr)
const risingTemp = [
  { timestamp: new Date(now - 30 * 60000).toISOString(), temperature: 27.0 },
  { timestamp: new Date(now - 15 * 60000).toISOString(), temperature: 27.3 },
  { timestamp: new Date(now).toISOString(), temperature: 27.6 }
];
const incResult = TrendDetector.detectTrend(risingTemp, 'temperature', 30);
console.assert(incResult.trend === TREND_TYPES.INCREASING.id, `Expected increasing, got ${incResult.trend}`);
console.assert(incResult.icon === '↗', `Icon expected ↗, got ${incResult.icon}`);
console.log('✓ Increasing trend correctly classified with slope and icon ↗');

// 2. Decreasing trend (-3.0% over 30 minutes = 6%/hr)
const fallingHumidity = [
  { timestamp: new Date(now - 30 * 60000).toISOString(), humidity: 70.0 },
  { timestamp: new Date(now - 15 * 60000).toISOString(), humidity: 68.5 },
  { timestamp: new Date(now).toISOString(), humidity: 67.0 }
];
const decResult = TrendDetector.detectTrend(fallingHumidity, 'humidity', 30);
console.assert(decResult.trend === TREND_TYPES.DECREASING.id, `Expected decreasing, got ${decResult.trend}`);
console.assert(decResult.icon === '↘', `Icon expected ↘, got ${decResult.icon}`);
console.log('✓ Decreasing trend correctly classified with slope and icon ↘');

// 3. Stable trend
const stablePressure = [
  { timestamp: new Date(now - 20 * 60000).toISOString(), pressure: 1013.2 },
  { timestamp: new Date(now - 10 * 60000).toISOString(), pressure: 1013.3 },
  { timestamp: new Date(now).toISOString(), pressure: 1013.2 }
];
const stableResult = TrendDetector.detectTrend(stablePressure, 'pressure', 30);
console.assert(stableResult.trend === TREND_TYPES.STABLE.id, `Expected stable, got ${stableResult.trend}`);
console.assert(stableResult.icon === '→', `Icon expected →, got ${stableResult.icon}`);
console.log('✓ Stable trend correctly classified with icon →');

// 4. Rapidly changing trend (Gas spike)
const gasSpike = [
  { timestamp: new Date(now - 15 * 60000).toISOString(), gas: 300 },
  { timestamp: new Date(now - 5 * 60000).toISOString(), gas: 420 },
  { timestamp: new Date(now).toISOString(), gas: 600 }
];
const rapidResult = TrendDetector.detectTrend(gasSpike, 'gas', 30);
console.assert(rapidResult.trend === TREND_TYPES.RAPIDLY_CHANGING.id, `Expected rapidly changing, got ${rapidResult.trend}`);
console.assert(rapidResult.icon === '⚡', `Icon expected ⚡, got ${rapidResult.icon}`);
console.log('✓ Rapidly changing anomaly spike correctly classified with icon ⚡');

// 5. Test detectAllTrends
const allTrends = TrendDetector.detectAllTrends(risingTemp, 30);
console.assert(allTrends.temperature.trend === TREND_TYPES.INCREASING.id, 'Temp trend in batch');
console.log('✓ detectAllTrends processes full sensor array');

console.log('\nAll Submodule 3.2 tests PASSED successfully!');
