/**
 * Submodule 2: Telemetry & Ingestion - Device Connector & Heartbeat Watchdog
 * Manages live ESP32 network connection, endpoint polling, and online/offline watchdog.
 * Fulfills SRS FR-07 (Device Status).
 */

export class DeviceConnector {
  constructor(options = {}) {
    this.mode = options.mode || 'simulator'; // 'simulator' | 'live'
    this.liveEndpoint = options.liveEndpoint || 'http://192.168.1.142/api/data';
    this.pollIntervalMs = options.pollIntervalMs || 3000;
    this.heartbeatTimeoutMs = options.heartbeatTimeoutMs || 9000;

    this.onReading = options.onReading || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});

    this.isOnline = false;
    this.lastPacketTimestamp = null;
    this.pollTimer = null;
    this.watchdogTimer = null;

    this.startWatchdog();
  }

  setMode(newMode) {
    if (newMode === this.mode) return;
    this.mode = newMode;
    if (this.mode === 'live') {
      this.startPolling();
    } else {
      this.stopPolling();
    }
  }

  setLiveEndpoint(url) {
    this.liveEndpoint = url;
  }

  /**
   * Called whenever a packet is received (either from simulator or live device)
   */
  notifyPacketReceived(reading) {
    this.lastPacketTimestamp = Date.now();
    if (!this.isOnline) {
      this.isOnline = true;
      this.onStatusChange({ isOnline: true, lastSeen: this.lastPacketTimestamp });
    }
    this.onReading(reading);
  }

  startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(() => this.pollLiveDevice(), this.pollIntervalMs);
    this.pollLiveDevice();
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async pollLiveDevice() {
    if (this.mode !== 'live') return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(this.liveEndpoint, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        this.notifyPacketReceived(json);
      } else {
        console.warn('ESP32 endpoint responded with non-200:', response.status);
      }
    } catch (err) {
      // Polling error or timeout - watchdog will mark offline if timeout threshold is exceeded
    }
  }

  startWatchdog() {
    this.watchdogTimer = setInterval(() => {
      if (!this.lastPacketTimestamp) {
        if (this.isOnline) {
          this.isOnline = false;
          this.onStatusChange({ isOnline: false, lastSeen: null });
        }
        return;
      }

      const elapsed = Date.now() - this.lastPacketTimestamp;
      if (elapsed > this.heartbeatTimeoutMs && this.isOnline) {
        this.isOnline = false;
        this.onStatusChange({ isOnline: false, lastSeen: this.lastPacketTimestamp });
      }
    }, 1500);
  }

  destroy() {
    this.stopPolling();
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
    }
  }
}
