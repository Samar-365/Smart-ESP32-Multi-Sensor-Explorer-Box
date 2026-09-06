// Unit test for Submodule 3.3: Threshold Violation & Compliance Tracker
import { ThresholdAnalyzer } from '../src/modules/analytics/thresholdAnalyzer.js';

console.log('Testing Submodule 3.3: Threshold Violation & Compliance Tracker...');

const now = Date.now();

// 1. Gas analysis dataset matching SRS Section 10 example
const gasReadings = [
  { timestamp: new Date(now - 40 * 60000).toISOString(), gas: 320 },
  { timestamp: new Date(now - 30 * 60000).toISOString(), gas: 540 }, // breach episode 1 start
  { timestamp: new Date(now - 20 * 60000).toISOString(), gas: 720 }, // peak
  { timestamp: new Date(now - 15 * 60000).toISOString(), gas: 480 }, // normal
  { timestamp: new Date(now - 10 * 60000).toISOString(), gas: 520 }, // breach episode 2 start
  { timestamp: new Date(now).toISOString(), gas: 620 }               // current breach
];

const gasAnalysis = ThresholdAnalyzer.analyzeThreshold(gasReadings, 'gas', 500, '>');

console.assert(gasAnalysis.currentValue === 620, `Current value expected 620, got ${gasAnalysis.currentValue}`);
console.assert(gasAnalysis.status === 'HIGH', `Status expected HIGH, got ${gasAnalysis.status}`);
console.assert(gasAnalysis.statusBadge.includes('🔴 HIGH'), `Badge expected 🔴 HIGH, got ${gasAnalysis.statusBadge}`);
console.assert(gasAnalysis.peakViolation === 720, `Peak violation expected 720, got ${gasAnalysis.peakViolation}`);
console.assert(gasAnalysis.violationCount === 2, `Violation episodes expected 2, got ${gasAnalysis.violationCount}`);
console.assert(gasAnalysis.timeAboveThresholdMs > 0, `Time above threshold should be > 0`);
console.log('✓ Gas threshold analysis matches SRS FR-04.4 exact specification');

// 2. Normal readings test
const normalReadings = [
  { timestamp: new Date(now - 10 * 60000).toISOString(), temperature: 24.5 },
  { timestamp: new Date(now).toISOString(), temperature: 25.2 }
];
const tempAnalysis = ThresholdAnalyzer.analyzeThreshold(normalReadings, 'temperature', 32.0, '>');
console.assert(tempAnalysis.status === 'NORMAL', 'Status is NORMAL');
console.assert(tempAnalysis.violationCount === 0, 'No violations');
console.assert(tempAnalysis.peakViolation === null, 'No peak violation');
console.log('✓ Normal compliant readings verified');

// 3. Lower bound test (e.g. proximity distance < 15 cm)
const distReadings = [
  { timestamp: new Date(now - 5 * 60000).toISOString(), distance: 25.0 },
  { timestamp: new Date(now).toISOString(), distance: 8.5 }
];
const distAnalysis = ThresholdAnalyzer.analyzeThreshold(distReadings, 'distance', 15.0, '<');
console.assert(distAnalysis.isViolated === true, 'Distance is breached (< 15)');
console.assert(distAnalysis.status === 'LOW', 'Status is LOW');
console.log('✓ Lower-bound threshold (< operator) verified');

// 4. Batch analyzeAll
const batch = ThresholdAnalyzer.analyzeAll(gasReadings, {
  gas: 500,
  temperature: 30
});
console.assert(batch.gas.isViolated === true, 'Batch evaluated gas');
console.assert(batch.temperature.isViolated === false, 'Batch evaluated temperature');
console.log('✓ analyzeAll evaluated multi-sensor threshold config');

console.log('\nAll Submodule 3.3 tests PASSED successfully!');
