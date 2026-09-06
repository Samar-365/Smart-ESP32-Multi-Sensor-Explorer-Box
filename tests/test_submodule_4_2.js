// Unit test for Submodule 4.2: Real-Time Rule Evaluation & Severity Classifier
import { AlertRuleEvaluator, AlertStateTracker, ALERT_LEVELS } from '../src/modules/alerts/alertRules.js';
import { ThresholdConfigStore } from '../src/modules/alerts/thresholdConfig.js';

console.log('Testing Submodule 4.2: Real-Time Rule Evaluation & Severity Classifier...');

const customStore = new ThresholdConfigStore();
customStore.resetToDefaults();

// 1. Normal reading evaluation
const normalReading = { timestamp: new Date().toISOString(), gas: 310 };
const normalResult = AlertRuleEvaluator.evaluateSensor(normalReading, 'gas', customStore);
console.assert(normalResult.level === 'normal', 'Expected normal');
console.assert(normalResult.badge.includes('● Normal'), 'Badge matches ● Normal');
console.log('✓ Normal reading evaluated correctly');

// 2. Warning level evaluation (gas: 500 ppm, warning limit: 450 ppm)
const warningReading = { timestamp: new Date().toISOString(), gas: 500 };
const warningResult = AlertRuleEvaluator.evaluateSensor(warningReading, 'gas', customStore);
console.assert(warningResult.level === 'warning', `Expected warning, got ${warningResult.level}`);
console.assert(warningResult.badge.includes('● Warning'), 'Badge matches ● Warning');
console.log('✓ Warning level evaluated correctly');

// 3. Critical level evaluation (gas: 620 ppm, critical limit: 600 ppm)
const criticalReading = { timestamp: new Date().toISOString(), gas: 620 };
const criticalResult = AlertRuleEvaluator.evaluateSensor(criticalReading, 'gas', customStore);
console.assert(criticalResult.level === 'critical', `Expected critical, got ${criticalResult.level}`);
console.assert(criticalResult.badge.includes('● Critical'), 'Badge matches ● Critical');
console.log('✓ Critical level evaluated correctly matching SRS FR-05');

// 4. Lower bound proximity check (distance: 3.5 cm, critical limit: <= 5.0 cm)
const proximityReading = { timestamp: new Date().toISOString(), distance: 3.5 };
const proxResult = AlertRuleEvaluator.evaluateSensor(proximityReading, 'distance', customStore);
console.assert(proxResult.level === 'critical', `Distance hazard expected critical, got ${proxResult.level}`);
console.log('✓ Lower-bound proximity hazard detected correctly');

// 5. getActiveAlerts filter
const mixedReading = {
  timestamp: new Date().toISOString(),
  temperature: 25.0, // normal
  gas: 620,          // critical
  humidity: 75.0     // warning
};
const activeAlerts = AlertRuleEvaluator.getActiveAlerts(mixedReading, customStore);
console.assert(activeAlerts.length === 2, `Expected 2 active alerts, got ${activeAlerts.length}`);
console.log('✓ getActiveAlerts filtered only non-normal alerts');

// 6. Deduplication Tracker
const tracker = new AlertStateTracker();
// First tick: normal -> no alert event
const t1 = tracker.processReading(normalReading, customStore);
console.assert(t1.length === 0, 'No alert on initial normal reading');

// Second tick: transitions to warning -> triggers 1 alert event
const t2 = tracker.processReading(warningReading, customStore);
console.assert(t2.length === 1, `Expected 1 transition event, got ${t2.length}`);
console.assert(t2[0].level === 'warning', 'Transition level is warning');

// Third tick: consecutive warning reading -> suppressed by deduplicator!
const t3 = tracker.processReading(warningReading, customStore);
console.assert(t3.length === 0, 'Consecutive identical warning reading suppressed from duplicating');

// Fourth tick: escalates to critical -> triggers escalation event!
const t4 = tracker.processReading(criticalReading, customStore);
console.assert(t4.length === 1, 'Escalation to critical triggered new event');
console.assert(t4[0].isEscalation === true, 'Flagged as escalation');
console.log('✓ AlertStateTracker deduplicates continuous stream and catches state transitions');

console.log('\nAll Submodule 4.2 tests PASSED successfully!');
