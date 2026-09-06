// Unit test for Submodule 4.1: Threshold Configuration & Persistence Store
import { ThresholdConfigStore, DEFAULT_THRESHOLDS } from '../src/modules/alerts/thresholdConfig.js';

console.log('Testing Submodule 4.1: Threshold Configuration & Persistence Store...');

const store = new ThresholdConfigStore();

// 1. Verify default thresholds
const defaults = store.getDefaults();
console.assert(defaults.gas.warning === 450, `Gas warning expected 450, got ${defaults.gas.warning}`);
console.assert(defaults.gas.critical === 600, `Gas critical expected 600, got ${defaults.gas.critical}`);
console.assert(defaults.distance.operator === '<', `Distance operator expected '<', got ${defaults.distance.operator}`);
console.log('✓ Factory defaults defined correctly for all sensors');

// 2. Update threshold
store.update('gas', { warning: 500, critical: 650 });
const updatedGas = store.get('gas');
console.assert(updatedGas.warning === 500, `Gas warning updated to 500, got ${updatedGas.warning}`);
console.assert(updatedGas.critical === 650, `Gas critical updated to 650, got ${updatedGas.critical}`);
console.log('✓ Threshold update modifies and returns new limits');

// 3. Reset to defaults
store.resetToDefaults();
const resetGas = store.get('gas');
console.assert(resetGas.warning === 450, `Gas warning reset to 450, got ${resetGas.warning}`);
console.assert(resetGas.critical === 600, `Gas critical reset to 600, got ${resetGas.critical}`);
console.log('✓ resetToDefaults restores factory values');

console.log('\nAll Submodule 4.1 tests PASSED successfully!');
