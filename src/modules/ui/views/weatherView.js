/**
 * Submodule 7.4: Live Weather View
 * Full weather monitoring, 5-day forecast, hourly ribbons, and Indoor vs Outdoor Differential analysis.
 * Fulfills SRS Section 7 (FR-03 Weather Information).
 */

import { weatherClient } from '../../weather/weatherClient.js';
import { DifferentialComparator } from '../../weather/differentialComparator.js';
import { appState } from '../../../main.js';

export const weatherView = {
  render() {
    const root = document.createElement('div');
    root.className = 'weather-page';

    root.innerHTML = `
      <!-- Header Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">LIVE WEATHER & ENVIRONMENTAL DIFFERENTIAL</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">OpenWeather REST Telemetry Synchronized with Physical ESP32 Sensors</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="action-btn btn-secondary" id="btn-weather-refresh"><span>🔄 Refresh Weather</span></button>
          <button class="action-btn btn-secondary" id="btn-weather-config"><span>⚙️ API & City Config</span></button>
        </div>
      </div>

      <!-- Weather Config Panel (Collapsible) -->
      <div id="weather-config-panel" style="display: none; background: var(--bg-card-solid); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 12px; color: var(--text-primary);">OpenWeather API Settings</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-bottom: 14px;">
          <div>
            <label style="display: block; font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">Target City / Location</label>
            <input type="text" id="input-weather-city" placeholder="e.g. New Delhi, London, Tokyo" 
              style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 8px 12px; color: var(--text-primary); font-size: 13px;">
          </div>
          <div>
            <label style="display: block; font-size: 11px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">OpenWeather API Key (Optional)</label>
            <input type="password" id="input-weather-key" placeholder="Enter custom API key for live feed" 
              style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 8px 12px; color: var(--text-primary); font-size: 13px;">
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button class="action-btn btn-secondary" id="btn-weather-cancel">Cancel</button>
          <button class="action-btn btn-primary" id="btn-weather-save">Save & Sync</button>
        </div>
      </div>

      <!-- Primary Weather Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 22px; margin-bottom: 28px;">
        <!-- Card 1: Outdoor Live Weather (SRS Section 7 FR-03 Example) -->
        <div class="sensor-card" style="--card-accent: #38bdf8; padding: 26px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div>
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-primary);">OUTDOOR ENVIRONMENT</span>
              <h3 style="font-size: 20px; font-weight: 800; margin-top: 2px;" id="weather-city-display">New Delhi, IN</h3>
              <span style="font-size: 12px; color: var(--text-muted);" id="weather-source-badge">Mock Demo Feed</span>
            </div>
            <span style="font-size: 48px;" id="weather-main-icon">☁️</span>
          </div>

          <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px;">
            <span style="font-size: 48px; font-weight: 800; font-family: var(--font-mono); color: var(--text-primary);" id="weather-temp-display">31°C</span>
            <span style="font-size: 18px; color: var(--text-secondary);" id="weather-condition-display">Partly Cloudy</span>
          </div>
          <div style="font-size: 13px; color: var(--text-accent); margin-bottom: 20px;" id="weather-feels-display">
            Feels Like: 33°C
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 16px; border-top: 1px solid var(--border-subtle); font-size: 13px;">
            <div>
              <span style="color: var(--text-muted);">Humidity:</span>
              <strong style="color: var(--text-primary); margin-left: 6px;" id="weather-humidity-display">59%</strong>
            </div>
            <div>
              <span style="color: var(--text-muted);">Wind Speed:</span>
              <strong style="color: var(--text-primary); margin-left: 6px;" id="weather-wind-display">12 km/h</strong>
            </div>
            <div>
              <span style="color: var(--text-muted);">Pressure:</span>
              <strong style="color: var(--text-primary); margin-left: 6px;" id="weather-pressure-display">1006 hPa</strong>
            </div>
            <div>
              <span style="color: var(--text-muted);">Visibility:</span>
              <strong style="color: var(--text-primary); margin-left: 6px;" id="weather-visibility-display">8.5 km</strong>
            </div>
          </div>
        </div>

        <!-- Card 2: Indoor vs Outdoor Differential Analysis -->
        <div class="sensor-card" style="--card-accent: #10b981; padding: 26px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-normal);">ENVIRONMENTAL DELTA</span>
              <h3 style="font-size: 20px; font-weight: 800; margin-top: 2px;">Indoor vs Outdoor</h3>
            </div>
            <span class="status-tag tag-normal">Real-Time Delta</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; text-align: center;">
            <div style="background: rgba(255,255,255,0.03); padding: 14px 10px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <div style="font-size: 11px; color: var(--text-muted);">Δ Temperature</div>
              <div style="font-size: 22px; font-weight: 800; font-family: var(--font-mono); color: var(--color-primary); margin-top: 4px;" id="diff-delta-temp">-- °C</div>
              <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Indoor - Outdoor</div>
            </div>

            <div style="background: rgba(255,255,255,0.03); padding: 14px 10px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <div style="font-size: 11px; color: var(--text-muted);">Δ Humidity</div>
              <div style="font-size: 22px; font-weight: 800; font-family: var(--font-mono); color: var(--color-blue); margin-top: 4px;" id="diff-delta-hum">-- %</div>
              <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Indoor - Outdoor</div>
            </div>

            <div style="background: rgba(255,255,255,0.03); padding: 14px 10px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <div style="font-size: 11px; color: var(--text-muted);">Δ Pressure</div>
              <div style="font-size: 22px; font-weight: 800; font-family: var(--font-mono); color: var(--color-violet); margin-top: 4px;" id="diff-delta-pres">-- hPa</div>
              <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Barometric Shift</div>
            </div>
          </div>

          <div style="padding-top: 14px; border-top: 1px solid var(--border-subtle);">
            <div style="font-size: 12px; margin-bottom: 8px; color: var(--text-secondary);" id="diff-advice-thermal">
              Thermal Delta: Analyzing...
            </div>
            <div style="font-size: 12px; color: var(--text-secondary);" id="diff-advice-hum">
              Humidity Delta: Analyzing...
            </div>
          </div>
        </div>
      </div>

      <!-- Forecast Section (Hourly & Daily) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 22px;">
        <!-- Hourly Ribbon -->
        <div class="data-table-container" style="padding: 24px;">
          <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 16px;">Today's Hourly Temperature Progression</h3>
          <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; text-align: center;" id="weather-hourly-ribbon">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- 5-Day Daily Outlook -->
        <div class="data-table-container" style="padding: 24px;">
          <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 16px;">5-Day Forecast Outlook</h3>
          <div style="display: flex; flex-direction: column; gap: 10px;" id="weather-daily-list">
            <!-- Dynamically populated -->
          </div>
        </div>
      </div>
    `;

    return root;
  },

  async mount() {
    this.bindEvents();
    await this.refreshWeather();
  },

  onTick(reading) {
    if (this.currentWeather && reading) {
      this.updateDifferential(reading, this.currentWeather);
    }
  },

  bindEvents() {
    const refreshBtn = document.getElementById('btn-weather-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshWeather(true));
    }

    const configBtn = document.getElementById('btn-weather-config');
    const panel = document.getElementById('weather-config-panel');
    const cancelBtn = document.getElementById('btn-weather-cancel');
    const saveBtn = document.getElementById('btn-weather-save');
    const inputCity = document.getElementById('input-weather-city');
    const inputKey = document.getElementById('input-weather-key');

    if (configBtn && panel) {
      configBtn.addEventListener('click', () => {
        const isHidden = panel.style.display === 'none';
        panel.style.display = isHidden ? 'block' : 'none';
        if (isHidden && inputCity) {
          inputCity.value = weatherClient.config.city || '';
          if (inputKey) inputKey.value = weatherClient.config.apiKey || '';
        }
      });
    }

    if (cancelBtn && panel) {
      cancelBtn.addEventListener('click', () => {
        panel.style.display = 'none';
      });
    }

    if (saveBtn && panel) {
      saveBtn.addEventListener('click', async () => {
        const newCity = inputCity?.value?.trim();
        const newKey = inputKey?.value?.trim();
        weatherClient.saveConfig({ city: newCity, apiKey: newKey });
        panel.style.display = 'none';
        await this.refreshWeather(true);
      });
    }
  },

  async refreshWeather(force = false) {
    try {
      const weather = await weatherClient.getWeather(force);
      this.currentWeather = weather;
      this.updateWeatherUI(weather);

      const latest = appState.buffer.getLatest();
      if (latest) {
        this.updateDifferential(latest, weather);
      }
    } catch (e) {
      console.warn('Failed to load weather:', e);
    }
  },

  updateWeatherUI(w) {
    const cityEl = document.getElementById('weather-city-display');
    const srcEl = document.getElementById('weather-source-badge');
    const iconEl = document.getElementById('weather-main-icon');
    const tempEl = document.getElementById('weather-temp-display');
    const condEl = document.getElementById('weather-condition-display');
    const feelsEl = document.getElementById('weather-feels-display');
    const humEl = document.getElementById('weather-humidity-display');
    const windEl = document.getElementById('weather-wind-display');
    const presEl = document.getElementById('weather-pressure-display');
    const visEl = document.getElementById('weather-visibility-display');

    if (cityEl) cityEl.textContent = `${w.city}, ${w.country || 'IN'}`;
    if (srcEl) srcEl.textContent = w.isLive ? '🟢 OpenWeather Live API' : '🟡 Mock Demo Feed';
    if (iconEl) iconEl.textContent = w.icon;
    if (tempEl) tempEl.textContent = `${w.temperature}°C`;
    if (condEl) condEl.textContent = w.condition;
    if (feelsEl) feelsEl.textContent = `Feels Like: ${w.feelsLike}°C`;
    if (humEl) humEl.textContent = `${w.humidity}%`;
    if (windEl) windEl.textContent = `${w.windSpeedKmH} km/h`;
    if (presEl) presEl.textContent = `${w.pressure} hPa`;
    if (visEl) visEl.textContent = `${w.visibilityKm} km`;

    // Hourly Ribbon
    const hourlyEl = document.getElementById('weather-hourly-ribbon');
    if (hourlyEl && Array.isArray(w.hourlyForecast)) {
      hourlyEl.innerHTML = w.hourlyForecast.map(h => `
        <div style="background: rgba(255,255,255,0.03); padding: 12px 6px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          <div style="font-size: 11px; color: var(--text-muted);">${h.time}</div>
          <div style="font-size: 22px; margin: 4px 0;">${h.icon}</div>
          <div style="font-size: 14px; font-weight: 700; font-family: var(--font-mono);">${h.temp}°</div>
        </div>
      `).join('');
    }

    // Daily Forecast
    const dailyEl = document.getElementById('weather-daily-list');
    if (dailyEl && Array.isArray(w.dailyForecast)) {
      dailyEl.innerHTML = w.dailyForecast.map(d => `
        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-size: 13px;">
          <strong style="width: 80px; color: var(--text-primary);">${d.day}</strong>
          <span style="font-size: 18px;">${d.icon}</span>
          <span style="color: var(--text-secondary); flex: 1; margin-left: 14px;">${d.condition}</span>
          <div style="font-family: var(--font-mono);">
            <strong style="color: var(--text-primary);">${d.max}°</strong>
            <span style="color: var(--text-muted); margin-left: 6px;">${d.min}°</span>
          </div>
        </div>
      `).join('');
    }
  },

  updateDifferential(indoor, outdoor) {
    const report = DifferentialComparator.compare(indoor, outdoor);

    const dTemp = document.getElementById('diff-delta-temp');
    const dHum = document.getElementById('diff-delta-hum');
    const dPres = document.getElementById('diff-delta-pres');
    const advThermal = document.getElementById('diff-advice-thermal');
    const advHum = document.getElementById('diff-advice-hum');

    if (dTemp) dTemp.textContent = report.deltas.tempFormatted;
    if (dHum) dHum.textContent = report.deltas.humidityFormatted;
    if (dPres) dPres.textContent = report.deltas.pressureFormatted;

    if (advThermal) advThermal.innerHTML = `<strong>Thermal Guidance:</strong> ${report.advisories.thermal}`;
    if (advHum) advHum.innerHTML = `<strong>Moisture Guidance:</strong> ${report.advisories.humidity}`;
  }
};
