import { parseEther } from "viem";

export type AmountValidationResult =
  | { ok: true; valueWei: bigint }
  | { ok: false; error: "INVALID_AMOUNT" };

export function validateEthAmount(amountEth: string): AmountValidationResult {
  const normalizedAmount = amountEth.trim();

  if (!normalizedAmount) {
    return { ok: false, error: "INVALID_AMOUNT" };
  }

  try {
    const valueWei = parseEther(normalizedAmount);

    if (valueWei <= BigInt(0)) {
      return { ok: false, error: "INVALID_AMOUNT" };
    }

    return { ok: true, valueWei };
  } catch {
    return { ok: false, error: "INVALID_AMOUNT" };
  }
}
