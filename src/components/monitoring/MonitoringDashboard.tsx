"use client";

import { calculateMonitoringMetrics } from "@/lib/monitoring/metrics";
import { formatGas } from "@/lib/tx/fees";
import type { ExecutionLogItem } from "@/lib/logs/execution-log";
import type { TransactionHistoryItem } from "@/types/transactions";

export function MonitoringDashboard({
  history,
  logs
}: {
  history: TransactionHistoryItem[];
  logs: ExecutionLogItem[];
}) {
  const metrics = calculateMonitoringMetrics(history, logs);
  const maxTimeline = Math.max(metrics.timeline.length, 1);

  return (
    <section className="card panel-card monitoring-card">
      <div className="section-heading">
        <p className="eyebrow">Monitoring</p>
        <h2>Grafana-style execution overview</h2>
        <p className="muted">Local operational metrics derived from transaction history and structured logs.</p>
      </div>

      <div className="metrics-grid">
        <Metric label="Attempts" value={String(metrics.totalTransactionAttempts)} />
        <Metric label="Confirmed" value={String(metrics.confirmedTransactions)} />
        <Metric label="Failed" value={String(metrics.failedTransactions)} />
        <Metric label="Pending" value={String(metrics.pendingTransactions)} />
        <Metric label="Success rate" value={`${(metrics.successRate * 100).toFixed(1)}%`} />
        <Metric label="Failure rate" value={`${(metrics.failureRate * 100).toFixed(1)}%`} />
        <Metric label="Avg gas" value={Math.round(metrics.averageGasEstimate).toLocaleString()} />
        <Metric label="Avg max fee" value={formatGas(BigInt(Math.round(metrics.averageMaxFeePerGas)))} />
        <Metric label="Avg confirmation" value={`${Math.round(metrics.averageConfirmationTimeMs / 1000)}s`} />
        <Metric label="Latest status" value={metrics.latestStatus} />
      </div>

      <div className="log-level-grid">
        {Object.entries(metrics.logsByLevel).map(([level, count]) => (
          <div className="metric mini" key={level}>
            <span>{level} logs</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>

      <div className="timeline">
        {metrics.timeline.length === 0 ? <p className="muted">No transaction timeline yet.</p> : null}
        {metrics.timeline.map((point, index) => (
          <div className="timeline-row" key={`${point.timestamp}-${index}`}>
            <span>{new Date(point.timestamp).toLocaleTimeString()}</span>
            <div className="bar-track">
              <div
                className={`bar ${point.status}`}
                style={{ width: `${Math.max(12, ((maxTimeline - index) / maxTimeline) * 100)}%` }}
              />
            </div>
            <strong>{point.status}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
