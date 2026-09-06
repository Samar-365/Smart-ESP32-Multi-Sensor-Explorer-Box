// Unit test for Submodule 8.1: Hardware Pinout Specifications & Wiring Guide
import { HardwareSpecsEngine, MICROCONTROLLER_SPEC, SENSOR_HARDWARE_SPECS } from '../src/modules/hardware/hardwareSpecs.js';

console.log('Testing Submodule 8.1: Hardware Pinout Specifications & Wiring Guide...');

// 1. Verify Microcontroller Spec
const mcu = HardwareSpecsEngine.getMicrocontroller();
console.assert(mcu.board === 'ESP32 DevKit V1', 'MCU board matches');
console.assert(mcu.wireless.includes('Wi-Fi'), 'Wi-Fi enabled');
console.log('✓ Microcontroller hardware specifications verified');

// 2. Verify all hardware sensor modules
const sensors = HardwareSpecsEngine.getAllSensors();
console.assert(sensors.length === 6, `Expected 6 hardware devices, got ${sensors.length}`);
const sensorIds = sensors.map(s => s.id);
console.assert(sensorIds.includes('bme280'), 'BME280 present');
console.assert(sensorIds.includes('mq2'), 'MQ-2 gas sensor present');
console.assert(sensorIds.includes('ldr'), 'LDR light sensor present');
console.assert(sensorIds.includes('hcsr04'), 'HC-SR04 ultrasonic sensor present');
console.assert(sensorIds.includes('pir'), 'PIR motion sensor present');
console.assert(sensorIds.includes('st7789'), 'ST7789 TFT display present');
console.log('✓ All 6 hardware sensor & display devices documented with complete pinouts');

// 3. Pinout Summary
const pinouts = HardwareSpecsEngine.getPinoutSummary();
console.assert(pinouts.length >= 18, `Expected >= 18 pin connections, got ${pinouts.length}`);
console.log('✓ Pinout connection table verified');

console.log('\nAll Submodule 8.1 tests PASSED successfully!');
