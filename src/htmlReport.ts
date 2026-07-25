export function generateHtmlReport(metrics: any): string {
  const latenciesJson = JSON.stringify(metrics.txLatencies || []);
  const labelsJson = JSON.stringify((metrics.txLatencies || []).map((_: any, i: number) => `Tx #${i + 1}`));

  const evmBlock = metrics.contractAddress
    ? `
    <div class="card" style="grid-column: span 2; border-color: #38bdf844;">
      <div class="card-title">🛠️ Deployed EVM Benchmark Contract</div>
      <div class="card-value" style="font-size: 14px; font-family: monospace; color: #38bdf8; word-break: break-all;">
        ${metrics.contractAddress}
      </div>
      <div style="margin-top: 8px; font-size: 13px; color: #94a3b8;">
        Final Counter State: <strong style="color: #4ade80;">${metrics.finalCounterValue ?? 'N/A'}</strong> increments
      </div>
    </div>
  `
    : `
    <div class="card" style="grid-column: span 2; border-color: #f59e0b33;">
      <div class="card-title">🛠️ EVM Contract Status</div>
      <div class="card-value" style="font-size: 14px; color: #fbbf24;">
        Not Deployed (Skipped / Insufficient Balance)
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GIWA StressForge Benchmark Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px; }
    .container { max-width: 1100px; margin: 0 auto; }
    h1 { font-size: 28px; margin-bottom: 8px; color: #38bdf8; }
    .subtitle { color: #94a3b8; margin-bottom: 30px; font-size: 14px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }
    .card-title { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .card-value { font-size: 22px; font-weight: bold; color: #f1f5f9; }
    .card-value.success { color: #4ade80; }
    .card-value.warning { color: #fbbf24; }
    .chart-container { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #f8fafc; }
    .diagnostics { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }
    .diag-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #334155; }
    .diag-item:last-child { border-bottom: none; }
    .diag-label { color: #94a3b8; }
    .diag-val { font-weight: 600; color: #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚒️ GIWA StressForge Benchmark Report</h1>
    <div class="subtitle">Execution Profile: <strong>${metrics.profile}</strong> | Target Chain: GIWA Sepolia</div>

    <div class="grid">
      <div class="card">
        <div class="card-title">Total Duration</div>
        <div class="card-value">${metrics.durationMs.toFixed(2)} ms</div>
      </div>
      <div class="card">
        <div class="card-title">Success Rate</div>
        <div class="card-value ${metrics.successfulTxs > 0 ? 'success' : 'warning'}">${metrics.successfulTxs} / ${metrics.totalTxCount}</div>
      </div>
      <div class="card">
        <div class="card-title">Avg Latency</div>
        <div class="card-value">${metrics.avgLatencyMs.toFixed(2)} ms</div>
      </div>
      <div class="card">
        <div class="card-title">Blocks Covered</div>
        <div class="card-value" style="font-size: 16px;">${metrics.blocksCovered.join(', ') || 'None'}</div>
      </div>
      ${evmBlock}
    </div>

    <div class="chart-container">
      <div class="section-title">Broadcast to Inclusion Latency (ms)</div>
      <canvas id="latencyChart" height="100"></canvas>
    </div>

    <div class="diagnostics">
      <div class="section-title">🛡️ Resilience & RPC Diagnostics</div>
      <div class="diag-item">
        <span class="diag-label">Parallel Read-Spam Queries</span>
        <span class="diag-val">${metrics.readSpamSuccess || 0} / ${metrics.readSpamTotal || 0} Passed (${metrics.readSpamFailed || 0} Throttled)</span>
      </div>
      <div class="diag-item">
        <span class="diag-label">Rate Limits Caught (HTTP 429)</span>
        <span class="diag-val" style="color: #fbbf24;">${metrics.rateLimitsCaught || 0} Events</span>
      </div>
      <div class="diag-item">
        <span class="diag-label">Backoff Retries Executed</span>
        <span class="diag-val">${metrics.retriesExecuted || 0} Attempts</span>
      </div>
      <div class="diag-item">
        <span class="diag-label">Transaction Breakdown</span>
        <span class="diag-val">${metrics.evmTxsCount || 0} EVM Calls / ${metrics.nativeTxsCount || 0} Native Transfers</span>
      </div>
      ${
        metrics.primaryFailureReason !== 'None'
          ? `
      <div class="diag-item">
        <span class="diag-label">Primary Failure Cause</span>
        <span class="diag-val" style="color: #f87171;">${metrics.primaryFailureReason}</span>
      </div>`
          : ''
      }
    </div>
  </div>

  <script>
    const ctx = document.getElementById('latencyChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ${labelsJson},
        datasets: [{
          label: 'Latency (ms)',
          data: ${latenciesJson},
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
          x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }
        },
        plugins: { legend: { labels: { color: '#f8fafc' } } }
      }
    });
  </script>
</body>
</html>`;
}