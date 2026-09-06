/**
 * Submodule 8.1: Hardware Pinout Specifications & Wiring Guide
 * Technical hardware mapping for the physical ESP32 Multi-Sensor Explorer Box.
 * Fulfills SRS Section 2 (Scope), Section 22 (Sensors Used), Section 24 (Architecture).
 */

export const MICROCONTROLLER_SPEC = {
  board: 'ESP32 DevKit V1',
  chip: 'ESP-WROOM-32',
  core: 'Xtensa Dual-Core 32-bit LX6 @ 240 MHz',
  memory: '520 KB SRAM, 4 MB Flash',
  wireless: 'Wi-Fi 802.11 b/g/n (2.4 GHz) + Bluetooth v4.2 BR/EDR & BLE',
  operatingVoltage: '3.3V (Internal) / 5.0V (Micro-USB / VIN Rail)',
  adcResolution: '12-bit (0–4095) / Configurable to 10-bit (0–1023)'
};

export const SENSOR_HARDWARE_SPECS = [
  {
    id: 'bme280',
    sensorName: 'BME280 Environmental Sensor',
    measuredParameters: ['Temperature (°C)', 'Relative Humidity (%)', 'Barometric Pressure (hPa)'],
    communicationProtocol: 'I2C Bus',
    i2cAddress: '0x76 (SDO to GND) or 0x77 (SDO to VCC)',
    operatingVoltage: '3.3V DC (DO NOT connect to 5V)',
    pinout: [
      { sensorPin: 'VCC', esp32Pin: '3.3V Rail', description: 'Regulated 3.3V power supply' },
      { sensorPin: 'GND', esp32Pin: 'GND', description: 'Common system ground' },
      { sensorPin: 'SCL', esp32Pin: 'GPIO 22', description: 'I2C Serial Clock line' },
      { sensorPin: 'SDA', esp32Pin: 'GPIO 21', description: 'I2C Serial Data line' }
    ],
    ranges: {
      temperature: '-40°C to +85°C (Accuracy ±0.5°C)',
      humidity: '0% to 100% RH (Accuracy ±3%)',
      pressure: '300 hPa to 1100 hPa (Accuracy ±1 hPa)'
    }
  },
  {
    id: 'mq2',
    sensorName: 'MQ-2 Combustible Gas & Smoke Sensor',
    measuredParameters: ['Combustible Gas (ppm)', 'Smoke Concentration (ppm)'],
    communicationProtocol: 'Analog Voltage (ADC1)',
    operatingVoltage: '5.0V DC (Internal heater requires 5V VIN)',
    pinout: [
      { sensorPin: 'VCC', esp32Pin: 'VIN (5V Rail)', description: '5V supply for internal heating element' },
      { sensorPin: 'GND', esp32Pin: 'GND', description: 'Common system ground' },
      { sensorPin: 'A0 (Analog Out)', esp32Pin: 'GPIO 34 (ADC1_CH6)', description: 'Analog output voltage proportional to gas ppm' },
      { sensorPin: 'D0 (Digital Out)', esp32Pin: 'Unused / Optional', description: 'Digital threshold trigger' }
    ],
    ranges: {
      detectionRange: '200 ppm to 10,000 ppm (LPG, Propane, Methane, Smoke)',
      preheatTime: '24 hours initial burn-in / 3 minutes warmup'
    }
  },
  {
    id: 'ldr',
    sensorName: 'LDR (Light Dependent Resistor) Light Sensor',
    measuredParameters: ['Ambient Light Intensity (ADC / Lux)'],
    communicationProtocol: 'Analog Voltage Divider (ADC1)',
    operatingVoltage: '3.3V DC',
    pinout: [
      { sensorPin: 'VCC', esp32Pin: '3.3V Rail', description: '3.3V power supply' },
      { sensorPin: 'Divider Node', esp32Pin: 'GPIO 35 (ADC1_CH7)', description: 'Center node between LDR and 10kΩ pull-down resistor' },
      { sensorPin: 'GND', esp32Pin: 'GND', description: 'Ground connected via 10kΩ pull-down resistor' }
    ],
    ranges: {
      lightRange: '0 (Complete Darkness) to 1023 (Direct Sunlight)',
      darkResistance: '1 MΩ typical',
      lightResistance: '10 kΩ typical'
    }
  },
  {
    id: 'hcsr04',
    sensorName: 'HC-SR04 Ultrasonic Distance Sensor',
    measuredParameters: ['Obstacle Distance (cm)'],
    communicationProtocol: 'Digital Pulse Timing (40 kHz Sonic Burst)',
    operatingVoltage: '5.0V DC (VCC)',
    pinout: [
      { sensorPin: 'VCC', esp32Pin: 'VIN (5V Rail)', description: '5V supply for ultrasonic transducer transducers' },
      { sensorPin: 'GND', esp32Pin: 'GND', description: 'Common system ground' },
      { sensorPin: 'Trig', esp32Pin: 'GPIO 5', description: '10µs digital trigger pulse sent by ESP32' },
      { sensorPin: 'Echo', esp32Pin: 'GPIO 18 (via 1kΩ/2kΩ divider)', description: 'Echo pulse level-shifted from 5V to 3.3V' }
    ],
    ranges: {
      distanceRange: '2 cm to 400 cm (Accuracy ±3 mm)',
      measuringAngle: '15 degrees',
      conversionFormula: 'Distance (cm) = (Echo Duration in µs * 0.0343) / 2'
    }
  },
  {
    id: 'pir',
    sensorName: 'PIR HC-SR501 Pyroelectric Infrared Motion Sensor',
    measuredParameters: ['Human / Animal Motion Detection (Binary)'],
    communicationProtocol: 'Digital GPIO Input',
    operatingVoltage: '5.0V DC (VCC) / 3.3V Output Logic',
    pinout: [
      { sensorPin: 'VCC', esp32Pin: 'VIN (5V Rail)', description: '5V supply for onboard voltage regulator' },
      { sensorPin: 'GND', esp32Pin: 'GND', description: 'Common system ground' },
      { sensorPin: 'OUT', esp32Pin: 'GPIO 13', description: 'HIGH (3.3V) on motion detected / LOW (0V) on clear' }
    ],
    ranges: {
      detectionRange: 'Up to 7 meters (Adjustable via onboard potentiometer)',
      detectionAngle: '< 120 degrees cone',
      delayTime: '0.3s to 200s (Adjustable via onboard potentiometer)'
    }
  },
  {
    id: 'st7789',
    sensorName: 'ST7789 1.8" Color TFT Display (Local UI)',
    measuredParameters: ['On-Device Local Dashboard Display'],
    communicationProtocol: 'Hardware SPI Bus',
    operatingVoltage: '3.3V DC',
    pinout: [
      { sensorPin: 'VCC', esp32Pin: '3.3V Rail', description: '3.3V power supply' },
      { sensorPin: 'GND', esp32Pin: 'GND', description: 'Common system ground' },
      { sensorPin: 'SCL (SCK)', esp32Pin: 'GPIO 18', description: 'SPI Clock line' },
      { sensorPin: 'SDA (MOSI)', esp32Pin: 'GPIO 23', description: 'SPI Master-Out-Slave-In line' },
      { sensorPin: 'RES (RST)', esp32Pin: 'GPIO 4', description: 'Hardware Display Reset line' },
      { sensorPin: 'DC', esp32Pin: 'GPIO 2', description: 'Data / Command select line' },
      { sensorPin: 'CS', esp32Pin: 'GPIO 15', description: 'SPI Chip Select line' },
      { sensorPin: 'BLK (Backlight)', esp32Pin: '3.3V Rail', description: 'Display LED Backlight' }
    ],
    ranges: {
      resolution: '240 x 240 / 128 x 160 pixels',
      colorDepth: '65K Full RGB Colors'
    }
  }
];

export class HardwareSpecsEngine {
  static getMicrocontroller() {
    return { ...MICROCONTROLLER_SPEC };
  }

  static getAllSensors() {
    return [...SENSOR_HARDWARE_SPECS];
  }

  static getSensorById(id) {
    return SENSOR_HARDWARE_SPECS.find(s => s.id === id) || null;
  }

  static getPinoutSummary() {
    const table = [];
    for (const sensor of SENSOR_HARDWARE_SPECS) {
      for (const pin of sensor.pinout) {
        table.push({
          sensor: sensor.sensorName,
          sensorPin: pin.sensorPin,
          esp32Pin: pin.esp32Pin,
          description: pin.description
        });
      }
    }
    return table;
  }
}
