import { formatEther, formatGwei } from "viem";

import type { FeeEstimate } from "@/types/transactions";

export type Eip1559FeeInput = {
  gas: bigint;
  valueWei: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
};

export function buildFeeEstimate(input: Eip1559FeeInput): FeeEstimate {
  return {
    gas: input.gas,
    maxFeePerGas: input.maxFeePerGas,
    maxPriorityFeePerGas: input.maxPriorityFeePerGas,
    estimatedTotalCostWei: input.valueWei + input.gas * input.maxFeePerGas
  };
}

export function hasSufficientFunds(balanceWei: bigint | undefined, estimate: FeeEstimate) {
  if (balanceWei === undefined) {
    return true;
  }

  return balanceWei >= estimate.estimatedTotalCostWei;
}

export function formatEth(valueWei?: bigint, maximumFractionDigits = 6) {
  if (valueWei === undefined) {
    return "0 ETH";
  }

  return `${Number(formatEther(valueWei)).toLocaleString(undefined, {
    maximumFractionDigits
  })} ETH`;
}

export function formatGas(valueWei?: bigint) {
  if (valueWei === undefined) {
    return "0 gwei";
  }

  return `${Number(formatGwei(valueWei)).toLocaleString(undefined, {
    maximumFractionDigits: 4
  })} gwei`;
}
