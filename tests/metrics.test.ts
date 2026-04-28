import { describe, expect, it } from "vitest";

import { createTransactionHistoryItem, updateTransactionHistoryItem } from "@/lib/history/transaction-history";
import { createExecutionLog } from "@/lib/logs/execution-log";
import { calculateMonitoringMetrics } from "@/lib/monitoring/metrics";
import { buildFeeEstimate } from "@/lib/tx/fees";

describe("monitoring metrics", () => {
  it("calculates transaction and log metrics", () => {
    const estimate = buildFeeEstimate({
      gas: 21000n,
      valueWei: 100000000000000000n,
      maxFeePerGas: 2000000000n,
      maxPriorityFeePerGas: 100000000n
    });
    const base = createTransactionHistoryItem({
      mode: "mock",
      from: "0x1111111111111111111111111111111111111111",
      to: "0x2222222222222222222222222222222222222222",
      amountEth: "0.1",
      chainId: 11155111,
      status: "pending",
      feeEstimate: estimate,
      now: "2026-01-01T00:00:00.000Z"
    });
    const confirmed = updateTransactionHistoryItem(base, {
      status: "confirmed",
      now: "2026-01-01T00:00:10.000Z"
    });
    const log = createExecutionLog({
      level: "success",
      eventType: "transaction_confirmed",
      message: "Confirmed.",
      timestamp: "2026-01-01T00:00:10.000Z"
    });

    const metrics = calculateMonitoringMetrics([confirmed], [log]);
    expect(metrics.totalTransactionAttempts).toBe(1);
    expect(metrics.confirmedTransactions).toBe(1);
    expect(metrics.successRate).toBe(1);
    expect(metrics.averageGasEstimate).toBe(21000);
    expect(metrics.averageMaxFeePerGas).toBe(2000000000);
    expect(metrics.averageConfirmationTimeMs).toBe(10000);
    expect(metrics.logsByLevel.success).toBe(1);
  });
});
