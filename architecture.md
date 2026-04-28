# Architecture

## Overview

The project is a client-side Web3 transaction execution system scoped to Sepolia. React components own rendering and user interaction, while transaction construction, validation, fee math, typed-data generation, and error classification live in small testable library functions.

## Folder Structure

- `src/app`: App Router entry points, metadata, page composition, and global styling.
- `src/components/wallet`: Wallet provider and wallet summary UI.
- `src/components/transaction`: Transfer execution UI and user interaction state.
- `src/components/signing`: EIP-712 signing UI and user interaction state.
- `src/lib/tx`: Pure transaction construction, fee math, fee formatting, and explorer URL helpers.
- `src/lib/signing`: Pure EIP-712 payload generation.
- `src/lib/validation`: Pure validation and error classification.
- `src/types`: Shared transaction and error domain types.
- `tests`: Vitest unit tests for library behavior.

## File Responsibilities

- `src/app/layout.tsx`: Root layout, app metadata, and Web3 provider installation.
- `src/app/page.tsx`: Composes wallet, transaction, and signing sections.
- `src/app/globals.css`: Application styling.
- `src/components/wallet/Web3Provider.tsx`: Provides wagmi and TanStack Query clients.
- `src/components/wallet/WalletSummary.tsx`: Displays wallet identity, network, balance, connect/disconnect, and Sepolia switching.
- `src/components/transaction/TransactionExecutor.tsx`: Coordinates form state, wallet/RPC calls, status transitions, and delegates all business logic.
- `src/components/signing/TypedDataSigner.tsx`: Coordinates signing form state and wallet signing, delegating payload generation.
- `src/lib/chains.ts`: Sepolia constants and explorer base URL.
- `src/lib/wagmi.ts`: Reown AppKit and wagmi adapter configuration.
- `src/lib/accounts-stub.ts`: Build-time stub for wagmi optional `accounts` connector package.
- `src/lib/tx/builder.ts`: Builds native and EIP-1559 transfer request objects.
- `src/lib/tx/fees.ts`: Builds fee estimates, checks balances, and formats ETH/gas values.
- `src/lib/tx/explorer.ts`: Builds transaction explorer URLs.
- `src/lib/signing/typed-data.ts`: Builds the EIP-712 domain, types, primary type, and message.
- `src/lib/validation/address.ts`: Validates and checksums recipient addresses.
- `src/lib/validation/amount.ts`: Validates and parses ETH amounts.
- `src/lib/validation/chain.ts`: Checks supported chain invariants.
- `src/lib/validation/transfer.ts`: Combines address and amount validation into a transfer request.
- `src/lib/validation/errors.ts`: Classifies wallet, RPC, and transaction failures.
- `src/types/transactions.ts`: Transaction status, request, and fee types.
- `src/types/errors.ts`: Structured Web3 error codes.
- `tests/*.test.ts`: Unit coverage for the pure business logic.

## Web3 Configuration

`src/lib/wagmi.ts` configures:

- Reown AppKit modal and WalletConnect routing.
- wagmi adapter with Sepolia as the only supported network.
- Optional `NEXT_PUBLIC_SEPOLIA_RPC_URL` transport override.
- Cookie-backed wagmi storage for wallet session persistence.

The app requires a public Reown project ID in `NEXT_PUBLIC_REOWN_PROJECT_ID` for WalletConnect production routing.

## Transaction Flow

1. The user connects a wallet through Reown AppKit.
2. `WalletSummary` displays account, chain, network, and Sepolia balance.
3. `TransactionExecutor` checks wallet and chain readiness.
4. `validateTransferInput` validates recipient and amount.
5. `buildEthTransferTransaction` creates the viem gas-estimation request.
6. viem estimates gas and EIP-1559 fee fields through the Sepolia public client.
7. `buildFeeEstimate` calculates value plus maximum gas cost.
8. `hasSufficientFunds` checks available balance when known.
9. `buildEip1559TransferTransaction` creates the wallet send request.
10. The connected wallet signs and broadcasts the transaction.
11. viem waits for one confirmation and maps the receipt to `confirmed` or `failed`.

## Typed-Data Flow

`buildLabTypedData` builds an EIP-712 payload with:

- Domain: `Web3 Transaction Execution Lab`
- Chain ID: Sepolia
- Primary type: `LabMessage`
- Message fields: wallet address, purpose, and nonce

The connected wallet signs the payload. No private keys or server-side signing are involved.

## Error Handling

`src/lib/validation/errors.ts` classifies common viem and wallet errors into structured codes:

- `USER_REJECTED`
- `WRONG_CHAIN`
- `INSUFFICIENT_FUNDS`
- `INVALID_RECIPIENT`
- `INVALID_AMOUNT`
- `RPC_NETWORK_FAILURE`
- `TRANSACTION_REVERTED`
- `WALLET_NOT_CONNECTED`
- `CLIENT_UNAVAILABLE`
- `UNKNOWN`
