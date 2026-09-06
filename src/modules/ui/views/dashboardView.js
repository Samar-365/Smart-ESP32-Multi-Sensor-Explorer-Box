/**
 * Submodule 7.2: Main Live Dashboard View
 * 7 sensor cards, comfort score dial, streaming charts, weather widget, and recent alerts.
 * Fulfills SRS Section 5 (FR-01), Section 6 (FR-02), Section 12 (FR-04.6), Section 29.
 */

import { SENSOR_METADATA } from '../../telemetry/sensorSchema.js';
import { ComfortScoreEngine } from '../../analytics/comfortScore.js';
import { AlertRuleEvaluator } from '../../alerts/alertRules.js';
import { alertHistory } from '../../alerts/alertHistory.js';
import { weatherClient } from '../../weather/weatherClient.js';
import { chartManager } from '../chartManager.js';
import { appState } from '../../../main.js';

export const dashboardView = {
  render() {
    const root = document.createElement('div');
    root.className = 'dashboard-page';

    root.innerHTML = `
      <!-- Top Overview Banner -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">SMART ESP32 EXPLORER BOX</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">Multi-Sensor Environmental Telemetry & Health Monitoring</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="#analytics" class="action-btn btn-secondary"><span>📊 View Analytics</span></a>
          <a href="#alerts" class="action-btn btn-secondary"><span>⚠️ Alerts Log</span></a>
        </div>
      </div>

      <!-- Environmental Comfort Score Banner (SRS Section 12 FR-04.6) -->
      <div class="comfort-widget" style="margin-bottom: 28px;">
        <div class="comfort-gauge-container">
          <svg class="comfort-svg" viewBox="0 0 140 140">
            <circle class="comfort-circle-bg" cx="70" cy="70" r="54"></circle>
            <circle class="comfort-circle-progress" id="dash-comfort-circle" cx="70" cy="70" r="54" 
              stroke-dasharray="339.292" stroke-dashoffset="70"></circle>
          </svg>
          <div class="comfort-gauge-text">
            <span class="comfort-number" id="dash-comfort-num">--</span>
            <span class="comfort-max">/ 100</span>
          </div>
        </div>

        <div class="comfort-details">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">ENVIRONMENT COMFORT SCORE</span>
            <span class="comfort-badge tag-normal" id="dash-comfort-badge">🟢 GOOD</span>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.4;" id="dash-comfort-advice">
            Evaluating multi-factor indoor thermal, air purity, and barometric stability...
          </p>

          <div class="comfort-factors-list" id="dash-comfort-factors">
            <!-- Dynamic factor pills inserted here -->
          </div>
        </div>
      </div>

      <!-- 7 Sensor Telemetry Grid (SRS Section 5 & 6 FR-01/FR-02) -->
      <div class="sensor-grid" id="dashboard-sensor-grid">
        <!-- Temperature Card -->
        <div class="sensor-card" style="--card-accent: #06b6d4;">
          <div class="card-header">
            <div class="sensor-meta">
              <div class="sensor-icon">🌡️</div>
              <div class="sensor-title">
                <h3>Temperature</h3>
                <span>BME280 • I2C</span>
              </div>
            </div>
            <span class="status-tag tag-normal" id="card-temp-tag">Normal</span>
          </div>
          <div class="card-body">
            <span class="card-value" id="card-temp-val">--</span>
            <span class="card-unit">°C</span>
          </div>
          <div class="card-footer">
            <span style="color: var(--text-muted);" id="card-temp-sub">Optimal: 21–26°C</span>
            <span style="font-family: var(--font-mono); color: var(--color-primary);" id="card-temp-trend">↗ Increasing</span>
          </div>
        </div>

        <!-- Humidity Card -->
        <div class="sensor-card" style="--card-accent: #3b82f6;">
          <div class="card-header">
            <div class="sensor-meta">
              <div class="sensor-icon">💧</div>
              <div class="sensor-title">
                <h3>Humidity</h3>
                <span>BME280 • I2C</span>
              </div>
            </div>
            <span class="status-tag tag-normal" id="card-humidity-tag">Normal</span>
          </div>
          <div class="card-body">
            <span class="card-value" id="card-humidity-val">--</span>
            <span class="card-unit">%</span>
          </div>
          <div class="card-footer">
            <span style="color: var(--text-muted);">Comfort: 40–60%</span>
            <span style="font-family: var(--font-mono); color: var(--color-blue);" id="card-humidity-trend">→ Stable</span>
          </div>
        </div>

        <!-- Pressure Card -->
        <div class="sensor-card" style="--card-accent: #8b5cf6;">
          <div class="card-header">
            <div class="sensor-meta">
              <div class="sensor-icon">⏱️</div>
              <div class="sensor-title">
                <h3>Pressure</h3>
                <span>BME280 • I2C</span>
              </div>
            </div>
            <span class="status-tag tag-normal" id="card-pressure-tag">Normal</span>
          </div>
          <div class="card-body">
            <span class="card-value" id="card-pressure-val">--</span>
            <span class="card-unit">hPa</span>
          </div>
          <div class="card-footer">
            <span style="color: var(--text-muted);">Standard: ~1013 hPa</span>
            <span style="font-family: var(--font-mono); color: var(--color-violet);" id="card-pressure-trend">→ Stable</span>
          </div>
        </div>

        <!-- Gas Level Card -->
        <div class="sensor-card" style="--card-accent: #f59e0b;">
          <div class="card-header">
            <div class="sensor-meta">
              <div class="sensor-icon">🔥</div>
              <div class="sensor-title">
                <h3>Gas Level</h3>
                <span>MQ-2 • ADC 34</span>
              </div>
            </div>
            <span class="status-tag tag-normal" id="card-gas-tag">Normal</span>
          </div>
          <div class="card-body">
            <span class="card-value" id="card-gas-val">--</span>
            <span class="card-unit">ppm</span>
          </div>
          <div class="card-footer">
            <span style="color: var(--text-muted);">Threshold: 450 ppm</span>
            <span style="font-family: var(--font-mono); color: var(--color-warning);" id="card-gas-sub">Clean Air</span>
          </div>
        </div>

        <!-- Light Level Card -->
        <div class="sensor-card" style="--card-accent: #eab308;">
          <div class="card-header">
            <div class="sensor-meta">
              <div class="sensor-icon">☀️</div>
              <div class="sensor-title">
                <h3>Light Level</h3>
                <span>LDR • ADC 35</span>
              </div>
            </div>
            <span class="status-tag tag-normal" id="card-light-tag">Normal</span>
          </div>
          <div class="card-body">
            <span class="card-value" id="card-light-val">--</span>
            <span class="card-unit">ADC</span>
          </div>
          <div class="card-footer">
            <span style="color: var(--text-muted);">Range: 0–1023</span>
            <span style="font-family: var(--font-mono); color: #eab308;" id="card-light-sub">Daylight</span>
          </div>
        </div>

        <!-- Ultrasonic Distance Card -->
        <div class="sensor-card" style="--card-accent: #10b981;">
          <div class="card-header">
            <div class="sensor-meta">
              <div class="sensor-icon">📏</div>
              <div class="sensor-title">
                <h3>Distance</h3>
                <span>HC-SR04 • GPIO</span>
              </div>
            </div>
            <span class="status-tag tag-normal" id="card-dist-tag">Clear</span>
          </div>
          <div class="card-body">
            <span class="card-value" id="card-dist-val">--</span>
            <span class="card-unit">cm</span>
          </div>
          <div class="card-footer">
            <span style="color: var(--text-muted);">Safety Limit: > 15 cm</span>
            <span style="font-family: var(--font-mono); color: var(--color-normal);" id="card-dist-sub">Clear</span>
          </div>
        </div>

        <!-- PIR Motion Card -->
        <div class="sensor-card" style="--card-accent: #ec4899;">
          <div class="card-header">
            <div class="sensor-meta">
              <div class="sensor-icon">📡</div>
              <div class="sensor-title">
                <h3>Motion Status</h3>
                <span>PIR • GPIO 13</span>
              </div>
            </div>
            <span class="status-tag tag-normal" id="card-motion-tag">No Motion</span>
          </div>
          <div class="card-body" style="align-items: center; justify-content: space-between;">
            <div class="motion-radar-container">
              <div class="radar-screen" id="dash-radar-screen">
                <div class="radar-ring"></div>
                <div class="radar-dot"></div>
              </div>
              <span class="card-value" style="font-size: 20px;" id="card-motion-val">No Motion</span>
            </div>
          </div>
          <div class="card-footer">
            <span style="color: var(--text-muted);">Last Trigger:</span>
            <span style="font-family: var(--font-mono); color: var(--color-pink);" id="card-motion-time">--:--</span>
          </div>
        </div>
      </div>

      <!-- Quick Graphs Grid (Temperature & Humidity) (SRS Section 29) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 28px;">
        <div class="data-table-container" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span style="color: var(--color-primary);">📈</span> Temperature Stream (°C)
            </h3>
            <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">Live 24h Buffer</span>
          </div>
          <div style="height: 220px; position: relative;">
            <canvas id="chart-dash-temp"></canvas>
          </div>
        </div>

        <div class="data-table-container" style="padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
              <span style="color: var(--color-blue);">💧</span> Humidity Stream (%)
            </h3>
            <span style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">Live 24h Buffer</span>
          </div>
          <div style="height: 220px; position: relative;">
            <canvas id="chart-dash-humidity"></canvas>
          </div>
        </div>
      </div>

      <!-- Bottom Widgets (Weather Summary & Recent Alerts) (SRS Section 5 & 29) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px;">
        <!-- Weather Card -->
        <div class="data-table-container" style="padding: 22px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text-primary);">🌤️ Live Weather</h3>
            <a href="#weather" style="font-size: 12px; color: var(--color-primary); font-weight: 600;">Full Forecast →</a>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <span style="font-size: 42px;" id="dash-weather-icon">☁️</span>
              <div>
                <div style="font-size: 32px; font-weight: 800; font-family: var(--font-mono);" id="dash-weather-temp">31°C</div>
                <div style="font-size: 13px; color: var(--text-secondary);" id="dash-weather-desc">Partly Cloudy</div>
              </div>
            </div>
            <div style="text-align: right; font-size: 12px; color: var(--text-muted);">
              <div id="dash-weather-city">New Delhi, IN</div>
              <div style="margin-top: 4px; color: var(--text-accent);" id="dash-weather-feels">Feels Like: 33°C</div>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 14px; border-top: 1px solid var(--border-subtle); font-size: 12px;">
            <div style="color: var(--text-secondary);">Humidity: <strong style="color: var(--text-primary);" id="dash-weather-humidity">59%</strong></div>
            <div style="color: var(--text-secondary);">Wind: <strong style="color: var(--text-primary);" id="dash-weather-wind">12 km/h</strong></div>
            <div style="color: var(--text-secondary);">Pressure: <strong style="color: var(--text-primary);" id="dash-weather-pressure">1006 hPa</strong></div>
            <div style="color: var(--text-secondary);">Status: <span class="status-tag tag-normal" style="font-size: 10px;">Synced</span></div>
          </div>
        </div>

        <!-- Recent Alerts Card (SRS Section 17 FR-06) -->
        <div class="data-table-container" style="padding: 22px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 14px; font-weight: 700; color: var(--text-primary);">⚠️ Recent Alerts</h3>
            <a href="#alerts" style="font-size: 12px; color: var(--color-primary); font-weight: 600;">View History →</a>
          </div>
          <div id="dash-recent-alerts-list" style="display: flex; flex-direction: column; gap: 10px;">
            <!-- Dynamic alerts inserted here -->
          </div>
        </div>
      </div>
    `;

    return root;
  },

  async mount() {
    const latest = appState.buffer.getLatest();
    const history = appState.buffer.getAll();

    if (latest) {
      this.onTick(latest, history);
    }

    // Render streaming line charts
    this.renderCharts(history);

    // Fetch and populate live weather widget
    try {
      const weather = await weatherClient.getWeather();
      this.updateWeatherUI(weather);
    } catch (e) {
      console.warn('Dashboard weather widget update failed:', e);
    }
  },

  onTick(reading, history = []) {
    // 1. Update Sensor Card Values & Badges
    this.updateCard('card-temp-val', 'card-temp-tag', reading.temperature, 32.0, 36.0, '°C');
    this.updateCard('card-humidity-val', 'card-humidity-tag', reading.humidity, 70.0, 85.0, '%');
    this.updateCard('card-pressure-val', 'card-pressure-tag', reading.pressure, 1025.0, 1040.0, 'hPa');
    this.updateCard('card-gas-val', 'card-gas-tag', reading.gas, 450, 600, 'ppm');
    this.updateCard('card-light-val', 'card-light-tag', reading.light, 900, 980, 'ADC');
    this.updateDistanceCard(reading.distance);
    this.updateMotionCard(reading.motion, reading.timestamp);

    // 2. Update Environmental Comfort Score Gauge (FR-04.6)
    const comfort = ComfortScoreEngine.evaluate(reading);
    const circle = document.getElementById('dash-comfort-circle');
    const numEl = document.getElementById('dash-comfort-num');
    const badgeEl = document.getElementById('dash-comfort-badge');
    const adviceEl = document.getElementById('dash-comfort-advice');
    const factorsEl = document.getElementById('dash-comfort-factors');

    if (circle && numEl && badgeEl) {
      numEl.textContent = comfort.score;
      badgeEl.textContent = comfort.badge;
      badgeEl.style.color = comfort.color;
      badgeEl.className = `comfort-badge tag-${comfort.rating.toLowerCase()}`;
      if (adviceEl) adviceEl.textContent = comfort.advice;

      // SVG circle perimeter: 2 * PI * 54 = ~339.29
      const perimeter = 339.29;
      const offset = perimeter - (comfort.score / 100) * perimeter;
      circle.style.strokeDashoffset = offset;
      circle.style.stroke = comfort.color;
    }

    if (factorsEl) {
      factorsEl.innerHTML = comfort.factors.map(f => `
        <div class="comfort-factor-pill">
          <span style="color: var(--text-secondary);">${f.name}</span>
          <span style="font-weight: 700; color: ${f.isOptimal ? 'var(--color-normal)' : 'var(--color-warning)'};">
            ${f.value} ${f.status}
          </span>
        </div>
      `).join('');
    }

    // 3. Update Recent Alerts Ticker
    this.updateRecentAlerts();
  },

  updateCard(valId, tagId, val, warnThresh, critThresh, unit) {
    const valEl = document.getElementById(valId);
    const tagEl = document.getElementById(tagId);
    if (!valEl || typeof val !== 'number') return;

    valEl.textContent = val;

    if (tagEl) {
      if (val >= critThresh) {
        tagEl.textContent = 'Critical';
        tagEl.className = 'status-tag tag-critical';
      } else if (val >= warnThresh) {
        tagEl.textContent = 'Warning';
        tagEl.className = 'status-tag tag-warning';
      } else {
        tagEl.textContent = 'Normal';
        tagEl.className = 'status-tag tag-normal';
      }
    }
  },

  updateDistanceCard(dist) {
    const valEl = document.getElementById('card-dist-val');
    const tagEl = document.getElementById('card-dist-tag');
    if (!valEl || typeof dist !== 'number') return;

    valEl.textContent = dist;
    if (tagEl) {
      if (dist <= 5.0) {
        tagEl.textContent = 'Proximity Danger';
        tagEl.className = 'status-tag tag-critical';
      } else if (dist <= 15.0) {
        tagEl.textContent = 'Approach Warning';
        tagEl.className = 'status-tag tag-warning';
      } else {
        tagEl.textContent = 'Clear';
        tagEl.className = 'status-tag tag-normal';
      }
    }
  },

  updateMotionCard(motion, timestamp) {
    const valEl = document.getElementById('card-motion-val');
    const tagEl = document.getElementById('card-motion-tag');
    const radar = document.getElementById('dash-radar-screen');
    const timeEl = document.getElementById('card-motion-time');

    if (valEl) {
      valEl.textContent = motion ? 'Motion Detected' : 'No Motion';
    }
    if (tagEl) {
      tagEl.textContent = motion ? 'Detected' : 'Clear';
      tagEl.className = motion ? 'status-tag tag-critical' : 'status-tag tag-normal';
    }
    if (radar) {
      if (motion) {
        radar.classList.add('active');
      } else {
        radar.classList.remove('active');
      }
    }
    if (timeEl && motion && timestamp) {
      const d = new Date(timestamp);
      const pad = n => String(n).padStart(2, '0');
      timeEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
  },

  renderCharts(history) {
    chartManager.renderTrendChart('chart-dash-temp', history, 'temperature', {
      color: '#06b6d4',
      label: 'Temperature',
      unit: '°C'
    });

    chartManager.renderTrendChart('chart-dash-humidity', history, 'humidity', {
      color: '#3b82f6',
      label: 'Humidity',
      unit: '%'
    });
  },

  updateWeatherUI(weather) {
    const iconEl = document.getElementById('dash-weather-icon');
    const tempEl = document.getElementById('dash-weather-temp');
    const descEl = document.getElementById('dash-weather-desc');
    const cityEl = document.getElementById('dash-weather-city');
    const feelsEl = document.getElementById('dash-weather-feels');
    const humEl = document.getElementById('dash-weather-humidity');
    const windEl = document.getElementById('dash-weather-wind');
    const presEl = document.getElementById('dash-weather-pressure');

    if (iconEl) iconEl.textContent = weather.icon || '🌤️';
    if (tempEl) tempEl.textContent = `${weather.temperature}°C`;
    if (descEl) descEl.textContent = weather.condition;
    if (cityEl) cityEl.textContent = `${weather.city}, ${weather.country || 'IN'}`;
    if (feelsEl) feelsEl.textContent = `Feels Like: ${weather.feelsLike}°C`;
    if (humEl) humEl.textContent = `${weather.humidity}%`;
    if (windEl) windEl.textContent = `${weather.windSpeedKmH} km/h`;
    if (presEl) presEl.textContent = `${weather.pressure} hPa`;
  },

  updateRecentAlerts() {
    const listEl = document.getElementById('dash-recent-alerts-list');
    if (!listEl) return;

    const recent = alertHistory.query().slice(0, 4);
    if (recent.length === 0) {
      listEl.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 16px;">🟢 No active alerts. All systems normal.</div>';
      return;
    }

    listEl.innerHTML = recent.map(a => `
      <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 10px 14px; font-size: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-family: var(--font-mono); color: var(--text-muted);">${a.formattedTime}</span>
          <strong style="color: var(--text-primary);">${a.sensorName}</strong>
          <span style="color: var(--text-secondary);">${a.formattedValue}</span>
        </div>
        <span class="status-tag tag-${a.level}">${a.status}</span>
      </div>
    `).join('');
  }
};
