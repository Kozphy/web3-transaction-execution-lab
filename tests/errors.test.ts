import { describe, expect, it } from "vitest";

import { buildWeb3Error, classifyMessage, classifyWeb3Error } from "@/lib/validation/errors";

describe("error classification", () => {
  it("maps explicit application error codes to user messages", () => {
    expect(buildWeb3Error("WRONG_CHAIN")).toEqual({
      code: "WRONG_CHAIN",
      message: "Wrong network. Switch to Sepolia and try again."
    });
  });

  it("classifies user rejection", () => {
    expect(classifyMessage("User rejected the request")).toMatchObject({
      code: "USER_REJECTED"
    });
  });

  it("classifies insufficient funds", () => {
    expect(classifyMessage("insufficient funds for gas * price + value")).toMatchObject({
      code: "INSUFFICIENT_FUNDS"
    });
  });

  it("classifies RPC and network failures", () => {
    expect(classifyMessage("fetch failed while calling rpc")).toMatchObject({
      code: "RPC_NETWORK_FAILURE"
    });
  });

  it("classifies reverted transactions", () => {
    expect(classifyMessage("execution reverted")).toMatchObject({
      code: "TRANSACTION_REVERTED"
    });
  });

  it("preserves unknown Error messages", () => {
    expect(classifyWeb3Error(new Error("wallet unavailable"))).toEqual({
      code: "UNKNOWN",
      message: "wallet unavailable"
    });
  });
});
