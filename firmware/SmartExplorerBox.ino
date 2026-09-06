/*
  Smart ESP32 Multi-Sensor Explorer Box - Edge Telemetry Firmware
  Platform: ESP32 DevKit V1
  Baud Rate: 115200

  Sensor Configuration:
  - BME280 (I2C): SDA (GPIO 21), SCL (GPIO 22)
  - MQ-2 Gas: Analog In (GPIO 34)
  - LDR Light: Analog In (GPIO 35)
  - HC-SR04 Ultrasonic: Trig (GPIO 5), Echo (GPIO 18 via 3.3V divider)
  - PIR Motion: Digital In (GPIO 13)

  Fulfills SRS Section 24 (Architecture) & Section 28 (Data Structure).
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <ArduinoJson.h>

// Wi-Fi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Target Web Dashboard Telemetry Ingestion Endpoint
const char* SERVER_ENDPOINT = "http://192.168.1.100:3000/api/telemetry";

// Sampling Interval (milliseconds)
const unsigned long SAMPLING_INTERVAL_MS = 3000;
unsigned long lastSampleTime = 0;

// Hardware Pin Definitions
#define PIN_MQ2_ADC     34
#define PIN_LDR_ADC     35
#define PIN_TRIG        5
#define PIN_ECHO        18
#define PIN_PIR         13

Adafruit_BME280 bme;
bool bmeDetected = false;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n==================================================");
  Serial.println("  Smart ESP32 Multi-Sensor Explorer Box v1.0.0");
  Serial.println("==================================================");

  // Initialize GPIOs
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_PIR, INPUT);
  digitalWrite(PIN_TRIG, LOW);

  // Initialize I2C Bus for BME280
  Wire.begin(21, 22);
  if (bme.begin(0x76, &Wire) || bme.begin(0x77, &Wire)) {
    bmeDetected = true;
    Serial.println("✓ BME280 Sensor initialized successfully.");
  } else {
    Serial.println("⚠ Warning: BME280 not found on 0x76 or 0x77. Using fallback dummy values.");
  }

  // Connect to Wi-Fi Network
  connectWiFi();
}

void loop() {
  // Ensure Wi-Fi connection is maintained
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  unsigned long currentMillis = millis();
  if (currentMillis - lastSampleTime >= SAMPLING_INTERVAL_MS) {
    lastSampleTime = currentMillis;
    sampleAndTransmit();
  }
}

void connectWiFi() {
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ Wi-Fi Connected!");
    Serial.print("  IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("  RSSI Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n⚠ Wi-Fi connection failed. Will retry next cycle.");
  }
}

float measureDistanceCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long durationUs = pulseIn(PIN_ECHO, HIGH, 30000); // 30ms timeout (~5m max)
  if (durationUs <= 0) return 400.0; // Out of range or no echo

  float distanceCm = (durationUs * 0.0343) / 2.0;
  return constrain(distanceCm, 2.0, 400.0);
}

int calibrateMQ2Gas(int rawAdc) {
  // 12-bit ADC mapping with standard load resistance conversion
  float voltage = (rawAdc / 4095.0) * 3.3;
  int estimatedPpm = map(rawAdc, 300, 3800, 200, 1500);
  return max(50, estimatedPpm);
}

void sampleAndTransmit() {
  // 1. Read BME280
  float temperature = bmeDetected ? bme.readTemperature() : 28.5;
  float humidity = bmeDetected ? bme.readHumidity() : 62.0;
  float pressure = bmeDetected ? (bme.readPressure() / 100.0F) : 1012.0;

  // 2. Read MQ-2 Gas & LDR Light (ADC1)
  int rawGasAdc = analogRead(PIN_MQ2_ADC);
  int gasPpm = calibrateMQ2Gas(rawGasAdc);

  int rawLightAdc = analogRead(PIN_LDR_ADC);
  int lightLevel = map(rawLightAdc, 0, 4095, 0, 1023); // Standardize to 10-bit

  // 3. Measure Ultrasonic Distance
  float distanceCm = measureDistanceCm();

  // 4. Read PIR Motion State
  bool motionDetected = digitalRead(PIN_PIR) == HIGH;

  // 5. Build JSON Payload matching SRS Section 28
  StaticJsonDocument<384> doc;
  doc["temperature"] = round(temperature * 10.0) / 10.0;
  doc["humidity"] = round(humidity * 10.0) / 10.0;
  doc["pressure"] = round(pressure * 10.0) / 10.0;
  doc["gas"] = gasPpm;
  doc["light"] = lightLevel;
  doc["distance"] = round(distanceCm * 10.0) / 10.0;
  doc["motion"] = motionDetected;

  JsonObject telemetry = doc.createNestedObject("telemetry");
  telemetry["rssi"] = WiFi.RSSI();
  telemetry["ip"] = WiFi.localIP().toString();
  telemetry["firmware"] = "v1.0.0-ioe";
  telemetry["freeHeap"] = ESP.getFreeHeap();

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  Serial.print("[Telemetry] Outgoing: ");
  Serial.println(jsonPayload);

  // 6. Transmit HTTP POST to Web Dashboard
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_ENDPOINT);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(2500);

    int httpResponseCode = http.POST(jsonPayload);
    if (httpResponseCode > 0) {
      Serial.print("✓ Server HTTP Response: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("⚠ HTTP POST Error: ");
      Serial.println(http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  }
}
