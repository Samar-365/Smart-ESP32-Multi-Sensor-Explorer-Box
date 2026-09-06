/**
 * Submodule 3.6: Spatial Analytics Engine (Motion & Distance)
 * Computes PIR motion event statistics, peak activity hourly histograms,
 * and HC-SR04 ultrasonic distance metrics and trends.
 * Fulfills SRS Section 14 (FR-04.8 Motion Analytics) & Section 15 (FR-04.9 Distance Analytics).
 */

import { StatsEngine } from './statsEngine.js';
import { TrendDetector } from './trendDetector.js';

export class SpatialAnalyticsEngine {
  /**
   * Evaluates PIR Motion sensor events over historical readings
   * Fulfills SRS Section 14 (FR-04.8)
   * @param {Array<Object>} readings Chronological array of telemetry readings
   * @returns {Object} Motion analytics breakdown
   */
  static analyzeMotion(readings = []) {
    const fallback = {
      eventsToday: 0,
      totalEvents: 0,
      lastDetectedTime: null,
      lastDetectedFormatted: 'None',
      peakActivityPeriod: 'N/A',
      activityLevel: 'LOW',
      currentMotionStatus: 'No Motion',
      hourlyDistribution: new Array(24).fill(0)
    };

    if (!Array.isArray(readings) || readings.length === 0) {
      return fallback;
    }

    const todayDateStr = new Date().toISOString().slice(0, 10);
    const hourlyHistogram = new Array(24).fill(0);
    let eventsToday = 0;
    let totalEvents = 0;
    let lastDetectedTime = null;
    let inMotionPulse = false;

    for (let i = 0; i < readings.length; i++) {
      const r = readings[i];
      const isMotion = Boolean(r.motion);

      if (isMotion) {
        lastDetectedTime = r.timestamp;

        // Count rising edge transitions as distinct motion events
        if (!inMotionPulse) {
          totalEvents++;
          const d = new Date(r.timestamp);
          const dateStr = d.toISOString().slice(0, 10);
          const hour = d.getHours();

          if (dateStr === todayDateStr) {
            eventsToday++;
          }
          hourlyHistogram[hour] = (hourlyHistogram[hour] || 0) + 1;
          inMotionPulse = true;
        }
      } else {
        inMotionPulse = false;
      }
    }

    // Determine peak activity hour window (e.g. 14:00 - 16:00)
    let peakHour = 0;
    let maxHourCount = 0;
    for (let h = 0; h < 24; h++) {
      // 2-hour rolling sum
      const count = hourlyHistogram[h] + (hourlyHistogram[(h + 1) % 24] || 0);
      if (count > maxHourCount) {
        maxHourCount = count;
        peakHour = h;
      }
    }

    const pad = n => String(n).padStart(2, '0');
    const peakActivityPeriod = maxHourCount > 0
      ? `${pad(peakHour)}:00–${pad((peakHour + 2) % 24)}:00`
      : 'N/A';

    // Activity Level classification matching SRS Section 14
    let activityLevel = 'LOW';
    if (eventsToday >= 20 || totalEvents >= 30) {
      activityLevel = 'HIGH';
    } else if (eventsToday >= 8 || totalEvents >= 12) {
      activityLevel = 'MODERATE';
    }

    // Latest status
    const latestReading = readings[readings.length - 1];
    const currentMotionStatus = latestReading?.motion ? 'Motion Detected' : 'No Motion';

    // Format last detected time (e.g. 15:42)
    let lastDetectedFormatted = 'None';
    if (lastDetectedTime) {
      const d = new Date(lastDetectedTime);
      lastDetectedFormatted = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    return {
      eventsToday,
      totalEvents,
      lastDetectedTime,
      lastDetectedFormatted,
      peakActivityPeriod,
      activityLevel,
      currentMotionStatus,
      hourlyDistribution: hourlyHistogram
    };
  }

  /**
   * Evaluates HC-SR04 Ultrasonic Distance metrics and trend
   * Fulfills SRS Section 15 (FR-04.9)
   * @param {Array<Object>} readings Chronological array of telemetry readings
   * @returns {Object} Distance analytics breakdown
   */
  static analyzeDistance(readings = []) {
    const stats = StatsEngine.computeStats(readings, 'distance');
    const trend = TrendDetector.detectTrend(readings, 'distance', 30);

    return {
      current: stats.current,
      minimum: stats.min,
      maximum: stats.max,
      average: stats.avg,
      trend: trend.label,
      trendIcon: trend.icon,
      trendSummary: `Trend: ${trend.icon} ${trend.label}`,
      sampleCount: stats.sampleCount
    };
  }
}
