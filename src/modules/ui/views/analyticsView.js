/**
 * Submodule 7.3: Advanced Analytics Suite View
 * Full analytical suite: Trends, Statistics, Comparisons, Thresholds, Anomalies, Spatial.
 * Fulfills SRS Section 8 (FR-04.1 through FR-04.9).
 */

import { SENSOR_METADATA } from '../../telemetry/sensorSchema.js';
import { StatsEngine } from '../../analytics/statsEngine.js';
import { TrendDetector } from '../../analytics/trendDetector.js';
import { ThresholdAnalyzer } from '../../analytics/thresholdAnalyzer.js';
import { SensorComparisonEngine, COMPARISON_PRESETS } from '../../analytics/sensorComparison.js';
import { AnomalyDetector } from '../../analytics/anomalyDetector.js';
import { SpatialAnalyticsEngine } from '../../analytics/spatialAnalytics.js';
import { thresholdStore } from '../../alerts/thresholdConfig.js';
import { chartManager } from '../chartManager.js';
import { appState } from '../../../main.js';

export const analyticsView = {
  activeTab: 'trends',
  selectedSensor: 'temperature',
  selectedRange: '24h',
  selectedComparisonPreset: 'temp_vs_humidity',

  render() {
    const root = document.createElement('div');
    root.className = 'analytics-page';

    root.innerHTML = `
      <!-- Top Title & Analytics Sub-Tabs -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">ADVANCED SENSOR ANALYTICS</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">Deep Statistical Modeling, Trend Regression, and Dual-Axis Telemetry</p>
        </div>
        <div style="display: flex; gap: 6px; background: rgba(0,0,0,0.25); padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); flex-wrap: wrap;">
          <button class="action-btn btn-secondary analytics-tab-btn active" data-tab="trends">Trends</button>
          <button class="action-btn btn-secondary analytics-tab-btn" data-tab="stats">Statistics</button>
          <button class="action-btn btn-secondary analytics-tab-btn" data-tab="comparison">Comparison</button>
          <button class="action-btn btn-secondary analytics-tab-btn" data-tab="thresholds">Thresholds</button>
          <button class="action-btn btn-secondary analytics-tab-btn" data-tab="anomalies">Anomalies</button>
          <button class="action-btn btn-secondary analytics-tab-btn" data-tab="spatial">Spatial (PIR/Dist)</button>
        </div>
      </div>

      <!-- Tab 1: Trends Section (FR-04.1 & FR-04.3) -->
      <div class="analytics-tab-panel" id="tab-panel-trends">
        <div class="data-table-container" style="padding: 24px; margin-bottom: 24px;">
          <!-- Controls Bar -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <label style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">SENSOR:</label>
              <select id="trend-sensor-select" style="background: rgba(255,255,255,0.06); color: var(--text-primary); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 6px 12px; font-size: 13px;">
                <option value="temperature">Temperature (BME280, °C)</option>
                <option value="humidity">Humidity (BME280, %)</option>
                <option value="pressure">Pressure (BME280, hPa)</option>
                <option value="gas">Gas Level (MQ-2, ppm)</option>
                <option value="light">Light Level (LDR, ADC)</option>
                <option value="distance">Distance (HC-SR04, cm)</option>
              </select>
            </div>

            <div style="display: flex; gap: 6px;">
              <button class="sim-btn trend-range-btn" data-range="1h">1 Hour</button>
              <button class="sim-btn trend-range-btn" data-range="6h">6 Hours</button>
              <button class="sim-btn trend-range-btn active" data-range="24h" style="border-color: var(--color-primary); color: var(--color-primary);">24 Hours</button>
              <button class="sim-btn trend-range-btn" data-range="7d">7 Days</button>
              <button class="sim-btn trend-range-btn" data-range="all">All</button>
            </div>
          </div>

          <!-- Trend Chart Canvas -->
          <div style="height: 340px; position: relative;">
            <canvas id="chart-analytics-trend"></canvas>
          </div>
        </div>

        <!-- Trend Detection & Rate of Change Card (FR-04.3) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px;" id="trend-insights-grid">
          <!-- Populated dynamically -->
        </div>
      </div>

      <!-- Tab 2: Statistics Section (FR-04.2) -->
      <div class="analytics-tab-panel" id="tab-panel-stats" style="display: none;">
        <div class="data-table-container" style="padding: 24px;">
          <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">Descriptive Statistical Matrix</h3>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 18px;">Calculated over rolling historical window (Min, Max, Arithmetic Mean $\\mu$, Population Standard Deviation $\\sigma$, and Rate of Change $\\Delta x / \\Delta t$).</p>
          <div style="overflow-x: auto;">
            <table class="data-table" id="stats-matrix-table">
              <thead>
                <tr>
                  <th>Sensor</th>
                  <th>Current</th>
                  <th>Minimum</th>
                  <th>Maximum</th>
                  <th>Average (μ)</th>
                  <th>Std. Dev (σ)</th>
                  <th>Rate of Change / hr</th>
                  <th>Direction</th>
                </tr>
              </thead>
              <tbody id="stats-matrix-tbody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab 3: Sensor Comparison Section (FR-04.5) -->
      <div class="analytics-tab-panel" id="tab-panel-comparison" style="display: none;">
        <div class="data-table-container" style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 14px;">
            <div>
              <h3 style="font-size: 16px; font-weight: 700;">Dual-Axis Sensor Cross-Correlation</h3>
              <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Synchronized dual Y-axes with Pearson Correlation Coefficient (r).</p>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <label style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">PRESET:</label>
              <select id="comparison-preset-select" style="background: rgba(255,255,255,0.06); color: var(--text-primary); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 6px 12px; font-size: 13px;">
                <option value="temp_vs_humidity">Temperature vs Humidity</option>
                <option value="temp_vs_pressure">Temperature vs Pressure</option>
                <option value="gas_vs_light">Gas Level vs Light Level</option>
                <option value="temp_vs_gas">Temperature vs Gas Level</option>
                <option value="distance_vs_light">Distance vs Light Level</option>
              </select>
            </div>
          </div>

          <!-- Correlation Summary Pill -->
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="status-tag tag-normal" id="comp-r-badge">r = 0.00</span>
              <strong style="font-size: 14px; color: var(--text-primary);" id="comp-relationship">Relationship: Analyzing...</strong>
            </div>
            <span style="font-size: 12px; color: var(--text-secondary);" id="comp-description">Evaluating bivariate interaction...</span>
          </div>

          <!-- Dual Axis Chart Canvas -->
          <div style="height: 340px; position: relative;">
            <canvas id="chart-analytics-comparison"></canvas>
          </div>
        </div>
      </div>

      <!-- Tab 4: Threshold Analysis Section (FR-04.4) -->
      <div class="analytics-tab-panel" id="tab-panel-thresholds" style="display: none;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;" id="threshold-analysis-grid">
          <!-- Dynamically populated threshold cards -->
        </div>
      </div>

      <!-- Tab 5: Anomaly Detection Section (FR-04.7) -->
      <div class="analytics-tab-panel" id="tab-panel-anomalies" style="display: none;">
        <div class="data-table-container" style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <h3 style="font-size: 16px; font-weight: 700;">Statistical Anomaly Log</h3>
              <p style="font-size: 12px; color: var(--text-muted);">Z-Score Outlier Detection (|Z| ≥ 2.5σ) flags unexpected environmental spikes.</p>
            </div>
            <span class="status-tag tag-normal" id="anomaly-scan-badge">System Scanned</span>
          </div>

          <div id="anomaly-cards-list" style="display: flex; flex-direction: column; gap: 12px;">
            <!-- Dynamically populated -->
          </div>
        </div>
      </div>

      <!-- Tab 6: Spatial Intelligence Section (FR-04.8 & FR-04.9) -->
      <div class="analytics-tab-panel" id="tab-panel-spatial" style="display: none;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px;">
          <!-- PIR Motion Analytics (FR-04.8) -->
          <div class="data-table-container" style="padding: 22px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary);">
                Motion Analytics (PIR)
              </h3>
              <span class="status-tag tag-normal" id="spatial-motion-level">Activity: LOW</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px; font-size: 13px;">
              <div style="background: rgba(255,255,255,0.03); padding: 10px 14px; border-radius: var(--radius-sm);">
                <div style="color: var(--text-muted); font-size: 11px;">Events Today</div>
                <div style="font-size: 22px; font-weight: 700; font-family: var(--font-mono); color: var(--color-pink);" id="spatial-events-today">0</div>
              </div>
              <div style="background: rgba(255,255,255,0.03); padding: 10px 14px; border-radius: var(--radius-sm);">
                <div style="color: var(--text-muted); font-size: 11px;">Peak Activity Period</div>
                <div style="font-size: 18px; font-weight: 700; font-family: var(--font-mono); color: var(--text-primary);" id="spatial-peak-period">--:--</div>
              </div>
            </div>
            <div style="height: 180px; position: relative;">
              <canvas id="chart-spatial-motion-hist"></canvas>
            </div>
          </div>

          <!-- Ultrasonic Distance Analytics (FR-04.9) -->
          <div class="data-table-container" style="padding: 22px;">
            <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px;">
              Distance Analytics (HC-SR04)
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px; font-size: 13px;">
              <div style="background: rgba(255,255,255,0.03); padding: 10px 14px; border-radius: var(--radius-sm);">
                <div style="color: var(--text-muted); font-size: 11px;">Current Proximity</div>
                <div style="font-size: 22px; font-weight: 700; font-family: var(--font-mono); color: var(--color-normal);" id="spatial-dist-cur">-- cm</div>
              </div>
              <div style="background: rgba(255,255,255,0.03); padding: 10px 14px; border-radius: var(--radius-sm);">
                <div style="color: var(--text-muted); font-size: 11px;">Distance Trend</div>
                <div style="font-size: 18px; font-weight: 700; font-family: var(--font-mono); color: var(--text-primary);" id="spatial-dist-trend">→ Stable</div>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 12px; text-align: center;">
              <div style="background: rgba(255,255,255,0.02); padding: 8px; border-radius: var(--radius-sm);">
                <span style="color: var(--text-muted);">Min:</span> <strong id="spatial-dist-min">-- cm</strong>
              </div>
              <div style="background: rgba(255,255,255,0.02); padding: 8px; border-radius: var(--radius-sm);">
                <span style="color: var(--text-muted);">Max:</span> <strong id="spatial-dist-max">-- cm</strong>
              </div>
              <div style="background: rgba(255,255,255,0.02); padding: 8px; border-radius: var(--radius-sm);">
                <span style="color: var(--text-muted);">Average:</span> <strong id="spatial-dist-avg">-- cm</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    return root;
  },

  mount() {
    this.bindTabEvents();
    this.bindControls();
    this.refreshCurrentTab();
  },

  onTick(reading, history = []) {
    // Refresh the active sub-tab view with latest telemetry
    if (this.activeTab === 'trends') {
      this.renderTrendSection(history);
    } else if (this.activeTab === 'stats') {
      this.renderStatsSection(history);
    } else if (this.activeTab === 'comparison') {
      this.renderComparisonSection(history);
    } else if (this.activeTab === 'thresholds') {
      this.renderThresholdSection(history);
    } else if (this.activeTab === 'anomalies') {
      this.renderAnomalySection(history, reading);
    } else if (this.activeTab === 'spatial') {
      this.renderSpatialSection(history);
    }
  },

  bindTabEvents() {
    document.querySelectorAll('.analytics-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.analytics-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.getAttribute('data-tab');
        this.activeTab = tab;

        document.querySelectorAll('.analytics-tab-panel').forEach(panel => {
          panel.style.display = 'none';
        });

        const activePanel = document.getElementById(`tab-panel-${tab}`);
        if (activePanel) activePanel.style.display = 'block';

        const history = appState.buffer.getAll();
        const latest = appState.buffer.getLatest();
        this.onTick(latest, history);
      });
    });
  },

  bindControls() {
    // Sensor dropdown in Trends tab
    const sensorSelect = document.getElementById('trend-sensor-select');
    if (sensorSelect) {
      sensorSelect.value = this.selectedSensor;
      sensorSelect.addEventListener('change', (e) => {
        this.selectedSensor = e.target.value;
        this.renderTrendSection(appState.buffer.getAll());
      });
    }

    // Range buttons in Trends tab
    document.querySelectorAll('.trend-range-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.trend-range-btn').forEach(b => {
          b.classList.remove('active');
          b.style.borderColor = 'var(--border-subtle)';
          b.style.color = 'var(--text-primary)';
        });
        btn.classList.add('active');
        btn.style.borderColor = 'var(--color-primary)';
        btn.style.color = 'var(--color-primary)';

        this.selectedRange = btn.getAttribute('data-range');
        this.renderTrendSection(appState.buffer.getAll());
      });
    });

    // Preset dropdown in Comparison tab
    const compSelect = document.getElementById('comparison-preset-select');
    if (compSelect) {
      compSelect.value = this.selectedComparisonPreset;
      compSelect.addEventListener('change', (e) => {
        this.selectedComparisonPreset = e.target.value;
        this.renderComparisonSection(appState.buffer.getAll());
      });
    }
  },

  refreshCurrentTab() {
    const history = appState.buffer.getAll();
    const latest = appState.buffer.getLatest();
    if (latest) {
      this.onTick(latest, history);
    }
  },

  // --- Sub-Tab Renderers ---

  renderTrendSection(history = []) {
    const filtered = appState.buffer.getByTimeRange(this.selectedRange);
    const meta = SENSOR_METADATA[this.selectedSensor] || { name: this.selectedSensor, unit: '', color: '#ffffff' };

    chartManager.renderTrendChart('chart-analytics-trend', filtered, this.selectedSensor, {
      color: '#ffffff',
      label: meta.name,
      unit: meta.unit
    });

    // Trend insight calculations (FR-04.3)
    const trend = TrendDetector.detectTrend(filtered, this.selectedSensor, 30);
    const stats = StatsEngine.computeStats(filtered, this.selectedSensor);

    const insightsGrid = document.getElementById('trend-insights-grid');
    if (insightsGrid) {
      insightsGrid.innerHTML = `
        <div class="sensor-card">
          <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">DIRECTIONAL TREND</div>
          <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
            <span style="font-size: 24px;">${trend.icon}</span>
            <span style="font-size: 18px; font-weight: 700; color: #ffffff;">${trend.label}</span>
          </div>
          <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">${trend.summary}</p>
        </div>

        <div class="sensor-card">
          <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">RATE OF VELOCITY</div>
          <div style="font-size: 24px; font-weight: 700; font-family: var(--font-mono); margin: 8px 0; color: var(--text-primary);">
            ${stats.rateOfChangePerHour > 0 ? '+' : ''}${stats.rateOfChangePerHour} <span style="font-size: 12px; color: var(--text-muted);">${meta.unit}/hr</span>
          </div>
          <p style="font-size: 12px; color: var(--text-secondary);">Total range displacement: ${stats.delta > 0 ? '+' : ''}${stats.delta} ${meta.unit}</p>
        </div>

        <div class="sensor-card">
          <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">TIME WINDOW SAMPLES</div>
          <div style="font-size: 24px; font-weight: 700; font-family: var(--font-mono); margin: 8px 0; color: var(--text-primary);">
            ${filtered.length} <span style="font-size: 12px; color: var(--text-muted);">points</span>
          </div>
          <p style="font-size: 12px; color: var(--text-secondary);">Selected duration: ${this.selectedRange.toUpperCase()}</p>
        </div>
      `;
    }
  },

  renderStatsSection(history = []) {
    const tbody = document.getElementById('stats-matrix-tbody');
    if (!tbody) return;

    const sensorKeys = ['temperature', 'humidity', 'pressure', 'gas', 'light', 'distance'];
    const rows = sensorKeys.map(k => {
      const stats = StatsEngine.computeStats(history, k);
      const trend = TrendDetector.detectTrend(history, k, 30);
      const meta = SENSOR_METADATA[k];

      return `
        <tr>
          <td><strong style="color: ${meta.color};">${meta.name}</strong> <span style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">(${meta.sensor})</span></td>
          <td style="font-family: var(--font-mono); font-weight: 700;">${stats.current} ${stats.unit}</td>
          <td style="font-family: var(--font-mono);">${stats.min} ${stats.unit}</td>
          <td style="font-family: var(--font-mono);">${stats.max} ${stats.unit}</td>
          <td style="font-family: var(--font-mono);">${stats.avg} ${stats.unit}</td>
          <td style="font-family: var(--font-mono); color: var(--text-accent);">±${stats.stdDev}</td>
          <td style="font-family: var(--font-mono);">${stats.rateOfChangePerHour > 0 ? '+' : ''}${stats.rateOfChangePerHour} ${stats.unit}/hr</td>
          <td><span class="status-tag" style="background: rgba(255,255,255,0.05); color: ${trend.color};">${trend.icon} ${trend.label}</span></td>
        </tr>
      `;
    });

    tbody.innerHTML = rows.join('');
  },

  renderComparisonSection(history = []) {
    const preset = COMPARISON_PRESETS.find(p => p.id === this.selectedComparisonPreset) || COMPARISON_PRESETS[0];
    const comparison = SensorComparisonEngine.compareSensors(history, preset.sensor1, preset.sensor2);

    const rBadge = document.getElementById('comp-r-badge');
    const relEl = document.getElementById('comp-relationship');
    const descEl = document.getElementById('comp-description');

    if (rBadge) rBadge.textContent = `Pearson r = ${comparison.correlation}`;
    if (relEl) relEl.textContent = `Relationship: ${comparison.relationship}`;
    if (descEl) descEl.textContent = comparison.description;

    chartManager.renderComparisonChart('chart-analytics-comparison', comparison);
  },

  renderThresholdSection(history = []) {
    const grid = document.getElementById('threshold-analysis-grid');
    if (!grid) return;

    const sensorConfigs = [
      { key: 'gas', threshold: 450, op: '>' },
      { key: 'temperature', threshold: 32.0, op: '>' },
      { key: 'humidity', threshold: 70.0, op: '>' },
      { key: 'distance', threshold: 15.0, op: '<' }
    ];

    grid.innerHTML = sensorConfigs.map(cfg => {
      const analysis = ThresholdAnalyzer.analyzeThreshold(history, cfg.key, cfg.threshold, cfg.op);
      return `
        <div class="sensor-card">
          <div class="card-header">
            <h3 style="font-size: 15px; font-weight: 700;">${analysis.sensorName} Compliance</h3>
            <span class="status-tag ${analysis.isViolated ? 'tag-critical' : 'tag-normal'}">${analysis.statusBadge}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 14px 0; font-size: 13px;">
            <div><span style="color: var(--text-muted);">Current:</span> <strong>${analysis.currentValue} ${analysis.unit}</strong></div>
            <div><span style="color: var(--text-muted);">Threshold:</span> <strong>${analysis.threshold} ${analysis.unit}</strong></div>
            <div><span style="color: var(--text-muted);">Breach Count:</span> <strong style="color: ${analysis.violationCount > 0 ? 'var(--color-critical)' : 'inherit'};">${analysis.violationCount} episodes</strong></div>
            <div><span style="color: var(--text-muted);">Peak Breach:</span> <strong>${analysis.peakViolation !== null ? `${analysis.peakViolation} ${analysis.unit}` : 'None'}</strong></div>
          </div>
          <div class="card-footer" style="font-size: 11px;">
            <span style="color: var(--text-muted);">Time Above Threshold:</span>
            <strong style="color: var(--text-accent); font-family: var(--font-mono);">${analysis.timeAboveThresholdFormatted} (${analysis.violationPercentage}%)</strong>
          </div>
        </div>
      `;
    }).join('');
  },

  renderAnomalySection(history = [], latestReading) {
    const listEl = document.getElementById('anomaly-cards-list');
    if (!listEl) return;

    const anomalies = AnomalyDetector.scanAll(history, latestReading);
    if (anomalies.length === 0) {
      listEl.innerHTML = `
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 20px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 6px;">●</div>
          <strong style="color: var(--text-primary); font-size: 14px;">No Statistical Anomalies Detected</strong>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">All 6 environmental parameters are tracking within their 2.5σ normal baseline curves.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = anomalies.map(a => `
      <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="color: var(--text-primary); font-size: 14px;">● ANOMALY DETECTED: ${a.sensorName}</strong>
          <span class="status-tag tag-critical">Z = ${a.zScore}σ</span>
        </div>
        <p style="font-size: 13px; color: var(--text-primary); margin-bottom: 8px;">${a.message}</p>
        <div style="display: flex; gap: 16px; font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">
          <span>Current: <strong>${a.currentValue} ${a.unit}</strong></span>
          <span>Expected Range: <strong>${a.expectedRange}</strong></span>
          <span>Baseline Mean: <strong>${a.mean} ${a.unit}</strong></span>
        </div>
      </div>
    `).join('');
  },

  renderSpatialSection(history = []) {
    const motion = SpatialAnalyticsEngine.analyzeMotion(history);
    const distance = SpatialAnalyticsEngine.analyzeDistance(history);

    // Update Motion UI
    const levelEl = document.getElementById('spatial-motion-level');
    const todayEl = document.getElementById('spatial-events-today');
    const peakEl = document.getElementById('spatial-peak-period');

    if (levelEl) {
      levelEl.textContent = `Activity: ${motion.activityLevel}`;
      levelEl.className = `status-tag tag-${motion.activityLevel === 'HIGH' ? 'critical' : motion.activityLevel === 'MODERATE' ? 'warning' : 'normal'}`;
    }
    if (todayEl) todayEl.textContent = motion.eventsToday;
    if (peakEl) peakEl.textContent = motion.peakActivityPeriod;

    chartManager.renderMotionHistogram('chart-spatial-motion-hist', motion.hourlyDistribution);

    // Update Distance UI
    const distCur = document.getElementById('spatial-dist-cur');
    const distTrend = document.getElementById('spatial-dist-trend');
    const distMin = document.getElementById('spatial-dist-min');
    const distMax = document.getElementById('spatial-dist-max');
    const distAvg = document.getElementById('spatial-dist-avg');

    if (distCur) distCur.textContent = `${distance.current} cm`;
    if (distTrend) distTrend.textContent = distance.trendSummary;
    if (distMin) distMin.textContent = `${distance.minimum} cm`;
    if (distMax) distMax.textContent = `${distance.maximum} cm`;
    if (distAvg) distAvg.textContent = `${distance.average} cm`;
  }
};
