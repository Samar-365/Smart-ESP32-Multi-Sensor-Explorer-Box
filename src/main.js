/**
 * Submodule 7.1: Application Entry & Bootstrap
 * Integrates telemetry services, simulation, alerts, router, and global UI state.
 */

import { TimeSeriesBuffer } from './modules/telemetry/timeSeriesBuffer.js';
import { HardwareSimulator } from './modules/telemetry/simulator.js';
import { DeviceConnector } from './modules/telemetry/deviceConnector.js';
import { CsvExporter } from './modules/telemetry/csvExporter.js';
import { AlertRuleEvaluator, AlertStateTracker } from './modules/alerts/alertRules.js';
import { alertHistory } from './modules/alerts/alertHistory.js';
import { thresholdStore } from './modules/alerts/thresholdConfig.js';
import { Router } from './modules/ui/router.js';

// Global Application State Container
export const appState = {
  buffer: new TimeSeriesBuffer(),
  simulator: null,
  connector: null,
  tracker: new AlertStateTracker(),
  router: null,
  currentView: null,
  mode: 'simulator' // 'simulator' | 'live'
};

// Initialize Application
function initApp() {
  console.log('🚀 Bootstrapping Smart ESP32 Multi-Sensor Explorer Box Dashboard...');

  // 1. Initialize Simulator
  appState.simulator = new HardwareSimulator({
    intervalMs: 3000,
    onData: (reading) => onIncomingTelemetry(reading)
  });

  // 2. Initialize Device Connector & Watchdog
  appState.connector = new DeviceConnector({
    mode: 'simulator',
    onReading: (reading) => onIncomingTelemetry(reading),
    onStatusChange: (status) => updateDeviceStatusUI(status)
  });

  // Start telemetry flow
  appState.simulator.start();

  // 3. Setup SPA Router
  appState.router = new Router({}, {
    container: document.getElementById('view-container'),
    onNavigate: (routeName) => onRouteChanged(routeName)
  });

  // 4. Setup Header Actions & Controls
  setupGlobalControls();

  // 5. Initial UI sync
  updateAlertBadge();
  const latest = appState.buffer.getLatest();
  if (latest) {
    updateDeviceStatusUI({ isOnline: true, lastSeen: Date.now() });
  }

  // 6. Launch Router
  appState.router.init();
}

/**
 * Dispatches incoming telemetry packets to buffer, alert engine, and active view
 */
function onIncomingTelemetry(rawReading) {
  // Push to circular storage
  const reading = appState.buffer.push(rawReading);

  // Update header connection stats
  updateDeviceStatusUI({
    isOnline: true,
    lastSeen: Date.now(),
    rssi: reading.telemetry?.rssi || -58
  });

  // Evaluate alerts and record state transitions
  const newAlerts = appState.tracker.processReading(reading, thresholdStore);
  for (const alert of newAlerts) {
    alertHistory.logAlert(alert);
  }
  updateAlertBadge();

  // If active view has a live onTick update hook, invoke it
  if (appState.currentView && typeof appState.currentView.onTick === 'function') {
    appState.currentView.onTick(reading, appState.buffer.getAll());
  }
}

/**
 * Updates top header online/offline beacon, signal strength, and last sync time
 */
