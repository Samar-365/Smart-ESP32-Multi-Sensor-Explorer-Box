/**
 * Submodule 6.3: Chart.js Visualization Engine
 * Dark-mode styled spline line charts, dual Y-axis comparison charts, and histogram bars.
 * Fulfills SRS Section 8 (FR-04.1 Trends), Section 11 (FR-04.5 Comparison), Section 14 (FR-04.8 Motion).
 */

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  LinearScale,
  CategoryScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler
);

export class ChartManager {
  constructor() {
    this.instances = new Map(); // canvasId -> Chart instance
  }

  /**
   * Destroys existing chart instance on a canvas if present
   * @param {string|HTMLCanvasElement} target Canvas element or ID
   */
  destroy(target) {
    const id = typeof target === 'string' ? target : target?.id;
    if (!id) return;
    if (this.instances.has(id)) {
      this.instances.get(id).destroy();
      this.instances.delete(id);
    }
  }

  /**
   * Cleans up all active chart instances
   */
  destroyAll() {
    for (const [id, chart] of this.instances.entries()) {
      chart.destroy();
    }
    this.instances.clear();
  }

  getCanvas(target) {
    if (typeof target === 'string') {
      return document.getElementById(target);
    }
    return target;
  }

  /**
   * Formats ISO timestamp to short human label (e.g. "10:30" or "09/06 10:30")
   */
  formatTimeLabel(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /**
   * Creates or updates a smooth Spline Line Chart for sensor trends (FR-04.1)
   * @param {string|HTMLCanvasElement} target 
   * @param {Array<Object>} readings 
   * @param {string} sensorKey 
   * @param {Object} options 
   */
  renderTrendChart(target, readings = [], sensorKey = 'temperature', options = {}) {
    const canvas = this.getCanvas(target);
    if (!canvas) return null;
    this.destroy(canvas.id);

    const color = options.color || '#ffffff';
    const label = options.label || 'Sensor Value';
    const unit = options.unit || '';

    // Downsample if array is very dense (> 120 points) for fluid 60fps rendering
    let dataPoints = readings;
    if (dataPoints.length > 120) {
      const step = Math.ceil(dataPoints.length / 120);
      dataPoints = dataPoints.filter((_, idx) => idx % step === 0);
    }

    const labels = dataPoints.map(r => this.formatTimeLabel(r.timestamp));
    const values = dataPoints.map(r => r[sensorKey]);

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height || 260);
    gradient.addColorStop(0, `${color}40`);
    gradient.addColorStop(1, `${color}00`);

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `${label} (${unit})`,
          data: values,
          borderColor: color,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: values.length > 40 ? 0 : 2.5,
          pointHoverRadius: 5,
          pointBackgroundColor: color
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: options.showLegend ?? true,
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } }
          },
          tooltip: {
            backgroundColor: '#0f121a',
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} ${unit}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b', maxTicksLimit: 8, font: { family: 'JetBrains Mono', size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } },
            suggestedMin: options.min,
            suggestedMax: options.max
          }
        }
      }
    });

    this.instances.set(canvas.id, chart);
    return chart;
  }

  /**
   * Renders Synchronized Dual-Axis Chart for Sensor Comparison (FR-04.5)
   * Left Y-axis (y1) for Sensor 1, Right Y-axis (y2) for Sensor 2
   */
  renderComparisonChart(target, comparisonResult) {
    const canvas = this.getCanvas(target);
    if (!canvas) return null;
    this.destroy(canvas.id);

    const s1 = comparisonResult.sensor1;
    const s2 = comparisonResult.sensor2;
    const chartData = comparisonResult.chartData;

    const labels = chartData.labels.map(ts => this.formatTimeLabel(ts));

    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `${s1.name} (${s1.unit})`,
            data: chartData.datasets[0].data,
            borderColor: s1.color,
            backgroundColor: `${s1.color}20`,
            yAxisID: 'y1',
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4
          },
          {
            label: `${s2.name} (${s2.unit})`,
            data: chartData.datasets[1].data,
            borderColor: s2.color,
            backgroundColor: `${s2.color}20`,
            yAxisID: 'y2',
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } }
          },
          tooltip: {
            backgroundColor: '#131d31',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1,
            padding: 10
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b', maxTicksLimit: 8, font: { family: 'JetBrains Mono', size: 10 } }
          },
          y1: {
            type: 'linear',
            position: 'left',
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: s1.color, font: { family: 'JetBrains Mono', size: 10 } },
            title: { display: true, text: `${s1.name} (${s1.unit})`, color: s1.color }
          },
          y2: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false }, // Avoid overlapping grid lines
            ticks: { color: s2.color, font: { family: 'JetBrains Mono', size: 10 } },
            title: { display: true, text: `${s2.name} (${s2.unit})`, color: s2.color }
          }
        }
      }
    });

    this.instances.set(canvas.id, chart);
    return chart;
  }

  /**
   * Renders 24-Hour Motion Trigger Histogram (FR-04.8)
   */
  renderMotionHistogram(target, hourlyDistribution = []) {
    const canvas = this.getCanvas(target);
    if (!canvas) return null;
    this.destroy(canvas.id);

    const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Motion Events',
          data: hourlyDistribution,
          backgroundColor: 'rgba(236, 72, 153, 0.65)',
          hoverBackgroundColor: '#ec4899',
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#131d31',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 9 }, maxTicksLimit: 12 }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b', precision: 0, font: { family: 'JetBrains Mono', size: 10 } }
          }
        }
      }
    });

    this.instances.set(canvas.id, chart);
    return chart;
  }
}

// Export singleton
export const chartManager = new ChartManager();
