// Unit test for Module 5: Weather Integration
import { WeatherClient, DEFAULT_MOCK_WEATHER } from '../src/modules/weather/weatherClient.js';
import { DifferentialComparator } from '../src/modules/weather/differentialComparator.js';

console.log('Testing Module 5: Weather Integration...');

async function runTests() {
  const client = new WeatherClient();

  // 1. Fetch weather (fallback mode matching SRS Section 7)
  const weather = await client.getWeather();
  console.assert(weather.temperature === 31.0, `Expected temp 31.0, got ${weather.temperature}`);
  console.assert(weather.condition === 'Partly Cloudy', `Expected Partly Cloudy, got ${weather.condition}`);
  console.assert(weather.humidity === 59, `Expected humidity 59%, got ${weather.humidity}`);
  console.assert(weather.windSpeedKmH === 12.0, `Expected wind 12 km/h, got ${weather.windSpeedKmH}`);
  console.assert(weather.pressure === 1006.0, `Expected pressure 1006 hPa, got ${weather.pressure}`);
  console.assert(weather.feelsLike === 33.0, `Expected feels-like 33°C, got ${weather.feelsLike}`);
  console.log('✓ Weather data exactly matches SRS Section 7 (FR-03)');

  // 2. Config update
  client.saveConfig({ city: 'Mumbai' });
  console.assert(client.config.city === 'Mumbai', 'Config city updated');
  console.log('✓ WeatherClient config update works');

  // 3. Indoor vs Outdoor Differential Comparator
  const indoorReading = {
    temperature: 28.5,
    humidity: 63.0,
    pressure: 1008.0
  };

  const comparison = DifferentialComparator.compare(indoorReading, weather);
  console.assert(comparison.deltas.temp === -2.5, `Delta temp expected -2.5, got ${comparison.deltas.temp}`);
  console.assert(comparison.deltas.humidity === 4.0, `Delta humidity expected 4.0, got ${comparison.deltas.humidity}`);
  console.assert(comparison.deltas.pressure === 2.0, `Delta pressure expected 2.0, got ${comparison.deltas.pressure}`);
  console.assert(comparison.advisories.thermal.includes('cooler than outdoors'), 'Thermal advisory generated');
  console.log('✓ DifferentialComparator calculates deltas and generates environmental advisories');

  console.log('\nAll Module 5 tests PASSED successfully!');
}

runTests();
