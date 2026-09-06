/**
 * Submodule 2: Telemetry & Ingestion - Hardware Simulator
 * Generates realistic physics-based sensor feeds for the ESP32 Explorer Box.
 * Includes hazard/fault injection for testing alerts and anomaly detection.
 */

export class HardwareSimulator {
  constructor(options = {}) {
    this.intervalMs = options.intervalMs || 3000;
    this.onDataCallback = options.onData || (() => {});
    this.timer = null;
    this.isRunning = false;

    // Base physics state
    this.baseTemp = 29.6;
    this.baseHumidity = 63.0;
    this.basePressure = 1008.0;
    this.baseGas = 320;
    this.baseLight = 735;
    this.baseDistance = 24.0;
    this.motionState = false;
    this.motionHoldTicks = 0;

    // Hazard Injection State
    this.injectedGasSpike = 0;
    this.injectedTempOffset = 0;
    this.isSimulatedOffline = false;

    // Wi-Fi signal
    this.rssi = -57;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timer = setInterval(() => this.tick(), this.intervalMs);
    this.tick();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  setUpdateRate(ms) {
    this.intervalMs = ms;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  tick() {
    if (this.isSimulatedOffline) {
      return; // Device is offline, emit no packets
    }

    // Natural random walk with mild mean reversion
    this.baseTemp += (Math.random() - 0.5) * 0.15 + (29.6 - this.baseTemp) * 0.04;
    this.baseHumidity += (Math.random() - 0.5) * 0.4 + (63.0 - this.baseHumidity) * 0.04;
    this.basePressure += (Math.random() - 0.5) * 0.1 + (1008.0 - this.basePressure) * 0.04;
    this.baseGas += (Math.random() - 0.5) * 3 + (320 - this.baseGas) * 0.04;
    this.baseLight += (Math.random() - 0.5) * 10 + (735 - this.baseLight) * 0.04;
    this.baseDistance += (Math.random() - 0.5) * 2.0 + (24.0 - this.baseDistance) * 0.06;

    // Motion simulation
    if (this.motionHoldTicks > 0) {
      this.motionHoldTicks--;
      this.motionState = false;
    } else {
      if (Math.random() < 0.16) {
        this.motionState = true;
        this.motionHoldTicks = 3;
      } else {
        this.motionState = false;
      }
    }

    // Wi-Fi RSSI variance
    this.rssi = Math.min(-46, Math.max(-85, this.rssi + Math.floor((Math.random() - 0.5) * 3)));

    // Calculate effective readings with injected hazard offsets
    const currentGas = Math.round(this.baseGas + this.injectedGasSpike);
    const currentTemp = Number((this.baseTemp + this.injectedTempOffset).toFixed(1));

    // Gradually dissipate injected spikes
    if (this.injectedGasSpike > 0) {
      this.injectedGasSpike = Math.max(0, this.injectedGasSpike - 35);
    }
    if (this.injectedTempOffset > 0) {
      this.injectedTempOffset = Math.max(0, this.injectedTempOffset - 0.3);
    }

    const payload = {
      timestamp: new Date().toISOString(),
      temperature: currentTemp,
      humidity: Number(Math.max(10, Math.min(99, this.baseHumidity)).toFixed(1)),
      pressure: Number(this.basePressure.toFixed(1)),
      gas: Math.max(20, currentGas),
      light: Math.max(0, Math.min(1023, Math.round(this.baseLight))),
      distance: Number(Math.max(2, Math.min(400, this.baseDistance)).toFixed(1)),
      motion: this.motionState,
      telemetry: {
        rssi: this.rssi,
        ssid: 'ESP32_Explorer_Lab',
        ip: '192.168.1.142',
        firmware: 'v1.4.2-ioe',
        freeHeap: 184520 + Math.floor(Math.random() * 2000)
      }
    };

    this.onDataCallback(payload);
  }

  // --- Hazard / Fault Injection Controls ---

  triggerGasSpike(ppm = 400) {
    this.injectedGasSpike = ppm;
    this.tick();
  }

  triggerTempSpike(degrees = 6.0) {
    this.injectedTempOffset = degrees;
    this.tick();
  }

  triggerMotionBurst() {
    this.motionState = true;
    this.motionHoldTicks = 4;
    this.tick();
  }

  triggerObstacleApproach(dist = 7.0) {
    this.baseDistance = dist;
    this.tick();
  }

  toggleOffline() {
    this.isSimulatedOffline = !this.isSimulatedOffline;
    return this.isSimulatedOffline;
  }
}
