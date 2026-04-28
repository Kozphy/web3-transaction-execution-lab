import type { Chain } from "viem";

import type { FeeEstimate, TransferTransactionRequest } from "@/types/transactions";

export function buildEthTransferTransaction(request: TransferTransactionRequest) {
  return {
    account: request.account,
    to: request.to,
    value: request.value
  };
}

export function buildEip1559TransferTransaction(
  request: TransferTransactionRequest,
  feeEstimate: FeeEstimate,
  chain: Chain
) {
  return {
    account: request.account,
    chain,
    to: request.to,
    value: request.value,
    gas: feeEstimate.gas,
    maxFeePerGas: feeEstimate.maxFeePerGas,
    maxPriorityFeePerGas: feeEstimate.maxPriorityFeePerGas
  };
}
