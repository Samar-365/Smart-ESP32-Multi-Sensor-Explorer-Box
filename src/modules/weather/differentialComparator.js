/**
 * Submodule 5.2: Indoor vs Outdoor Differential Comparator
 * Computes difference between physical ESP32 sensor telemetry and external OpenWeather data.
 */

export class DifferentialComparator {
  /**
   * Compares indoor reading with outdoor weather
   * @param {Object} indoorReading ESP32 telemetry reading
   * @param {Object} outdoorWeather OpenWeather data object
   * @returns {Object} Differential comparison report
   */
  static compare(indoorReading = {}, outdoorWeather = {}) {
    const indoorTemp = indoorReading.temperature ?? 25.0;
    const outdoorTemp = outdoorWeather.temperature ?? 28.0;

    const indoorHumidity = indoorReading.humidity ?? 50.0;
    const outdoorHumidity = outdoorWeather.humidity ?? 55.0;

    const indoorPressure = indoorReading.pressure ?? 1013.0;
    const outdoorPressure = outdoorWeather.pressure ?? 1013.0;

    const deltaTemp = Number((indoorTemp - outdoorTemp).toFixed(1));
    const deltaHumidity = Number((indoorHumidity - outdoorHumidity).toFixed(1));
    const deltaPressure = Number((indoorPressure - outdoorPressure).toFixed(1));

    // Environmental interpretation
    let thermalAdvice = '';
    if (deltaTemp < -2.0) {
      thermalAdvice = `Indoor is ${Math.abs(deltaTemp)}°C cooler than outdoors. HVAC / cooling is effective.`;
    } else if (deltaTemp > 2.0) {
      thermalAdvice = `Indoor is ${deltaTemp}°C warmer than outdoors. Consider opening windows if outside air is clean.`;
    } else {
      thermalAdvice = 'Indoor and outdoor temperatures are balanced.';
    }

    let humidityAdvice = '';
    if (deltaHumidity > 15.0) {
      humidityAdvice = `Indoor moisture is significantly higher (+${deltaHumidity}%). Ventilation or dehumidifier recommended.`;
    } else if (deltaHumidity < -15.0) {
      humidityAdvice = `Indoor air is notably drier than outdoors (${deltaHumidity}%).`;
    } else {
      humidityAdvice = 'Relative humidity levels are well aligned.';
    }

    return {
      indoor: {
        temperature: indoorTemp,
        humidity: indoorHumidity,
        pressure: indoorPressure
      },
      outdoor: {
        temperature: outdoorTemp,
        humidity: outdoorHumidity,
        pressure: outdoorPressure,
        condition: outdoorWeather.condition || 'Unknown',
        icon: outdoorWeather.icon || '🌤️',
        city: outdoorWeather.city || 'Local Area'
      },
      deltas: {
        temp: deltaTemp,
        tempFormatted: deltaTemp > 0 ? `+${deltaTemp} °C` : `${deltaTemp} °C`,
        humidity: deltaHumidity,
        humidityFormatted: deltaHumidity > 0 ? `+${deltaHumidity} %` : `${deltaHumidity} %`,
        pressure: deltaPressure,
        pressureFormatted: deltaPressure > 0 ? `+${deltaPressure} hPa` : `${deltaPressure} hPa`
      },
      advisories: {
        thermal: thermalAdvice,
        humidity: humidityAdvice
      }
    };
  }
}
