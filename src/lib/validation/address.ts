import { getAddress, isAddress, type Address } from "viem";

export type AddressValidationResult =
  | { ok: true; address: Address }
  | { ok: false; error: "INVALID_RECIPIENT" };

export function validateRecipientAddress(recipient: string): AddressValidationResult {
  const normalizedRecipient = recipient.trim();

  if (!isAddress(normalizedRecipient)) {
    return { ok: false, error: "INVALID_RECIPIENT" };
  }

  return { ok: true, address: getAddress(normalizedRecipient) };
}
