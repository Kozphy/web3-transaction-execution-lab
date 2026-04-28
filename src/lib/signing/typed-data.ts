import type { Address } from "viem";

import { supportedChain } from "@/lib/chains";

export const labTypedDataTypes = {
  LabMessage: [
    { name: "wallet", type: "address" },
    { name: "purpose", type: "string" },
    { name: "nonce", type: "uint256" }
  ]
} as const;

export type LabTypedDataInput = {
  wallet: Address;
  purpose: string;
  nonce: bigint;
};

export function buildLabTypedData(input: LabTypedDataInput) {
  return {
    domain: {
      name: "Web3 Transaction Execution Lab",
      version: "1",
      chainId: supportedChain.id,
      verifyingContract: "0x0000000000000000000000000000000000000000" as Address
    },
    types: labTypedDataTypes,
    primaryType: "LabMessage" as const,
    message: {
      wallet: input.wallet,
      purpose: input.purpose,
      nonce: input.nonce
    }
  };
}
