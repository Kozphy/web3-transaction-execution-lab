# Code Review Checklist

## TypeScript

- Strict TypeScript remains enabled.
- New functions expose explicit input and output types.
- `any` is avoided unless there is a documented boundary with an external library.
- Bigint math is kept in wei/gwei units and is not converted to floating point before calculation.

## Architecture

- React components do not contain transaction construction, fee math, typed-data generation, or error classification logic.
- Business logic lives in `src/lib/tx`, `src/lib/signing`, or `src/lib/validation`.
- New behavior includes unit tests when it can be expressed as a pure function.
- Wallet/RPC calls are isolated to UI orchestration or future service boundaries.

## Web3 Safety

- No private keys, seed phrases, wallet JSON files, or privileged RPC secrets are added.
- Signing and transaction submission use the connected wallet only.
- Sepolia remains the default and supported chain.
- Wrong-chain checks happen before wallet prompts.
- Transaction value and gas cost calculations use bigint.

## Transaction Execution

- Recipient addresses are validated before gas estimation.
- Amounts are parsed with viem and rejected if invalid or zero.
- Gas and EIP-1559 fee fields are estimated before sending.
- Balance checks include transfer value plus maximum gas cost.
- Submitted transactions expose an explorer link.
- Reverted receipts map to a failed status and user-facing error.

## Error Handling

- User rejection, wrong chain, insufficient funds, invalid recipient, invalid amount, RPC/network failure, and transaction reverted cases are handled deliberately.
- Unknown errors preserve useful messages without leaking secrets.
- UI copy is actionable and does not expose implementation internals.

## Documentation

- `README.md` stays accurate for setup, checks, and features.
- `architecture.md` is updated when responsibilities or boundaries move.
- `security-notes.md` is updated when signing, transaction, or environment behavior changes.
