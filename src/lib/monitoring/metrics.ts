import type { ExecutionLogItem, ExecutionLogLevel } from "@/lib/logs/execution-log";
import type { TransactionHistoryItem } from "@/types/transactions";

export type MonitoringMetrics = {
  totalTransactionAttempts: number;
  confirmedTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  successRate: number;
  failureRate: number;
  averageGasEstimate: number;
  averageMaxFeePerGas: number;
  averageConfirmationTimeMs: number;
  latestStatus: string;
  logsByLevel: Record<ExecutionLogLevel, number>;
  timeline: Array<{
    label: string;
    status: string;
    timestamp: string;
  }>;
};

export function calculateMonitoringMetrics(
  history: TransactionHistoryItem[],
  logs: ExecutionLogItem[]
): MonitoringMetrics {
  const totalTransactionAttempts = history.length;
  const confirmedTransactions = history.filter((item) => item.status === "confirmed").length;
  const failedTransactions = history.filter((item) => item.status === "failed").length;
  const pendingTransactions = history.filter((item) => item.status === "pending").length;
  const latest = [...history].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];

  return {
    totalTransactionAttempts,
    confirmedTransactions,
    failedTransactions,
    pendingTransactions,
    successRate: totalTransactionAttempts === 0 ? 0 : confirmedTransactions / totalTransactionAttempts,
    failureRate: totalTransactionAttempts === 0 ? 0 : failedTransactions / totalTransactionAttempts,
    averageGasEstimate: averageNumeric(history.map((item) => item.gasEstimate)),
    averageMaxFeePerGas: averageNumeric(history.map((item) => item.maxFeePerGas)),
    averageConfirmationTimeMs: averageConfirmationTime(history),
    latestStatus: latest?.status ?? "idle",
    logsByLevel: countLogsByLevel(logs),
    timeline: history.slice(0, 12).map((item) => ({
      label: `${item.mode} ${item.amountEth} ETH`,
      status: item.status,
      timestamp: item.updatedAt
    }))
  };
}

function averageNumeric(values: Array<string | undefined>) {
  const parsed = values
    .map((value) => (value === undefined ? undefined : Number(value)))
    .filter((value): value is number => value !== undefined && Number.isFinite(value));

  if (parsed.length === 0) {
    return 0;
  }

  return parsed.reduce((sum, value) => sum + value, 0) / parsed.length;
}

function averageConfirmationTime(history: TransactionHistoryItem[]) {
  const durations = history
    .filter((item) => item.confirmedAt)
    .map((item) => Date.parse(item.confirmedAt as string) - Date.parse(item.createdAt))
    .filter((duration) => Number.isFinite(duration) && duration >= 0);

  if (durations.length === 0) {
    return 0;
  }

  return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
}

function countLogsByLevel(logs: ExecutionLogItem[]): Record<ExecutionLogLevel, number> {
  return logs.reduce<Record<ExecutionLogLevel, number>>(
    (counts, log) => ({
      ...counts,
      [log.level]: counts[log.level] + 1
    }),
    {
      info: 0,
      warning: 0,
      error: 0,
      success: 0
    }
  );
}
