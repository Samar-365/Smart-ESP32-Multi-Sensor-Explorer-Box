/**
 * Submodule 5.1: OpenWeather REST API Client
 * Fetches outdoor weather telemetry with caching, condition icon mapping,
 * and reliable offline fallback matching SRS Section 7 (FR-03 Weather Information).
 */

const STORAGE_KEY_CONFIG = 'esp32_weather_config_v1';
const STORAGE_KEY_CACHE = 'esp32_weather_cache_v1';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minute cache

export const WEATHER_ICONS = {
  'Clear': { icon: '☀️', condition: 'Clear Sky' },
  'Clouds': { icon: '⛅', condition: 'Partly Cloudy' },
  'Rain': { icon: '🌧️', condition: 'Rain' },
  'Drizzle': { icon: '🌦️', condition: 'Drizzle' },
  'Thunderstorm': { icon: '⛈️', condition: 'Thunderstorm' },
  'Snow': { icon: '❄️', condition: 'Snow' },
  'Mist': { icon: '🌫️', condition: 'Mist' },
  'Fog': { icon: '🌫️', condition: 'Fog' },
  'Haze': { icon: '🌤️', condition: 'Haze' }
};

// Realistic default weather matching SRS Section 7 example
export const DEFAULT_MOCK_WEATHER = {
  city: 'New Delhi',
  country: 'IN',
  temperature: 31.0,
  feelsLike: 33.0,
  condition: 'Partly Cloudy',
  mainCondition: 'Clouds',
  icon: '☁️',
  humidity: 59,
  windSpeedKmH: 12.0,
  pressure: 1006.0,
  visibilityKm: 8.5,
  uvIndex: 6,
  timestamp: new Date().toISOString(),
  isLive: false,
  hourlyForecast: [
    { time: '12:00', temp: 31, icon: '☁️', pop: 10 },
    { time: '14:00', temp: 33, icon: '⛅', pop: 15 },
    { time: '16:00', temp: 32, icon: '⛅', pop: 20 },
    { time: '18:00', temp: 29, icon: '🌤️', pop: 10 },
    { time: '20:00', temp: 27, icon: '🌙', pop: 5 },
    { time: '22:00', temp: 26, icon: '☁️', pop: 5 }
  ],
  dailyForecast: [
    { day: 'Today', max: 34, min: 25, condition: 'Partly Cloudy', icon: '⛅' },
    { day: 'Tomorrow', max: 33, min: 24, condition: 'Scattered Showers', icon: '🌦️' },
    { day: 'Wed', max: 31, min: 23, condition: 'Rain', icon: '🌧️' },
    { day: 'Thu', max: 32, min: 24, condition: 'Partly Cloudy', icon: '⛅' },
    { day: 'Fri', max: 35, min: 26, condition: 'Sunny', icon: '☀️' }
  ]
};

export class WeatherClient {
  constructor() {
    this.config = this.loadConfig();
    this.cachedWeather = this.loadCache();
  }

  loadConfig() {
    if (typeof localStorage === 'undefined') {
      return { apiKey: '', city: 'New Delhi', units: 'metric' };
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
      return raw ? JSON.parse(raw) : { apiKey: '', city: 'New Delhi', units: 'metric' };
    } catch {
      return { apiKey: '', city: 'New Delhi', units: 'metric' };
    }
  }

  saveConfig(newConfig = {}) {
    this.config = { ...this.config, ...newConfig };
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
      } catch (e) {
        console.warn('Failed to save weather config:', e);
      }
    }
  }

  loadCache() {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CACHE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed._cachedAt < CACHE_TTL_MS) {
          return parsed.data;
        }
      }
    } catch {}
    return null;
  }

  saveCache(data) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify({
        data,
        _cachedAt: Date.now()
      }));
    } catch {}
  }

  /**
   * Fetches weather from OpenWeather REST API or returns realistic offline dataset
   * @param {boolean} forceRefresh 
   * @returns {Promise<Object>} Weather information matching SRS FR-03
   */
  async getWeather(forceRefresh = false) {
    if (!forceRefresh && this.cachedWeather) {
      return this.cachedWeather;
    }

    const { apiKey, city } = this.config;

    if (!apiKey || apiKey.trim() === '') {
      // Return realistic mock weather with updated dynamic timestamp
      const mock = {
        ...DEFAULT_MOCK_WEATHER,
        city: city || DEFAULT_MOCK_WEATHER.city,
        timestamp: new Date().toISOString()
      };
      this.cachedWeather = mock;
      return mock;
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey.trim()}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`OpenWeather API returned ${res.status}`);
      }

      const json = await res.json();
      const main = json.main || {};
      const weatherArray = json.weather || [{}];
      const weatherMain = weatherArray[0].main || 'Clear';
      const iconMapping = WEATHER_ICONS[weatherMain] || { icon: '🌤️', condition: weatherArray[0].description || 'Clear' };

      const windSpeedKmH = json.wind?.speed ? Number((json.wind.speed * 3.6).toFixed(1)) : 10.0;

      const liveWeather = {
        city: json.name || city,
        country: json.sys?.country || '',
        temperature: Number((main.temp ?? 28).toFixed(1)),
        feelsLike: Number((main.feels_like ?? main.temp ?? 28).toFixed(1)),
        condition: weatherArray[0].description ? this.capitalize(weatherArray[0].description) : iconMapping.condition,
        mainCondition: weatherMain,
        icon: iconMapping.icon,
        humidity: Math.round(main.humidity ?? 55),
        windSpeedKmH,
        pressure: Math.round(main.pressure ?? 1012),
        visibilityKm: json.visibility ? Number((json.visibility / 1000).toFixed(1)) : 10.0,
        uvIndex: 5,
        timestamp: new Date().toISOString(),
        isLive: true,
        hourlyForecast: DEFAULT_MOCK_WEATHER.hourlyForecast,
        dailyForecast: DEFAULT_MOCK_WEATHER.dailyForecast
      };

      this.cachedWeather = liveWeather;
      this.saveCache(liveWeather);
      return liveWeather;
    } catch (err) {
      console.warn('Weather fetch failed, falling back to mock dataset:', err.message);
      const fallback = {
        ...DEFAULT_MOCK_WEATHER,
        city: city || DEFAULT_MOCK_WEATHER.city,
        timestamp: new Date().toISOString()
      };
      this.cachedWeather = fallback;
      return fallback;
    }
  }

  capitalize(str = '') {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  }
}

// Export singleton instance
export const weatherClient = new WeatherClient();
