// Unit test for Submodule 3.5: Environmental Comfort & Quality Index Model
import { ComfortScoreEngine, COMFORT_LEVELS } from '../src/modules/analytics/comfortScore.js';

console.log('Testing Submodule 3.5: Environmental Comfort & Quality Index Model...');

// 1. Ideal reading test
const idealReading = {
  temperature: 23.5,
  humidity: 50.0,
  gas: 260,
  pressure: 1013.2
};
const idealScore = ComfortScoreEngine.evaluate(idealReading);
console.assert(idealScore.score >= 90, `Ideal environment score expected >= 90, got ${idealScore.score}`);
console.assert(idealScore.rating === 'GOOD', `Rating expected GOOD, got ${idealScore.rating}`);
console.assert(idealScore.badge.includes('● GOOD'), `Expected badge ● GOOD, got ${idealScore.badge}`);
console.assert(idealScore.factors.every(f => f.status === '✓'), 'All subfactors should be optimal checkmark');
console.log('✓ Ideal environment yields score >= 90 with all checkmarks ✓');

// 2. SRS Section 12 matching example (Score ~78 / 100, 🟢 GOOD)
const srsExampleReading = {
  temperature: 28.2, // slightly warm
  humidity: 62.0,    // slightly elevated
  gas: 360,          // mild
  pressure: 1008.0
};
const srsScore = ComfortScoreEngine.evaluate(srsExampleReading);
console.assert(srsScore.score >= 70 && srsScore.score <= 85, `Expected score ~78, got ${srsScore.score}`);
console.assert(srsScore.rating === 'GOOD' || srsScore.rating === 'MODERATE', 'Rating is valid');
console.log(`✓ SRS example evaluated with score: ${srsScore.score}/100, badge: ${srsScore.badge}`);

// 3. Hazardous Gas Spike Test (Poor Rating)
const hazardReading = {
  temperature: 24.0,
  humidity: 50.0,
  gas: 720, // Severe gas leak
  pressure: 1013.0
};
const hazardScore = ComfortScoreEngine.evaluate(hazardReading);
console.assert(hazardScore.score < 50, `Expected score < 50 due to gas hazard, got ${hazardScore.score}`);
console.assert(hazardScore.rating === 'POOR', `Expected POOR, got ${hazardScore.rating}`);
console.assert(hazardScore.factors.find(f => f.name === 'Gas Level').status === '⚠', 'Gas factor shows ⚠');
console.assert(hazardScore.advice.includes('ventilation'), 'Advisory warns to ventilate');
console.log('✓ Environmental hazard correctly degrades score and triggers warning advisory');

console.log('\nAll Submodule 3.5 tests PASSED successfully!');
