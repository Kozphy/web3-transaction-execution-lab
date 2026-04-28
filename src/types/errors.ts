export type Web3ErrorCode =
  | "USER_REJECTED"
  | "WRONG_CHAIN"
  | "INSUFFICIENT_FUNDS"
  | "INVALID_RECIPIENT"
  | "INVALID_AMOUNT"
  | "RPC_NETWORK_FAILURE"
  | "TRANSACTION_REVERTED"
  | "WALLET_NOT_CONNECTED"
  | "CLIENT_UNAVAILABLE"
  | "UNKNOWN";

export type ClassifiedWeb3Error = {
  code: Web3ErrorCode;
  message: string;
};
