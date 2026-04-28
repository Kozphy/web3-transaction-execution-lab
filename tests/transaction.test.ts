import { describe, expect, it } from "vitest";
import { sepolia } from "viem/chains";

import { buildEip1559TransferTransaction, buildEthTransferTransaction } from "@/lib/tx/builder";
import { buildExplorerTransactionUrl } from "@/lib/tx/explorer";
import { buildFeeEstimate, formatEth, formatGas, hasSufficientFunds } from "@/lib/tx/fees";

const request = {
  account: "0x1111111111111111111111111111111111111111",
  to: "0x2222222222222222222222222222222222222222",
  value: 100000000000000000n
} as const;

describe("transaction construction", () => {
  it("builds a native ETH transfer request", () => {
    expect(buildEthTransferTransaction(request)).toEqual(request);
  });

  it("attaches EIP-1559 fee fields to a wallet send request", () => {
    const feeEstimate = buildFeeEstimate({
      gas: 21000n,
      valueWei: request.value,
      maxFeePerGas: 3000000000n,
      maxPriorityFeePerGas: 1000000000n
    });

    expect(buildEip1559TransferTransaction(request, feeEstimate, sepolia)).toMatchObject({
      ...request,
      chain: sepolia,
      gas: 21000n,
      maxFeePerGas: 3000000000n,
      maxPriorityFeePerGas: 1000000000n
    });
  });

  it("calculates transfer value plus max gas cost", () => {
    const estimate = buildFeeEstimate({
      gas: 21000n,
      valueWei: request.value,
      maxFeePerGas: 3000000000n,
      maxPriorityFeePerGas: 1000000000n
    });

    expect(estimate.estimatedTotalCostWei).toBe(100063000000000000n);
    expect(hasSufficientFunds(100063000000000000n, estimate)).toBe(true);
    expect(hasSufficientFunds(100062999999999999n, estimate)).toBe(false);
  });

  it("formats ETH and gas values for display", () => {
    expect(formatEth(1234567890000000000n)).toBe("1.234568 ETH");
    expect(formatGas(1500000000n)).toBe("1.5 gwei");
  });

  it("builds an explorer transaction link", () => {
    expect(buildExplorerTransactionUrl("https://sepolia.etherscan.io/", "0xabc")).toBe(
      "https://sepolia.etherscan.io/tx/0xabc"
    );
  });
});
