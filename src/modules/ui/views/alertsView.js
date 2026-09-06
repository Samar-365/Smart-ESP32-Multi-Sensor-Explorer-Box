/**
 * Submodule 7.5: Alerts & Threshold Management View
 * Filterable alerts history table, severity status tags, summary statistics, and threshold configurator.
 * Fulfills SRS Section 16 (FR-05 Alerts), Section 17 (FR-06 Alert History), Section 4.2 (Admin Thresholds).
 */

import { alertHistory } from '../../alerts/alertHistory.js';
import { thresholdStore } from '../../alerts/thresholdConfig.js';
import { appState } from '../../../main.js';

export const alertsView = {
  currentFilters: {
    sensor: 'all',
    level: 'all',
    dateRange: 'all',
    search: ''
  },

  render() {
    const root = document.createElement('div');
    root.className = 'alerts-page';

    root.innerHTML = `
      <!-- Top Title & Action Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">SAFETY ALERTS & THRESHOLD AUDIT</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">Automated Rule Evaluation, Violation Ledger, and Administrator Thresholds</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="action-btn btn-secondary" id="btn-open-threshold-modal"><span>⚙️ Configure Thresholds</span></button>
          <button class="action-btn btn-secondary" id="btn-clear-alerts" style="color: var(--color-critical);"><span>🗑️ Clear History</span></button>
        </div>
      </div>

      <!-- Stat Metric Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="sensor-card" style="padding: 18px;">
          <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">TOTAL ALERTS LOGGED</div>
          <div style="font-size: 28px; font-weight: 800; font-family: var(--font-mono); margin: 6px 0; color: var(--text-primary);" id="alerts-stat-total">0</div>
          <span style="font-size: 11px; color: var(--text-muted);">Historical Event Ledger</span>
        </div>

        <div class="sensor-card" style="padding: 18px; --card-accent: var(--color-critical);">
          <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">CRITICAL BREACHES</div>
          <div style="font-size: 28px; font-weight: 800; font-family: var(--font-mono); margin: 6px 0; color: var(--color-critical);" id="alerts-stat-critical">0</div>
          <span style="font-size: 11px; color: var(--color-critical);">Severe Hazards Exceeded</span>
        </div>

        <div class="sensor-card" style="padding: 18px; --card-accent: var(--color-warning);">
          <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">WARNING ELEVATIONS</div>
          <div style="font-size: 28px; font-weight: 800; font-family: var(--font-mono); margin: 6px 0; color: var(--color-warning);" id="alerts-stat-warning">0</div>
          <span style="font-size: 11px; color: var(--color-warning);">Approaching Limit Range</span>
        </div>

        <div class="sensor-card" style="padding: 18px;">
          <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">EVENTS TODAY</div>
          <div style="font-size: 28px; font-weight: 800; font-family: var(--font-mono); margin: 6px 0; color: var(--color-primary);" id="alerts-stat-today">0</div>
          <span style="font-size: 11px; color: var(--text-muted);">Recorded Since 00:00</span>
        </div>
      </div>

      <!-- Filter Controls Toolbar (SRS Section 17 FR-06) -->
      <div class="data-table-container" style="padding: 18px 24px; margin-bottom: 20px;">
        <div style="display: flex; gap: 14px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
          <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
            <!-- Sensor Filter -->
            <div>
              <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px;">FILTER SENSOR</label>
              <select id="filter-sensor" style="background: rgba(255,255,255,0.06); color: var(--text-primary); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 7px 12px; font-size: 13px;">
                <option value="all">All Sensors</option>
                <option value="gas">Gas Level (MQ-2)</option>
                <option value="temperature">Temperature (BME280)</option>
                <option value="humidity">Humidity (BME280)</option>
                <option value="distance">Distance (HC-SR04)</option>
                <option value="pressure">Pressure (BME280)</option>
                <option value="light">Light (LDR)</option>
              </select>
            </div>

            <!-- Severity Level Filter -->
            <div>
              <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px;">SEVERITY</label>
              <select id="filter-level" style="background: rgba(255,255,255,0.06); color: var(--text-primary); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 7px 12px; font-size: 13px;">
                <option value="all">All Levels</option>
                <option value="critical">🔴 Critical Only</option>
                <option value="warning">🟡 Warning Only</option>
              </select>
            </div>

            <!-- Date Range Filter -->
            <div>
              <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px;">TIME WINDOW</label>
              <select id="filter-date" style="background: rgba(255,255,255,0.06); color: var(--text-primary); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 7px 12px; font-size: 13px;">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
            </div>
          </div>

          <!-- Search Box -->
          <div style="min-width: 240px; flex: 1; max-width: 320px;">
            <label style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px;">SEARCH ALERTS</label>
            <input type="text" id="filter-search" placeholder="Search message, sensor, value..." 
              style="width: 100%; background: rgba(255,255,255,0.06); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 7px 12px; color: var(--text-primary); font-size: 13px;">
          </div>
        </div>
      </div>

      <!-- Historical Alerts Table (SRS Section 17 FR-06 Table Example) -->
      <div class="data-table-container">
        <div style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 130px;">Time</th>
                <th style="width: 140px;">Sensor</th>
                <th style="width: 130px;">Value</th>
                <th style="width: 140px;">Status</th>
                <th>Context / Violation Detail</th>
              </tr>
            </thead>
            <tbody id="alerts-table-tbody">
              <!-- Dynamically populated rows matching SRS example:
                   10:15 PM | Gas | 620 ppm | 🔴 Critical
                   09:40 PM | Temperature | 34°C | 🟡 Warning
                   09:05 PM | Gas | 510 ppm | 🟡 Warning -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Threshold Configuration Modal Root (Section 4.2 Admin) -->
      <div class="modal-backdrop" id="threshold-modal-backdrop" style="display: none;">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">⚙️ Configure Sensor Safety Thresholds</h3>
            <button class="close-btn" id="btn-close-modal">✕</button>
          </div>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 18px;">
            Administrator settings: Breaches will trigger real-time audio-visual cues and log to the alert history ledger.
          </p>

          <form id="threshold-form" style="display: flex; flex-direction: column; gap: 14px;">
            <!-- Gas Threshold -->
            <div style="display: grid; grid-template-columns: 140px 1fr 1fr; gap: 10px; align-items: center; padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);">
              <strong>🔥 Gas (ppm)</strong>
              <div>
                <label style="font-size: 10px; color: var(--color-warning);">Warning (≥)</label>
                <input type="number" id="th-gas-warn" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); padding: 5px 8px; color: #fff; border-radius: var(--radius-sm);">
              </div>
              <div>
                <label style="font-size: 10px; color: var(--color-critical);">Critical (≥)</label>
                <input type="number" id="th-gas-crit" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); padding: 5px 8px; color: #fff; border-radius: var(--radius-sm);">
              </div>
            </div>

            <!-- Temperature Threshold -->
            <div style="display: grid; grid-template-columns: 140px 1fr 1fr; gap: 10px; align-items: center; padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);">
              <strong>🌡️ Temp (°C)</strong>
              <div>
                <label style="font-size: 10px; color: var(--color-warning);">Warning (≥)</label>
                <input type="number" step="0.1" id="th-temp-warn" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); padding: 5px 8px; color: #fff; border-radius: var(--radius-sm);">
              </div>
              <div>
                <label style="font-size: 10px; color: var(--color-critical);">Critical (≥)</label>
                <input type="number" step="0.1" id="th-temp-crit" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); padding: 5px 8px; color: #fff; border-radius: var(--radius-sm);">
              </div>
            </div>

            <!-- Distance Threshold -->
            <div style="display: grid; grid-template-columns: 140px 1fr 1fr; gap: 10px; align-items: center; padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);">
              <strong>📏 Proximity (cm)</strong>
              <div>
                <label style="font-size: 10px; color: var(--color-warning);">Warning (≤)</label>
                <input type="number" step="0.5" id="th-dist-warn" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); padding: 5px 8px; color: #fff; border-radius: var(--radius-sm);">
              </div>
              <div>
                <label style="font-size: 10px; color: var(--color-critical);">Critical (≤)</label>
                <input type="number" step="0.5" id="th-dist-crit" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); padding: 5px 8px; color: #fff; border-radius: var(--radius-sm);">
              </div>
            </div>

            <!-- Humidity Threshold -->
            <div style="display: grid; grid-template-columns: 140px 1fr 1fr; gap: 10px; align-items: center;">
              <strong>💧 Humidity (%)</strong>
              <div>
                <label style="font-size: 10px; color: var(--color-warning);">Warning (≥)</label>
                <input type="number" step="1" id="th-hum-warn" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); padding: 5px 8px; color: #fff; border-radius: var(--radius-sm);">
              </div>
              <div>
                <label style="font-size: 10px; color: var(--color-critical);">Critical (≥)</label>
                <input type="number" step="1" id="th-hum-crit" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); padding: 5px 8px; color: #fff; border-radius: var(--radius-sm);">
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 18px; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
              <button type="button" class="action-btn btn-secondary" id="btn-reset-defaults" style="font-size: 12px;">Reset to Defaults</button>
              <div style="display: flex; gap: 8px;">
                <button type="button" class="action-btn btn-secondary" id="btn-cancel-modal">Cancel</button>
                <button type="submit" class="action-btn btn-primary">Save Changes</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    return root;
  },

  mount() {
    this.bindFilters();
    this.bindModalEvents();
    this.refreshTable();
  },

  onTick() {
    this.refreshTable();
  },

  bindFilters() {
    const sFilter = document.getElementById('filter-sensor');
    const lFilter = document.getElementById('filter-level');
    const dFilter = document.getElementById('filter-date');
    const qFilter = document.getElementById('filter-search');

    if (sFilter) {
      sFilter.addEventListener('change', (e) => {
        this.currentFilters.sensor = e.target.value;
        this.refreshTable();
      });
    }

    if (lFilter) {
      lFilter.addEventListener('change', (e) => {
        this.currentFilters.level = e.target.value;
        this.refreshTable();
      });
    }

    if (dFilter) {
      dFilter.addEventListener('change', (e) => {
        this.currentFilters.dateRange = e.target.value;
        this.refreshTable();
      });
    }

    if (qFilter) {
      qFilter.addEventListener('input', (e) => {
        this.currentFilters.search = e.target.value;
        this.refreshTable();
      });
    }

    const clearBtn = document.getElementById('btn-clear-alerts');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all historical alerts?')) {
          alertHistory.clear();
          this.refreshTable();
        }
      });
    }
  },

  bindModalEvents() {
    const openBtn = document.getElementById('btn-open-threshold-modal');
    const modal = document.getElementById('threshold-modal-backdrop');
    const closeBtn = document.getElementById('btn-close-modal');
    const cancelBtn = document.getElementById('btn-cancel-modal');
    const form = document.getElementById('threshold-form');
    const resetBtn = document.getElementById('btn-reset-defaults');

    // Also wire top header Settings button to open this modal
    const headerSettingsBtn = document.getElementById('btn-open-settings');
    if (headerSettingsBtn && modal) {
      headerSettingsBtn.addEventListener('click', () => {
        this.populateModalInputs();
        modal.style.display = 'flex';
      });
    }

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        this.populateModalInputs();
        modal.style.display = 'flex';
      });
    }

    const closeModal = () => {
      if (modal) modal.style.display = 'none';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveThresholdsFromInputs();
        closeModal();
        this.refreshTable();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        thresholdStore.resetToDefaults();
        this.populateModalInputs();
        alert('Thresholds reset to factory defaults.');
      });
    }
  },

  populateModalInputs() {
    const gas = thresholdStore.get('gas');
    const temp = thresholdStore.get('temperature');
    const dist = thresholdStore.get('distance');
    const hum = thresholdStore.get('humidity');

    const gW = document.getElementById('th-gas-warn');
    const gC = document.getElementById('th-gas-crit');
    const tW = document.getElementById('th-temp-warn');
    const tC = document.getElementById('th-temp-crit');
    const dW = document.getElementById('th-dist-warn');
    const dC = document.getElementById('th-dist-crit');
    const hW = document.getElementById('th-hum-warn');
    const hC = document.getElementById('th-hum-crit');

    if (gW && gas) gW.value = gas.warning;
    if (gC && gas) gC.value = gas.critical;
    if (tW && temp) tW.value = temp.warning;
    if (tC && temp) tC.value = temp.critical;
    if (dW && dist) dW.value = dist.warning;
    if (dC && dist) dC.value = dist.critical;
    if (hW && hum) hW.value = hum.warning;
    if (hC && hum) hC.value = hum.critical;
  },

  saveThresholdsFromInputs() {
    const gW = parseFloat(document.getElementById('th-gas-warn')?.value);
    const gC = parseFloat(document.getElementById('th-gas-crit')?.value);
    const tW = parseFloat(document.getElementById('th-temp-warn')?.value);
    const tC = parseFloat(document.getElementById('th-temp-crit')?.value);
    const dW = parseFloat(document.getElementById('th-dist-warn')?.value);
    const dC = parseFloat(document.getElementById('th-dist-crit')?.value);
    const hW = parseFloat(document.getElementById('th-hum-warn')?.value);
    const hC = parseFloat(document.getElementById('th-hum-crit')?.value);

    if (!isNaN(gW) && !isNaN(gC)) thresholdStore.update('gas', { warning: gW, critical: gC });
    if (!isNaN(tW) && !isNaN(tC)) thresholdStore.update('temperature', { warning: tW, critical: tC });
    if (!isNaN(dW) && !isNaN(dC)) thresholdStore.update('distance', { warning: dW, critical: dC });
    if (!isNaN(hW) && !isNaN(hC)) thresholdStore.update('humidity', { warning: hW, critical: hC });
  },

  refreshTable() {
    const alerts = alertHistory.query(this.currentFilters);
    const tbody = document.getElementById('alerts-table-tbody');
    const stats = alertHistory.getStats();

    // Update stat numbers
    const sTotal = document.getElementById('alerts-stat-total');
    const sCrit = document.getElementById('alerts-stat-critical');
    const sWarn = document.getElementById('alerts-stat-warning');
    const sToday = document.getElementById('alerts-stat-today');

    if (sTotal) sTotal.textContent = stats.total;
    if (sCrit) sCrit.textContent = stats.criticalCount;
    if (sWarn) sWarn.textContent = stats.warningCount;
    if (sToday) sToday.textContent = stats.todayCount;

    if (!tbody) return;

    if (alerts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">
            🟢 No alerts match the current filter selection.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = alerts.map(a => `
      <tr>
        <td style="font-family: var(--font-mono); color: var(--text-secondary);">${a.formattedTime}</td>
        <td><strong style="color: var(--text-primary);">${a.sensorName}</strong></td>
        <td style="font-family: var(--font-mono); font-weight: 700;">${a.formattedValue}</td>
        <td><span class="status-tag tag-${a.level}">${a.status}</span></td>
        <td style="color: var(--text-secondary);">${a.message}</td>
      </tr>
    `).join('');
  }
};
