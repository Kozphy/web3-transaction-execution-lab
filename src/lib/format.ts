import { formatEther, formatGwei } from "viem";

export function formatAddress(address?: string) {
  if (!address) {
    return "Not connected";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEth(value?: bigint) {
  if (value === undefined) {
    return "0 ETH";
  }

  return `${Number(formatEther(value)).toLocaleString(undefined, {
    maximumFractionDigits: 6
  })} ETH`;
}

export function formatGas(value?: bigint) {
  if (value === undefined) {
    return "0 gwei";
  }

  return `${Number(formatGwei(value)).toLocaleString(undefined, {
    maximumFractionDigits: 4
  })} gwei`;
}
