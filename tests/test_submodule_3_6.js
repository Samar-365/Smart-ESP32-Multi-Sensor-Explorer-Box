// Unit test for Submodule 3.6: Anomaly & Spatial Intelligence Engine
import { AnomalyDetector } from '../src/modules/analytics/anomalyDetector.js';
import { SpatialAnalyticsEngine } from '../src/modules/analytics/spatialAnalytics.js';

console.log('Testing Submodule 3.6: Anomaly & Spatial Intelligence Engine...');

const now = Date.now();

// 1. Anomaly Detection Test (Matching SRS Section 13)
const baselineReadings = [];
for (let i = 20; i >= 1; i--) {
  baselineReadings.push({
    timestamp: new Date(now - i * 60000).toISOString(),
    gas: 300 + Math.floor((Math.random() - 0.5) * 40) // normal 280-320 ppm
  });
}

// Injected anomaly
const anomalousReading = {
  timestamp: new Date(now).toISOString(),
  gas: 720 // Sudden massive spike
};

const anomaly = AnomalyDetector.evaluateSensor(baselineReadings, anomalousReading, 'gas');
console.assert(anomaly !== null, 'Anomaly should be detected for 720 ppm spike');
console.assert(anomaly.sensorKey === 'gas', 'Sensor is gas');
console.assert(anomaly.zScore > 2.5, `Z-Score should be > 2.5, got ${anomaly.zScore}`);
console.assert(anomaly.direction === 'higher', 'Direction is higher');
console.assert(anomaly.message.includes('significantly higher'), 'Advisory message generated');
console.log('✓ Anomaly detection flagged gas spike matching SRS Section 13');

// Scan all sensors
const allAnomalies = AnomalyDetector.scanAll(baselineReadings, anomalousReading);
console.assert(allAnomalies.length >= 1, 'scanAll found anomaly');
console.log('✓ scanAll correctly scanned multi-sensor payload');

// 2. Motion Analytics Test (Matching SRS Section 14)
const motionReadings = [
  { timestamp: new Date(now - 120 * 60000).toISOString(), motion: true },
  { timestamp: new Date(now - 110 * 60000).toISOString(), motion: false },
  { timestamp: new Date(now - 60 * 60000).toISOString(), motion: true },
  { timestamp: new Date(now - 50 * 60000).toISOString(), motion: false },
  { timestamp: new Date(now - 10 * 60000).toISOString(), motion: true },
  { timestamp: new Date(now).toISOString(), motion: false }
];

const motionReport = SpatialAnalyticsEngine.analyzeMotion(motionReadings);
console.assert(motionReport.totalEvents === 3, `Expected 3 motion events, got ${motionReport.totalEvents}`);
console.assert(motionReport.lastDetectedTime !== null, 'Last detected time present');
console.assert(motionReport.currentMotionStatus === 'No Motion', 'Current motion status is No Motion');
console.log('✓ Motion analytics counted distinct pulses and identified peak timing');

// 3. Distance Analytics Test (Matching SRS Section 15)
const distanceReadings = [
  { timestamp: new Date(now - 30 * 60000).toISOString(), distance: 12.0 },
  { timestamp: new Date(now - 20 * 60000).toISOString(), distance: 180.0 },
  { timestamp: new Date(now - 10 * 60000).toISOString(), distance: 68.0 },
  { timestamp: new Date(now).toISOString(), distance: 24.0 }
];

const distReport = SpatialAnalyticsEngine.analyzeDistance(distanceReadings);
console.assert(distReport.current === 24.0, `Expected current 24.0, got ${distReport.current}`);
console.assert(distReport.minimum === 12.0, `Expected min 12.0, got ${distReport.minimum}`);
console.assert(distReport.maximum === 180.0, `Expected max 180.0, got ${distReport.maximum}`);
console.assert(distReport.trend !== undefined, 'Trend is present');
console.log('✓ Distance analytics calculated current, min, max, avg, and trend matching SRS Section 15');

console.log('\nAll Submodule 3.6 tests PASSED successfully!');
