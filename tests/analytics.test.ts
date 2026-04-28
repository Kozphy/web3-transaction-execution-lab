import { describe, expect, it } from "vitest";

import { calculateErrorAnalytics } from "@/lib/errors/error-analytics";
import { createTransactionHistoryItem, updateTransactionHistoryItem } from "@/lib/history/transaction-history";
import { createExecutionLog } from "@/lib/logs/execution-log";

describe("error analytics", () => {
  it("aggregates history and log errors", () => {
    const base = createTransactionHistoryItem({
      mode: "live",
      from: "0x1111111111111111111111111111111111111111",
      to: "0x2222222222222222222222222222222222222222",
      amountEth: "0.1",
      chainId: 11155111,
      status: "idle",
      now: "2026-01-01T00:00:00.000Z"
    });
    const failed = updateTransactionHistoryItem(base, {
      status: "failed",
      errorCode: "INSUFFICIENT_FUNDS",
      errorMessage: "Insufficient funds.",
      now: "2026-01-01T00:01:00.000Z"
    });
    const log = createExecutionLog({
      level: "error",
      eventType: "validation_failed",
      message: "Invalid address.",
      metadata: { errorCode: "INVALID_RECIPIENT" },
      timestamp: "2026-01-01T00:02:00.000Z"
    });

    const analytics = calculateErrorAnalytics([failed], [log]);
    expect(analytics.totalErrors).toBe(2);
    expect(analytics.countByType.insufficient_funds).toBe(1);
    expect(analytics.countByType.invalid_recipient).toBe(1);
    expect(analytics.errorRate).toBe(1);
    expect(analytics.latestError?.message).toBe("Invalid address.");
  });
});
