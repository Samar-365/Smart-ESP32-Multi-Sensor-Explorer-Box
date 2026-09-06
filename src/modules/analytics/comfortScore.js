/**
 * Submodule 3.5: Environmental Comfort & Quality Index Model
 * Computes a weighted composite 0–100 score reflecting human comfort and indoor safety.
 * Fulfills SRS Section 12 (FR-04.6 Environmental Comfort Score).
 */

export const COMFORT_LEVELS = {
  GOOD: { id: 'good', label: 'GOOD', badge: '● GOOD', color: '#ffffff', minScore: 75 },
  MODERATE: { id: 'moderate', label: 'MODERATE', badge: '● MODERATE', color: '#9ca3af', minScore: 50 },
  POOR: { id: 'poor', label: 'POOR', badge: '● POOR', color: '#64748b', minScore: 0 }
};

export class ComfortScoreEngine {
  /**
   * Calculates sub-score for temperature (weight: 30%)
   * Optimal indoor range: 20.0°C to 26.0°C (ASHRAE-55 standard)
   */
  static calculateThermalScore(temp) {
    if (typeof temp !== 'number' || Number.isNaN(temp)) return 50;
    if (temp >= 21.0 && temp <= 25.5) return 100;
    if (temp >= 19.5 && temp <= 27.0) return 85;
    if (temp >= 18.0 && temp <= 29.0) return 65;
    if (temp >= 16.0 && temp <= 32.0) return 40;
    return Math.max(0, 40 - Math.abs(temp - 23) * 4);
  }

  /**
   * Calculates sub-score for humidity (weight: 25%)
   * Optimal relative humidity: 40% to 60%
   */
  static calculateHumidityScore(humidity) {
    if (typeof humidity !== 'number' || Number.isNaN(humidity)) return 50;
    if (humidity >= 40.0 && humidity <= 60.0) return 100;
    if (humidity >= 35.0 && humidity <= 68.0) return 80;
    if (humidity >= 28.0 && humidity <= 75.0) return 55;
    if (humidity >= 20.0 && humidity <= 85.0) return 30;
    return Math.max(0, 20 - Math.abs(humidity - 50) * 0.8);
  }

  /**
   * Calculates sub-score for air purity / MQ-2 gas (weight: 30%)
   * Clean baseline: < 350 ppm
   */
  static calculateGasScore(gasPpm) {
    if (typeof gasPpm !== 'number' || Number.isNaN(gasPpm)) return 50;
    if (gasPpm <= 350) return 100;
    if (gasPpm <= 420) return 80;
    if (gasPpm <= 500) return 50;
    if (gasPpm <= 650) return 20;
    return 0; // Hazardous gas level
  }

  /**
   * Calculates sub-score for atmospheric pressure stability (weight: 15%)
   * Normal sea-level barometric range: 1005 to 1020 hPa
   */
  static calculatePressureScore(pressure) {
    if (typeof pressure !== 'number' || Number.isNaN(pressure)) return 70;
    if (pressure >= 1005.0 && pressure <= 1020.0) return 100;
    if (pressure >= 995.0 && pressure <= 1028.0) return 80;
    if (pressure >= 980.0 && pressure <= 1038.0) return 55;
    return 35;
  }

  /**
   * Evaluates overall environmental score from reading payload
   * @param {Object} reading Latest sensor telemetry
   * @returns {Object} Comprehensive score breakdown matching SRS FR-04.6
   */
  static evaluate(reading = {}) {
    const temp = reading.temperature ?? 25.0;
    const humidity = reading.humidity ?? 50.0;
    const gas = reading.gas ?? 300;
    const pressure = reading.pressure ?? 1013.2;

    const sThermal = this.calculateThermalScore(temp);
    const sHumidity = this.calculateHumidityScore(humidity);
    const sGas = this.calculateGasScore(gas);
    const sPressure = this.calculatePressureScore(pressure);

    // Weighted composite calculation: 30% thermal, 25% humidity, 30% gas, 15% pressure
    let composite = (sThermal * 0.30) + (sHumidity * 0.25) + (sGas * 0.30) + (sPressure * 0.15);

    // Safety Override: If gas level is dangerously high (sGas == 0), cap overall score at 45 (POOR)
    if (sGas === 0) {
      composite = Math.min(45, composite * 0.5);
    }

    const roundedScore = Math.max(0, Math.min(100, Math.round(composite)));

    // Classification
    let classification = COMFORT_LEVELS.POOR;
    if (roundedScore >= COMFORT_LEVELS.GOOD.minScore) {
      classification = COMFORT_LEVELS.GOOD;
    } else if (roundedScore >= COMFORT_LEVELS.MODERATE.minScore) {
      classification = COMFORT_LEVELS.MODERATE;
    }

    // Parameter status checkmarks matching SRS Section 12
    const factors = [
      {
        name: 'Temperature',
        value: `${temp.toFixed(1)} °C`,
        status: sThermal >= 70 ? '✓' : '⚠',
        isOptimal: sThermal >= 70,
        subScore: Math.round(sThermal)
      },
      {
        name: 'Humidity',
        value: `${humidity.toFixed(1)} %`,
        status: sHumidity >= 70 ? '✓' : '⚠',
        isOptimal: sHumidity >= 70,
        subScore: Math.round(sHumidity)
      },
      {
        name: 'Gas Level',
        value: `${Math.round(gas)} ppm`,
        status: sGas >= 70 ? '✓' : '⚠',
        isOptimal: sGas >= 70,
        subScore: Math.round(sGas)
      },
      {
        name: 'Pressure',
        value: `${pressure.toFixed(1)} hPa`,
        status: sPressure >= 70 ? '✓' : '⚠',
        isOptimal: sPressure >= 70,
        subScore: Math.round(sPressure)
      }
    ];

    // Advisory feedback
    const advisories = [];
    if (sGas < 50) advisories.push('Elevated gas concentration detected; ventilation recommended.');
    if (sThermal < 50) advisories.push(temp > 27 ? 'Room temperature is high.' : 'Room temperature is chilly.');
    if (sHumidity < 50) advisories.push(humidity > 70 ? 'High humidity; potential for mold/dampness.' : 'Dry air detected.');

    const advice = advisories.length > 0 ? advisories.join(' ') : 'Indoor environment is optimal and comfortable.';

    return {
      score: roundedScore,
      rating: classification.label,
      badge: classification.badge,
      color: classification.color,
      factors,
      advice
    };
  }
}
