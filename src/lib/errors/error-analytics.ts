import type { ExecutionLogItem } from "@/lib/logs/execution-log";
import type { ErrorAnalyticsType, Web3ErrorCode } from "@/types/errors";
import type { TransactionHistoryItem } from "@/types/transactions";

export const ERROR_SUGGESTED_ACTIONS: Record<ErrorAnalyticsType, string> = {
  rejected_signature: "User rejected wallet confirmation.",
  wrong_chain: "Switch wallet to Sepolia.",
  invalid_recipient: "Enter a valid 0x recipient address.",
  invalid_amount: "Enter a positive ETH amount.",
  insufficient_funds: "Get Sepolia ETH from a faucet.",
  rpc_network_failure: "Retry or use a dedicated RPC provider.",
  reverted_transaction: "Check transaction parameters and contract/network state.",
  unknown: "Inspect logs and raw error message."
};

export type ErrorAnalytics = {
  totalErrors: number;
  countByType: Record<ErrorAnalyticsType, number>;
  latestError?: {
    type: ErrorAnalyticsType;
    message: string;
    timestamp: string;
  };
  errorRate: number;
  mostCommonErrorType?: ErrorAnalyticsType;
  suggestedActions: Record<ErrorAnalyticsType, string>;
};

export function mapWeb3ErrorCodeToAnalyticsType(code: Web3ErrorCode | undefined): ErrorAnalyticsType {
  switch (code) {
    case "USER_REJECTED":
      return "rejected_signature";
    case "WRONG_CHAIN":
      return "wrong_chain";
    case "INVALID_RECIPIENT":
      return "invalid_recipient";
    case "INVALID_AMOUNT":
      return "invalid_amount";
    case "INSUFFICIENT_FUNDS":
      return "insufficient_funds";
    case "RPC_NETWORK_FAILURE":
      return "rpc_network_failure";
    case "TRANSACTION_REVERTED":
      return "reverted_transaction";
    default:
      return "unknown";
  }
}

export function calculateErrorAnalytics(
  history: TransactionHistoryItem[],
  logs: ExecutionLogItem[]
): ErrorAnalytics {
  const countByType = createEmptyCounts();
  const collectedErrors: Array<{ type: ErrorAnalyticsType; message: string; timestamp: string }> = [];

  for (const item of history) {
    if (item.errorCode || item.status === "failed") {
      const type = mapWeb3ErrorCodeToAnalyticsType(item.errorCode);
      countByType[type] += 1;
      collectedErrors.push({
        type,
        message: item.errorMessage ?? ERROR_SUGGESTED_ACTIONS[type],
        timestamp: item.updatedAt
      });
    }
  }

  for (const log of logs) {
    const rawErrorCode = typeof log.metadata?.errorCode === "string" ? log.metadata.errorCode : undefined;
    if (log.level === "error" || rawErrorCode) {
      const type = mapWeb3ErrorCodeToAnalyticsType(rawErrorCode as Web3ErrorCode | undefined);
      countByType[type] += 1;
      collectedErrors.push({
        type,
        message: log.message,
        timestamp: log.timestamp
      });
    }
  }

  const totalAttempts = history.length;
  const failedTransactions = history.filter((item) => item.status === "failed").length;
  const totalErrors = Object.values(countByType).reduce((sum, value) => sum + value, 0);
  const latestError = collectedErrors.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
  const mostCommonErrorType = getMostCommonErrorType(countByType);

  return {
    totalErrors,
    countByType,
    latestError,
    errorRate: totalAttempts === 0 ? 0 : failedTransactions / totalAttempts,
    mostCommonErrorType,
    suggestedActions: ERROR_SUGGESTED_ACTIONS
  };
}

function createEmptyCounts(): Record<ErrorAnalyticsType, number> {
  return {
    rejected_signature: 0,
    wrong_chain: 0,
    invalid_recipient: 0,
    invalid_amount: 0,
    insufficient_funds: 0,
    rpc_network_failure: 0,
    reverted_transaction: 0,
    unknown: 0
  };
}

function getMostCommonErrorType(counts: Record<ErrorAnalyticsType, number>) {
  const [first] = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  return first?.[0] as ErrorAnalyticsType | undefined;
}
