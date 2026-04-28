import type { Address, Hash } from "viem";

import { supportedChain } from "@/lib/chains";
import { buildFeeEstimate } from "@/lib/tx/fees";
import type { FeeEstimate } from "@/types/transactions";

export type ExecutionMode = "mock" | "live";
export type MockOutcome = "confirmed" | "failed";

export const EXECUTION_MODE_STORAGE_KEY = "web3-lab:execution-mode";
export const mockWalletAddress = "0x1234567890AbcdEF1234567890aBcdef12345678" as Address;
export const mockBalanceWei = 2500000000000000000n;

export function isExecutionMode(value: unknown): value is ExecutionMode {
  return value === "mock" || value === "live";
}

export function parseExecutionMode(value: unknown): ExecutionMode {
  return isExecutionMode(value) ? value : "mock";
}

export function getModeLabel(mode: ExecutionMode) {
  return mode === "mock" ? "Mock simulation" : "Live Sepolia";
}

export function buildMockHash(seed: string): Hash {
  const encoded = Array.from(seed).map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"));
  return `0x${encoded.join("").padEnd(64, "0").slice(0, 64)}` as Hash;
}

export function buildMockFeeEstimate(amountWei: bigint): FeeEstimate {
  const gas = 21000n + (amountWei % 7000n);
  const maxFeePerGas = 1800000000n;
  const maxPriorityFeePerGas = 120000000n;

  return buildFeeEstimate({
    gas,
    valueWei: amountWei,
    maxFeePerGas,
    maxPriorityFeePerGas
  });
}

export function buildMockExplorerUrl() {
  return undefined;
}

export function getMockWalletSnapshot() {
  return {
    address: mockWalletAddress,
    chainId: supportedChain.id,
    networkName: supportedChain.name,
    balanceWei: mockBalanceWei
  };
}
