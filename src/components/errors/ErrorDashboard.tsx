"use client";

import { calculateErrorAnalytics } from "@/lib/errors/error-analytics";
import type { ExecutionLogItem } from "@/lib/logs/execution-log";
import type { TransactionHistoryItem } from "@/types/transactions";

export function ErrorDashboard({
  history,
  logs
}: {
  history: TransactionHistoryItem[];
  logs: ExecutionLogItem[];
}) {
  const analytics = calculateErrorAnalytics(history, logs);
  const errorEntries = Object.entries(analytics.countByType);

  return (
    <section className="card panel-card">
      <div className="section-heading">
        <p className="eyebrow">Reliability</p>
        <h2>Error dashboard</h2>
        <p className="muted">Aggregates classified failures from transaction history and execution logs.</p>
      </div>

      <div className="metrics-grid">
        <Metric label="Total errors" value={String(analytics.totalErrors)} />
        <Metric label="Error rate" value={`${(analytics.errorRate * 100).toFixed(1)}%`} />
        <Metric label="Most common" value={analytics.mostCommonErrorType ?? "None"} />
        <Metric label="Latest error" value={analytics.latestError?.message ?? "None"} />
      </div>

      <div className="list-stack">
        {errorEntries.map(([type, count]) => (
          <article className="analytics-row" key={type}>
            <div className="row-between">
              <strong>{type}</strong>
              <span>{count}</span>
            </div>
            <p>{analytics.suggestedActions[type as keyof typeof analytics.suggestedActions]}</p>
          </article>
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