function updateDeviceStatusUI(status = {}) {
  const beacon = document.getElementById('device-beacon');
  const statusText = document.getElementById('device-status-text');
  const rssiEl = document.getElementById('device-rssi');
  const lastSyncEl = document.getElementById('device-last-sync');

  if (beacon && statusText) {
    if (status.isOnline) {
      beacon.classList.remove('offline');
      statusText.textContent = 'ESP32 Online';
      statusText.style.color = 'var(--text-primary)';
    } else {
      beacon.classList.add('offline');
      statusText.textContent = 'ESP32 Offline';
      statusText.style.color = 'var(--color-critical)';
    }
  }

  if (rssiEl && typeof status.rssi === 'number') {
    rssiEl.textContent = `📶 ${status.rssi} dBm`;
  }

  if (lastSyncEl && status.lastSeen) {
    const d = new Date(status.lastSeen);
    const pad = n => String(n).padStart(2, '0');
    lastSyncEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
}

/**
 * Updates sidebar notification count badge for active alerts
 */
function updateAlertBadge() {
  const badge = document.getElementById('nav-alert-badge');
  if (!badge) return;

  const latest = appState.buffer.getLatest();
  if (!latest) {
    badge.style.display = 'none';
    return;
  }

  const activeAlerts = AlertRuleEvaluator.getActiveAlerts(latest, thresholdStore);
  if (activeAlerts.length > 0) {
    badge.style.display = 'inline-block';
    badge.textContent = activeAlerts.length;
  } else {
    badge.style.display = 'none';
  }
}

/**
 * Hook invoked whenever the client router switches views
 */
function onRouteChanged(routeName) {
  appState.currentView = appState.router.routes[routeName] || null;
}

/**
 * Binds global header buttons, mobile drawer, CSV exporter, and simulator hazard panel
 */
function setupGlobalControls() {
  // Mobile drawer hamburger
  const hamburgerBtn = document.getElementById('btn-hamburger');
  const sidebar = document.getElementById('app-sidebar');
  if (hamburgerBtn && sidebar) {
    hamburgerBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Export CSV button (SRS Section 20 FR-09)
  const exportBtn = document.getElementById('btn-export-csv');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const records = appState.buffer.getAll();
      CsvExporter.download(records, 'esp32_sensor_data');
    });
  }

  // Feed Mode Toggle (Simulator vs Live ESP32)
  const toggleFeedBtn = document.getElementById('btn-toggle-feed-mode');
  const feedLabel = document.getElementById('feed-mode-label');
  const feedSubLabel = document.getElementById('feed-sub-label');
  if (toggleFeedBtn) {
    toggleFeedBtn.addEventListener('click', () => {
      if (appState.mode === 'simulator') {
        appState.mode = 'live';
        appState.simulator.stop();
        appState.connector.setMode('live');
        if (feedLabel) feedLabel.textContent = 'Mode: Live Device';
        if (feedSubLabel) feedSubLabel.textContent = 'REST Polling';
        toggleFeedBtn.textContent = 'Switch';
      } else {
        appState.mode = 'simulator';
        appState.connector.setMode('simulator');
        appState.simulator.start();
        if (feedLabel) feedLabel.textContent = 'Mode: Simulator';
        if (feedSubLabel) feedSubLabel.textContent = 'Physics Generator';
        toggleFeedBtn.textContent = 'Switch';
      }
    });
  }

  // Floating Simulator Hazard Testing Panel Controls
  const btnGas = document.getElementById('btn-inject-gas');
  const btnTemp = document.getElementById('btn-inject-temp');
  const btnMotion = document.getElementById('btn-inject-motion');
  const btnDist = document.getElementById('btn-inject-dist');
  const btnOffline = document.getElementById('btn-toggle-offline');

  if (btnGas) btnGas.addEventListener('click', () => appState.simulator.triggerGasSpike(420));
  if (btnTemp) btnTemp.addEventListener('click', () => appState.simulator.triggerTempSpike(6.5));
  if (btnMotion) btnMotion.addEventListener('click', () => appState.simulator.triggerMotionBurst());
  if (btnDist) btnDist.addEventListener('click', () => appState.simulator.triggerObstacleApproach(4.0));
  if (btnOffline) {
    btnOffline.addEventListener('click', () => {
      const isOffline = appState.simulator.toggleOffline();
      btnOffline.textContent = isOffline ? '🟢 Reconnect ESP32' : '🔴 Toggle ESP32 Offline';
      if (isOffline) {
        updateDeviceStatusUI({ isOnline: false, lastSeen: null });
      }
    });
  }
}

// Bootstrap on DOMContentLoaded
window.addEventListener('DOMContentLoaded', initApp);
