import type { Address, Hash } from "viem";

import type { ExecutionMode } from "@/lib/mode/execution-mode";
import type { Web3ErrorCode } from "@/types/errors";

export type TransactionStatus =
  | "idle"
  | "preparing"
  | "awaiting_signature"
  | "pending"
  | "confirmed"
  | "failed";

export type TransactionDraft = {
  to: Address;
  valueWei: bigint;
};

export type FeeEstimate = {
  gas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedTotalCostWei: bigint;
};

export type SentTransaction = {
  hash: Hash;
  status: TransactionStatus;
};

export type TransferFormInput = {
  recipient: string;
  amountEth: string;
};

export type TransferTransactionRequest = {
  account: Address;
  to: Address;
  value: bigint;
};

export type TransactionHistoryItem = {
  id: string;
  mode: ExecutionMode;
  hash?: Hash;
  from: Address;
  to: Address;
  amountEth: string;
  chainId: number;
  status: TransactionStatus;
  gasEstimate?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  errorCode?: Web3ErrorCode;
  errorMessage?: string;
  explorerUrl?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  confirmedAt?: string;
};
