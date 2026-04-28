"use client";

import { formatGas } from "@/lib/tx/fees";
import type { TransactionHistoryItem } from "@/types/transactions";

export function TransactionHistoryPanel({
  items,
  onClear
}: {
  items: TransactionHistoryItem[];
  onClear: () => void;
}) {
  return (
    <section className="card panel-card">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Persistence</p>
          <h2>Transaction history</h2>
        </div>
        <button type="button" onClick={onClear} disabled={items.length === 0}>
          Clear history
        </button>
      </div>

      <div className="list-stack">
        {items.length === 0 ? <p className="muted">No transactions recorded yet.</p> : null}
        {items.map((item) => (
          <article className="history-item" key={item.id}>
            <div className="row-between">
              <strong>{item.status}</strong>
              <span className={`pill ${item.mode}`}>{item.mode}</span>
            </div>
            <p>
              {item.amountEth} ETH to <code>{item.to}</code>
            </p>
            <div className="compact-grid">
              <span>Gas: {item.gasEstimate ?? "n/a"}</span>
              <span>Max fee: {formatGas(item.maxFeePerGas ? BigInt(item.maxFeePerGas) : undefined)}</span>
              <span>Priority: {formatGas(item.maxPriorityFeePerGas ? BigInt(item.maxPriorityFeePerGas) : undefined)}</span>
              <span>{new Date(item.updatedAt).toLocaleString()}</span>
            </div>
            {item.hash ? (
              item.explorerUrl ? (
                <a href={item.explorerUrl} target="_blank" rel="noreferrer">
                  {item.hash}
                </a>
              ) : (
                <code>{item.hash}</code>
              )
            ) : null}
            {item.errorMessage ? <p className="inline-error">{item.errorMessage}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
