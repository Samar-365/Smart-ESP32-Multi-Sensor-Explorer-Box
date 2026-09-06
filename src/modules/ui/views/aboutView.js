/**
 * Submodule 7.6: About Project & Hardware Documentation View
 * Architecture diagrams, sensor hardware specifications, pinout tables, REST schema, and STEM context.
 * Fulfills SRS Section 22 (FR-11 About Project) & Section 24 (System Architecture).
 */

export const aboutView = {
  render() {
    const root = document.createElement('div');
    root.className = 'about-page';

    root.innerHTML = `
      <!-- Title -->
      <div style="margin-bottom: 28px;">
        <h2 style="font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">SMART ESP32 MULTI-SENSOR EXPLORER BOX</h2>
        <p style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">
          Comprehensive Hardware, Architecture, Pinout & IoT Cloud Documentation
        </p>
      </div>

      <!-- Overview Card (SRS Section 22 FR-11) -->
      <div class="sensor-card" style="margin-bottom: 24px; padding: 26px;">
        <h3 style="font-size: 17px; font-weight: 700; color: var(--color-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span>📦</span> Project Overview
        </h3>
        <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 14px;">
          The <strong>Smart ESP32 Multi-Sensor Explorer Box</strong> is an integrated IoT edge-monitoring platform designed for physical computing, environmental safety, and advanced remote analytics. Built around the powerful dual-core ESP32 microcontroller, the device continuously samples environmental parameters, provides local visualization on an integrated TFT display, and pushes high-resolution telemetry over Wi-Fi to this web dashboard for predictive analytics, statistical modeling, and automated safety alerting.
        </p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <span class="status-tag tag-normal">IoT Laboratory Learning</span>
          <span class="status-tag tag-normal">STEM Education</span>
          <span class="status-tag tag-normal">Smart Classrooms</span>
          <span class="status-tag tag-normal">Hazard Warning</span>
          <span class="status-tag tag-normal">Indoor Air Quality</span>
        </div>
      </div>

      <!-- System Architecture Pipeline (SRS Section 24) -->
      <div class="data-table-container" style="padding: 26px; margin-bottom: 24px;">
        <h3 style="font-size: 17px; font-weight: 700; margin-bottom: 12px; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
          <span>🔄</span> System Architecture Pipeline
        </h3>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
          The hardware-to-cloud data flow pipeline follows a deterministic 6-stage telemetry lifecycle:
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; text-align: center;">
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px 12px;">
            <div style="font-size: 24px; margin-bottom: 6px;">🎯</div>
            <strong style="font-size: 13px; color: var(--color-primary); display: block;">1. Sensor Sampling</strong>
            <span style="font-size: 11px; color: var(--text-muted);">BME280, MQ-2, LDR, HC-SR04, PIR</span>
          </div>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px 12px;">
            <div style="font-size: 24px; margin-bottom: 6px;">⚡</div>
            <strong style="font-size: 13px; color: var(--color-blue); display: block;">2. ESP32 Edge Core</strong>
            <span style="font-size: 11px; color: var(--text-muted);">Calibration & Rolling Averages</span>
          </div>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px 12px;">
            <div style="font-size: 24px; margin-bottom: 6px;">🖥️</div>
            <strong style="font-size: 13px; color: var(--color-violet); display: block;">3. Local TFT Screen</strong>
            <span style="font-size: 11px; color: var(--text-muted);">ST7789 On-Device Dashboard</span>
          </div>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px 12px;">
            <div style="font-size: 24px; margin-bottom: 6px;">📶</div>
            <strong style="font-size: 13px; color: var(--color-warning); display: block;">4. Wi-Fi / REST Sync</strong>
            <span style="font-size: 11px; color: var(--text-muted);">HTTP JSON / ThingSpeak</span>
          </div>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px 12px;">
            <div style="font-size: 24px; margin-bottom: 6px;">☁️</div>
            <strong style="font-size: 13px; color: var(--color-normal); display: block;">5. Cloud & Ingestion</strong>
            <span style="font-size: 11px; color: var(--text-muted);">Circular Buffer & Rules Engine</span>
          </div>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px 12px;">
            <div style="font-size: 24px; margin-bottom: 6px;">📊</div>
            <strong style="font-size: 13px; color: var(--text-accent); display: block;">6. Web Analytics</strong>
            <span style="font-size: 11px; color: var(--text-muted);">Z-Score, Pearson r, Alerts</span>
          </div>
        </div>
      </div>

      <!-- Sensor Hardware Specifications Table (SRS Section 2 & 22) -->
      <div class="data-table-container" style="margin-bottom: 24px;">
        <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-subtle);">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary);">Sensor Pinout & Electrical Specifications</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">ESP32 DevKit V1 Pin Assignments, Interface Protocols, and Measured Units</p>
        </div>
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Sensor</th>
                <th>Parameter</th>
                <th>Unit</th>
                <th>Interface</th>
                <th>ESP32 GPIO Pin</th>
                <th>Operating Voltage</th>
                <th>Measurement Range</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>BME280</strong></td>
                <td>Temperature</td>
                <td>°C</td>
                <td>I2C</td>
                <td>SDA (GPIO 21), SCL (GPIO 22)</td>
                <td>3.3V</td>
                <td>-40°C to +85°C (±0.5°C)</td>
              </tr>
              <tr>
                <td><strong>BME280</strong></td>
                <td>Relative Humidity</td>
                <td>%</td>
                <td>I2C</td>
                <td>SDA (GPIO 21), SCL (GPIO 22)</td>
                <td>3.3V</td>
                <td>0% to 100% (±3%)</td>
              </tr>
              <tr>
                <td><strong>BME280</strong></td>
                <td>Barometric Pressure</td>
                <td>hPa</td>
                <td>I2C</td>
                <td>SDA (GPIO 21), SCL (GPIO 22)</td>
                <td>3.3V</td>
                <td>300 to 1100 hPa (±1 hPa)</td>
              </tr>
              <tr>
                <td><strong>MQ-2</strong></td>
                <td>Combustible Gas & Smoke</td>
                <td>ppm</td>
                <td>Analog (ADC1)</td>
                <td>A0 → GPIO 34</td>
                <td>5.0V (VCC), 3.3V Out</td>
                <td>200 to 10,000 ppm</td>
              </tr>
              <tr>
                <td><strong>LDR</strong></td>
                <td>Ambient Light Intensity</td>
                <td>ADC / lux</td>
                <td>Analog (ADC1)</td>
                <td>Divider → GPIO 35</td>
                <td>3.3V</td>
                <td>0 to 1023 (10-bit resolution)</td>
              </tr>
              <tr>
                <td><strong>HC-SR04</strong></td>
                <td>Ultrasonic Distance</td>
                <td>cm</td>
                <td>Digital Pulse</td>
                <td>Trig (GPIO 5), Echo (GPIO 18)</td>
                <td>5.0V / 3.3V Resistor Divider</td>
                <td>2 cm to 400 cm (±3mm)</td>
              </tr>
              <tr>
                <td><strong>PIR HC-SR501</strong></td>
                <td>Infrared Motion</td>
                <td>Binary</td>
                <td>Digital Input</td>
                <td>Out → GPIO 13</td>
                <td>5.0V (VCC), 3.3V Logic</td>
                <td>High (Detected) / Low (Clear)</td>
              </tr>
              <tr>
                <td><strong>TFT Screen (ST7789)</strong></td>
                <td>Local Color Display</td>
                <td>RGB</td>
                <td>SPI</td>
                <td>MOSI (GPIO 23), SCK (GPIO 18), CS (GPIO 15)</td>
                <td>3.3V</td>
                <td>240 x 240 / 128 x 160 px</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- REST API Schema & Arduino C++ Code (Module 8 Bridge) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px;">
        <!-- REST JSON Schema -->
        <div class="data-table-container" style="padding: 24px;">
          <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 10px; color: var(--color-primary);">
            📡 Telemetry JSON Schema (SRS Section 28)
          </h3>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">
            The ESP32 sends or serves JSON formatted payloads conforming to the standardized data structure:
          </p>
          <pre style="background: rgba(0,0,0,0.4); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-family: var(--font-mono); font-size: 12px; color: var(--text-accent); overflow-x: auto;"><code>{
  "timestamp": "2026-09-07T00:00:00Z",
  "temperature": 29.6,
  "humidity": 63.0,
  "pressure": 1008.0,
  "gas": 320,
  "light": 735,
  "distance": 24.0,
  "motion": false,
  "telemetry": {
    "rssi": -57,
    "ip": "192.168.1.142",
    "firmware": "v1.0.0-ioe",
    "freeHeap": 184500
  }
}</code></pre>
        </div>

        <!-- Arduino C++ Code Snippet -->
        <div class="data-table-container" style="padding: 24px;">
          <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 10px; color: var(--color-normal);">
            💻 Arduino C++ Telemetry Code
          </h3>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">
            Sample sketch for ESP32 using HTTPClient to stream data to this web dashboard:
          </p>
          <pre style="background: rgba(0,0,0,0.4); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-family: var(--font-mono); font-size: 11px; color: #a7f3d0; overflow-x: auto; max-height: 200px;"><code>#include &lt;WiFi.h&gt;
#include &lt;HTTPClient.h&gt;
#include &lt;ArduinoJson.h&gt;

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:3000/api/telemetry";

void sendTelemetry(float temp, float hum, float pres, int gas, int light, float dist, bool motion) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument&lt;256&gt; doc;
    doc["temperature"] = temp;
    doc["humidity"] = hum;
    doc["pressure"] = pres;
    doc["gas"] = gas;
    doc["light"] = light;
    doc["distance"] = dist;
    doc["motion"] = motion;

    String jsonString;
    serializeJson(doc, jsonString);
    int httpCode = http.POST(jsonString);
    http.end();
  }
}</code></pre>
        </div>
      </div>
    `;

    return root;
  },

  mount() {
    // Static documentation view
  }
};
