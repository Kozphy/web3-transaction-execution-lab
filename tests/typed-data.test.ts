import { describe, expect, it } from "vitest";

import { supportedChain } from "@/lib/chains";
import { buildLabTypedData } from "@/lib/signing/typed-data";

describe("typed data generation", () => {
  it("builds the EIP-712 payload used by the wallet signer", () => {
    const wallet = "0x1111111111111111111111111111111111111111";
    const typedData = buildLabTypedData({
      wallet,
      purpose: "Sign in test",
      nonce: 123n
    });

    expect(typedData.domain).toEqual({
      name: "Web3 Transaction Execution Lab",
      version: "1",
      chainId: supportedChain.id,
      verifyingContract: "0x0000000000000000000000000000000000000000"
    });
    expect(typedData.primaryType).toBe("LabMessage");
    expect(typedData.message).toEqual({
      wallet,
      purpose: "Sign in test",
      nonce: 123n
    });
  });
});
