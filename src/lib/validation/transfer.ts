import type { Address } from "viem";

import type { TransferFormInput, TransferTransactionRequest } from "@/types/transactions";

import { validateRecipientAddress } from "./address";
import { validateEthAmount } from "./amount";

export type TransferValidationResult =
  | { ok: true; request: TransferTransactionRequest }
  | { ok: false; error: "INVALID_RECIPIENT" | "INVALID_AMOUNT" };

export function validateTransferInput(
  input: TransferFormInput,
  account: Address
): TransferValidationResult {
  const recipient = validateRecipientAddress(input.recipient);
  if (!recipient.ok) {
    return recipient;
  }

  const amount = validateEthAmount(input.amountEth);
  if (!amount.ok) {
    return amount;
  }

  return {
    ok: true,
    request: {
      account,
      to: recipient.address,
      value: amount.valueWei
    }
  };
}
