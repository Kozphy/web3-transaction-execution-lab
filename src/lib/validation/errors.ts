import { BaseError, InsufficientFundsError, UserRejectedRequestError } from "viem";

import type { ClassifiedWeb3Error, Web3ErrorCode } from "@/types/errors";

const ERROR_MESSAGES: Record<Web3ErrorCode, string> = {
  USER_REJECTED: "Request rejected in wallet.",
  WRONG_CHAIN: "Wrong network. Switch to Sepolia and try again.",
  INSUFFICIENT_FUNDS: "Insufficient funds for transfer value plus gas.",
  INVALID_RECIPIENT: "Enter a valid recipient address.",
  INVALID_AMOUNT: "Enter an ETH amount greater than zero.",
  RPC_NETWORK_FAILURE: "RPC or network request failed. Check your connection and try again.",
  TRANSACTION_REVERTED: "Transaction failed or reverted on-chain.",
  WALLET_NOT_CONNECTED: "Connect a wallet before continuing.",
  CLIENT_UNAVAILABLE: "Wallet or RPC client is not ready.",
  UNKNOWN: "Unexpected wallet or RPC error."
};

export function buildWeb3Error(code: Web3ErrorCode): ClassifiedWeb3Error {
  return {
    code,
    message: ERROR_MESSAGES[code]
  };
}

export function classifyWeb3Error(error: unknown): ClassifiedWeb3Error {
  if (error instanceof UserRejectedRequestError) {
    return buildWeb3Error("USER_REJECTED");
  }

  if (error instanceof InsufficientFundsError) {
    return buildWeb3Error("INSUFFICIENT_FUNDS");
  }

  if (error instanceof BaseError) {
    const causeName = error.walk()?.name;

    if (causeName === "UserRejectedRequestError") {
      return buildWeb3Error("USER_REJECTED");
    }

    if (causeName === "InsufficientFundsError") {
      return buildWeb3Error("INSUFFICIENT_FUNDS");
    }

    if (isNetworkMessage(error.shortMessage) || isNetworkMessage(error.message)) {
      return buildWeb3Error("RPC_NETWORK_FAILURE");
    }

    if (isRevertedMessage(error.shortMessage) || isRevertedMessage(error.message)) {
      return buildWeb3Error("TRANSACTION_REVERTED");
    }

    return {
      code: "UNKNOWN",
      message: error.shortMessage
    };
  }

  if (error instanceof Error) {
    return classifyMessage(error.message);
  }

  return buildWeb3Error("UNKNOWN");
}

export function classifyMessage(message: string): ClassifiedWeb3Error {
  if (/user rejected|rejected request|denied|declined/i.test(message)) {
    return buildWeb3Error("USER_REJECTED");
  }

  if (/insufficient funds/i.test(message)) {
    return buildWeb3Error("INSUFFICIENT_FUNDS");
  }

  if (isNetworkMessage(message)) {
    return buildWeb3Error("RPC_NETWORK_FAILURE");
  }

  if (isRevertedMessage(message)) {
    return buildWeb3Error("TRANSACTION_REVERTED");
  }

  return {
    code: "UNKNOWN",
    message
  };
}

function isNetworkMessage(message: string) {
  return /network|rpc|timeout|timed out|fetch failed|failed to fetch|503|502|429/i.test(message);
}

function isRevertedMessage(message: string) {
  return /reverted|execution reverted|receipt status.*reverted|status.*0x0/i.test(message);
}
