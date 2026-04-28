import { describe, expect, it } from "vitest";

import { validateRecipientAddress } from "@/lib/validation/address";
import { validateEthAmount } from "@/lib/validation/amount";
import { validateTransferInput } from "@/lib/validation/transfer";

const account = "0x1111111111111111111111111111111111111111";
const recipient = "0x2222222222222222222222222222222222222222";

describe("validation", () => {
  it("normalizes a valid recipient address", () => {
    expect(validateRecipientAddress(recipient)).toEqual({
      ok: true,
      address: recipient
    });
  });

  it("rejects an invalid recipient address", () => {
    expect(validateRecipientAddress("not-an-address")).toEqual({
      ok: false,
      error: "INVALID_RECIPIENT"
    });
  });

  it("parses a positive ETH amount", () => {
    expect(validateEthAmount("0.5")).toEqual({
      ok: true,
      valueWei: 500000000000000000n
    });
  });

  it("rejects zero and malformed amounts", () => {
    expect(validateEthAmount("0")).toEqual({ ok: false, error: "INVALID_AMOUNT" });
    expect(validateEthAmount("abc")).toEqual({ ok: false, error: "INVALID_AMOUNT" });
  });

  it("builds a validated transfer request", () => {
    expect(validateTransferInput({ recipient, amountEth: "0.01" }, account)).toEqual({
      ok: true,
      request: {
        account,
        to: recipient,
        value: 10000000000000000n
      }
    });
  });
});
