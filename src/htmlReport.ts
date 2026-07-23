import * as fs from 'fs';

export interface ReportData {
  timestamp: string;
  profile: string;
  totalDurationMs: number;
  totalTxsSent: number;
  successfulTxs: number;
  failedTxs: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  blocksCovered: number[];
  latencies: number[];
}

/**
 * Generates an interactive standalone HTML report with Chart.js visualization.
 */
export function generateHtmlReport(data: ReportData, outputPath: string): void {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GIWA StressForge Benchmark Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --bg-color: #0f172a;
      --card-bg: #1e293b;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --accent-green: #22c55e;
      --border: #334155;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-main);
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      color: var(--accent);
      font-size: 28px;
    }
    .meta {
      color: var(--text-muted);
      font-size: 14px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
    }
    .card .label {
      font-size: 12px;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }
    .card .value {
      font-size: 26px;
      font-weight: bold;
      margin-top: 8px;
      color: var(--text-main);
    }
    .card .value.green { color: var(--accent-green); }
    .chart-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ GIWA StressForge Benchmark Report</h1>
      <div class="meta">Profile: <strong>${data.profile}</strong> | Executed at: ${data.timestamp}</div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="label">Total Duration</div>
        <div class="value">${data.totalDurationMs.toFixed(2)} ms</div>
      </div>
      <div class="card">
        <div class="label">Success Rate</div>
        <div class="value green">${data.successfulTxs} / ${data.totalTxsSent}</div>
      </div>
      <div class="card">
        <div class="label">Avg Latency</div>
        <div class="value">${data.avgLatencyMs.toFixed(2)} ms</div>
      </div>
      <div class="card">
        <div class="label">Blocks Covered</div>
        <div class="value">#${data.blocksCovered.length > 0 ? data.blocksCovered.join(', #') : 'N/A'}</div>
      </div>
    </div>

    <div class="chart-container">
      <canvas id="latencyChart"></canvas>
    </div>
  </div>

  <script>
    const ctx = document.getElementById('latencyChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(data.latencies.map((_, i) => `Tx #${i + 1}`))},
        datasets: [{
          label: 'Broadcast to Inclusion Latency (ms)',
          data: ${JSON.stringify(data.latencies)},
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: '#f8fafc' } }
        },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
        }
      }
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(outputPath, htmlContent, 'utf-8');
}