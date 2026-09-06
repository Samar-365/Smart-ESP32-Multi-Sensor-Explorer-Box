/**
 * Submodule 2: Telemetry & Ingestion - CSV Exporter
 * Generates and downloads historical sensor readings in standard CSV format.
 * Fulfills SRS Section 20 (FR-09 Data Export).
 */

export class CsvExporter {
  /**
   * Converts array of sensor readings into CSV string
   * Matching format: timestamp,temperature,humidity,pressure,gas,light,distance,motion
   * @param {Array<Object>} readings 
   * @returns {string} CSV text
   */
  static generateCsv(readings) {
    if (!Array.isArray(readings) || readings.length === 0) {
      return 'timestamp,temperature,humidity,pressure,gas,light,distance,motion\n';
    }

    const header = 'timestamp,temperature,humidity,pressure,gas,light,distance,motion';
    const rows = readings.map(r => {
      const ts = r.timestamp || new Date().toISOString();
      const temp = r.temperature ?? '';
      const hum = r.humidity ?? '';
      const pres = r.pressure ?? '';
      const gas = r.gas ?? '';
      const light = r.light ?? '';
      const dist = r.distance ?? '';
      const motion = r.motion ? 1 : 0;

      return `${ts},${temp},${hum},${pres},${gas},${light},${dist},${motion}`;
    });

    return [header, ...rows].join('\r\n');
  }

  /**
   * Triggers client-side browser download of generated CSV
   * @param {Array<Object>} readings 
   * @param {string} prefix Optional file prefix
   */
  static download(readings, prefix = 'esp32_explorer_data') {
    const csvContent = this.generateCsv(readings);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const timestampStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `${prefix}_${timestampStr}.csv`;

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
