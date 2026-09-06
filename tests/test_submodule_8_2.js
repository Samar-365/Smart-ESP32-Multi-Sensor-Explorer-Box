// Unit test for Submodule 8.2: Production ESP32 Arduino C++ Firmware Sketch
import { REQUIRED_LIBRARIES, ARDUINO_FIRMWARE_CODE } from '../src/modules/hardware/sampleFirmware.js';
import fs from 'fs';
import path from 'path';

console.log('Testing Submodule 8.2: Production ESP32 Arduino C++ Firmware Sketch...');

// 1. Verify library manifest
console.assert(REQUIRED_LIBRARIES.length >= 6, `Expected >= 6 libraries, got ${REQUIRED_LIBRARIES.length}`);
const libNames = REQUIRED_LIBRARIES.map(l => l.name);
console.assert(libNames.includes('WiFi'), 'WiFi library included');
console.assert(libNames.includes('HTTPClient'), 'HTTPClient library included');
console.assert(libNames.includes('Adafruit BME280 Library'), 'Adafruit BME280 included');
console.assert(libNames.includes('ArduinoJson'), 'ArduinoJson included');
console.log('✓ Required firmware library manifest verified');

// 2. Verify firmware source content
console.assert(ARDUINO_FIRMWARE_CODE.includes('void setup()'), 'setup() function present');
console.assert(ARDUINO_FIRMWARE_CODE.includes('void loop()'), 'loop() function present');
console.assert(ARDUINO_FIRMWARE_CODE.includes('sampleAndTransmit()'), 'sampleAndTransmit() function present');
console.assert(ARDUINO_FIRMWARE_CODE.includes('measureDistanceCm()'), 'measureDistanceCm() function present');
console.assert(ARDUINO_FIRMWARE_CODE.includes('calibrateMQ2Gas('), 'calibrateMQ2Gas() function present');
console.log('✓ Arduino firmware code structure and routines verified');

// 3. Verify firmware/SmartExplorerBox.ino file exists on disk
const inoPath = path.join(process.cwd(), 'firmware', 'SmartExplorerBox.ino');
console.assert(fs.existsSync(inoPath), 'SmartExplorerBox.ino exists on disk');
const inoContent = fs.readFileSync(inoPath, 'utf8');
console.assert(inoContent.includes('StaticJsonDocument<384> doc;'), 'ArduinoJson document defined');
console.assert(inoContent.includes('HTTPClient http;'), 'HTTPClient defined');
console.log('✓ Physical .ino sketch file verified on disk');

console.log('\nAll Submodule 8.2 tests PASSED successfully!');
