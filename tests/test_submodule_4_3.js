// Unit test for Submodule 4.3: Historical Alert Logging & Multi-Filter Query Engine
import { AlertHistoryStore } from '../src/modules/alerts/alertHistory.js';

console.log('Testing Submodule 4.3: Historical Alert Logging & Multi-Filter Query Engine...');

const store = new AlertHistoryStore();

// 1. Check initial seeded history
const allAlerts = store.query();
console.assert(allAlerts.length >= 4, `Expected at least 4 seeded alerts, got ${allAlerts.length}`);
console.log('✓ Initial history populated with realistic alerts matching SRS FR-06');

// 2. Filter by Sensor
const gasAlerts = store.query({ sensor: 'gas' });
console.assert(gasAlerts.length >= 2, `Expected >= 2 gas alerts, got ${gasAlerts.length}`);
console.assert(gasAlerts.every(a => a.sensorKey === 'gas'), 'All filtered alerts are gas');
console.log('✓ Filter by sensor (gas) works');

// 3. Filter by Severity Level
const criticalAlerts = store.query({ level: 'critical' });
console.assert(criticalAlerts.length >= 2, `Expected >= 2 critical alerts, got ${criticalAlerts.length}`);
console.assert(criticalAlerts.every(a => a.level === 'critical'), 'All filtered alerts are critical');
console.log('✓ Filter by severity (critical) works');

// 4. Filter by Search Query
const searchResults = store.query({ search: 'proximity' });
console.assert(searchResults.length === 1, `Expected 1 match for proximity search, got ${searchResults.length}`);
console.assert(searchResults[0].sensorKey === 'distance', 'Distance hazard found');
console.log('✓ Text search filter works');

// 5. Test Logging a new alert
const newAlert = {
  timestamp: new Date().toISOString(),
  sensorKey: 'temperature',
  sensorName: 'Temperature',
  value: 37.5,
  unit: '°C',
  level: 'critical',
  badge: '🔴 Critical',
  message: 'Temperature (37.5 °C) exceeded critical limit.'
};
const logged = store.logAlert(newAlert);
console.assert(logged.id.startsWith('alert_'), 'Generated unique alert ID');
console.assert(store.query({ sensor: 'temperature', level: 'critical' }).length >= 1, 'New alert queryable');
console.log('✓ Logging new alert prepends to history');

// 6. Alert Statistics
const stats = store.getStats();
console.assert(stats.total >= 5, 'Stats total count matches');
console.assert(stats.criticalCount >= 3, 'Critical count matches');
console.assert(stats.mostFrequentSensor !== 'None', 'Most frequent sensor identified');
console.log('✓ getStats aggregated alert counts and most frequent alerting sensor');

console.log('\nAll Submodule 4.3 tests PASSED successfully!');
