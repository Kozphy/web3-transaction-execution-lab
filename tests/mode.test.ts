import { describe, expect, it } from "vitest";

import {
  buildMockFeeEstimate,
  buildMockHash,
  getMockWalletSnapshot,
  parseExecutionMode
} from "@/lib/mode/execution-mode";
import { supportedChain } from "@/lib/chains";

describe("execution mode", () => {
  it("parses supported modes and defaults to mock", () => {
    expect(parseExecutionMode("live")).toBe("live");
    expect(parseExecutionMode("mock")).toBe("mock");
    expect(parseExecutionMode("invalid")).toBe("mock");
  });

  it("generates deterministic mock hashes", () => {
    expect(buildMockHash("seed")).toBe(buildMockHash("seed"));
    expect(buildMockHash("seed")).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("builds mock fee estimates", () => {
    const estimate = buildMockFeeEstimate(100000000000000000n);
    expect(estimate.gas).toBeGreaterThan(21000n);
    expect(estimate.maxFeePerGas).toBe(1800000000n);
    expect(estimate.estimatedTotalCostWei).toBeGreaterThan(100000000000000000n);
  });

  it("returns a Sepolia mock wallet snapshot", () => {
    expect(getMockWalletSnapshot()).toMatchObject({
      chainId: supportedChain.id,
      networkName: supportedChain.name
    });
  });
});
