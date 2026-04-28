import type { Address, Hash } from "viem";

import type { ExecutionMode } from "@/lib/mode/execution-mode";
import type { FeeEstimate, TransactionHistoryItem, TransactionStatus } from "@/types/transactions";
import type { Web3ErrorCode } from "@/types/errors";

export const TRANSACTION_HISTORY_STORAGE_KEY = "web3-lab:transaction-history";

export type CreateHistoryItemInput = {
  mode: ExecutionMode;
  hash?: Hash;
  from: Address;
  to: Address;
  amountEth: string;
  chainId: number;
  status: TransactionStatus;
  feeEstimate?: FeeEstimate;
  errorCode?: Web3ErrorCode;
  errorMessage?: string;
  explorerUrl?: string;
  now?: string;
};

export function createTransactionHistoryItem(input: CreateHistoryItemInput): TransactionHistoryItem {
  const now = input.now ?? new Date().toISOString();

  return {
    id: `${input.mode}-${now}-${input.to}`.replace(/[^a-zA-Z0-9-]/g, ""),
    mode: input.mode,
    hash: input.hash,
    from: input.from,
    to: input.to,
    amountEth: input.amountEth,
    chainId: input.chainId,
    status: input.status,
    gasEstimate: input.feeEstimate?.gas.toString(),
    maxFeePerGas: input.feeEstimate?.maxFeePerGas.toString(),
    maxPriorityFeePerGas: input.feeEstimate?.maxPriorityFeePerGas.toString(),
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
    explorerUrl: input.explorerUrl,
    createdAt: now,
    updatedAt: now,
    submittedAt: input.status === "pending" ? now : undefined,
    confirmedAt: input.status === "confirmed" ? now : undefined
  };
}

export function updateTransactionHistoryItem(
  item: TransactionHistoryItem,
  updates: Partial<
    Pick<
      TransactionHistoryItem,
      "hash" | "status" | "errorCode" | "errorMessage" | "explorerUrl" | "submittedAt" | "confirmedAt"
    >
  > & { now?: string }
): TransactionHistoryItem {
  const now = updates.now ?? new Date().toISOString();

  return {
    ...item,
    ...updates,
    updatedAt: now,
    submittedAt: updates.status === "pending" ? now : updates.submittedAt ?? item.submittedAt,
    confirmedAt: updates.status === "confirmed" ? now : updates.confirmedAt ?? item.confirmedAt
  };
}

export function upsertTransactionHistoryItem(
  items: TransactionHistoryItem[],
  item: TransactionHistoryItem
): TransactionHistoryItem[] {
  const nextItems = items.some((candidate) => candidate.id === item.id)
    ? items.map((candidate) => (candidate.id === item.id ? item : candidate))
    : [item, ...items];

  return sortHistoryLatestFirst(nextItems);
}

export function sortHistoryLatestFirst(items: TransactionHistoryItem[]) {
  return [...items].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function serializeTransactionHistory(items: TransactionHistoryItem[]) {
  return JSON.stringify(sortHistoryLatestFirst(items));
}

export function deserializeTransactionHistory(raw: string | null): TransactionHistoryItem[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortHistoryLatestFirst(
      parsed.filter((item): item is TransactionHistoryItem => isTransactionHistoryItem(item))
    );
  } catch {
    return [];
  }
}

export function loadTransactionHistory(storage: Storage) {
  return deserializeTransactionHistory(storage.getItem(TRANSACTION_HISTORY_STORAGE_KEY));
}

export function saveTransactionHistory(storage: Storage, items: TransactionHistoryItem[]) {
  storage.setItem(TRANSACTION_HISTORY_STORAGE_KEY, serializeTransactionHistory(items));
}

export function clearTransactionHistory(storage: Storage) {
  storage.removeItem(TRANSACTION_HISTORY_STORAGE_KEY);
}

function isTransactionHistoryItem(item: unknown): item is TransactionHistoryItem {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    (candidate.mode === "mock" || candidate.mode === "live") &&
    typeof candidate.from === "string" &&
    typeof candidate.to === "string" &&
    typeof candidate.amountEth === "string" &&
    typeof candidate.chainId === "number" &&
    typeof candidate.status === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string"
  );
}
