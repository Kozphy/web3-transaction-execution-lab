import { describe, expect, it } from "vitest";

import {
  createTransactionHistoryItem,
  deserializeTransactionHistory,
  serializeTransactionHistory,
  sortHistoryLatestFirst,
  updateTransactionHistoryItem
} from "@/lib/history/transaction-history";
import { buildFeeEstimate } from "@/lib/tx/fees";

const feeEstimate = buildFeeEstimate({
  gas: 21000n,
  valueWei: 100000000000000000n,
  maxFeePerGas: 2000000000n,
  maxPriorityFeePerGas: 100000000n
});

describe("transaction history", () => {
  it("serializes and deserializes valid history items", () => {
    const item = createTransactionHistoryItem({
      mode: "mock",
      from: "0x1111111111111111111111111111111111111111",
      to: "0x2222222222222222222222222222222222222222",
      amountEth: "0.1",
      chainId: 11155111,
      status: "idle",
      feeEstimate,
      now: "2026-01-01T00:00:00.000Z"
    });

    expect(deserializeTransactionHistory(serializeTransactionHistory([item]))).toEqual([item]);
  });

  it("sorts latest transactions first", () => {
    const older = createTransactionHistoryItem({
      mode: "mock",
      from: "0x1111111111111111111111111111111111111111",
      to: "0x2222222222222222222222222222222222222222",
      amountEth: "0.1",
      chainId: 11155111,
      status: "idle",
      now: "2026-01-01T00:00:00.000Z"
    });
    const newer = updateTransactionHistoryItem(older, {
      status: "confirmed",
      now: "2026-01-01T00:01:00.000Z"
    });

    expect(sortHistoryLatestFirst([older, newer])[0]).toEqual(newer);
  });

  it("ignores malformed serialized data", () => {
    expect(deserializeTransactionHistory("not json")).toEqual([]);
    expect(deserializeTransactionHistory(JSON.stringify([{ id: 1 }]))).toEqual([]);
  });
});
