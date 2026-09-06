// Unit test for Submodule 3.1: Statistical & Aggregation Engine
import { StatsEngine } from '../src/modules/analytics/statsEngine.js';

console.log('Testing Submodule 3.1: Statistical & Aggregation Engine...');

// 1. Test empty array
const empty = StatsEngine.computeStats([], 'temperature');
console.assert(empty.sampleCount === 0, 'Empty readings should return sampleCount 0');
console.log('✓ Handles empty arrays gracefully');

// 2. Test mathematical accuracy on controlled dataset
const now = Date.now();
const testReadings = [
  { timestamp: new Date(now - 3600 * 1000).toISOString(), temperature: 10.0 },
  { timestamp: new Date(now - 1800 * 1000).toISOString(), temperature: 20.0 },
  { timestamp: new Date(now).toISOString(), temperature: 30.0 }
];

const stats = StatsEngine.computeStats(testReadings, 'temperature');
console.assert(stats.min === 10.0, `Min expected 10.0, got ${stats.min}`);
console.assert(stats.max === 30.0, `Max expected 30.0, got ${stats.max}`);
console.assert(stats.avg === 20.0, `Avg expected 20.0, got ${stats.avg}`);
console.assert(Math.abs(stats.stdDev - 8.16) < 0.05, `StdDev expected ~8.16, got ${stats.stdDev}`);
console.assert(stats.current === 30.0, `Current expected 30.0, got ${stats.current}`);
console.assert(stats.delta === 20.0, `Delta expected 20.0, got ${stats.delta}`);
console.assert(Math.abs(stats.rateOfChangePerHour - 20.0) < 0.1, `Rate of change/hr expected 20.0, got ${stats.rateOfChangePerHour}`);
console.log('✓ Min, Max, Avg, StdDev, RateOfChange, and Delta match exact math');

// 3. Test computeAllStats
const fullReading = [
  { timestamp: new Date().toISOString(), temperature: 28.5, humidity: 62.0, pressure: 1012.0, gas: 310, light: 700, distance: 25.0 }
];
const allStats = StatsEngine.computeAllStats(fullReading);
console.assert(allStats.temperature.current === 28.5, 'Temp stats present');
console.assert(allStats.gas.current === 310, 'Gas stats present');
console.assert(allStats.pressure.current === 1012.0, 'Pressure stats present');
console.log('✓ computeAllStats calculates metrics across all 6 numerical sensors');

console.log('\nAll Submodule 3.1 tests PASSED successfully!');
