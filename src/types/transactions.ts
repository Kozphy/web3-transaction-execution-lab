import type { Address, Hash } from "viem";

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
