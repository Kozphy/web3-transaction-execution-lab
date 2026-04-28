# Web3 Transaction Execution System

A production-style portfolio project for wallet-based Sepolia transaction execution with Next.js App Router, strict TypeScript, wagmi, viem, Reown AppKit, and WalletConnect.

## Features

- Connect, manage, and disconnect wallets through Reown AppKit.
- Display wallet address, chain ID, network name, and Sepolia ETH balance.
- Validate recipient address and ETH amount before preparing a transaction.
- Build an ETH transfer request from validated input.
- Estimate gas and EIP-1559 fee fields before sending.
- Display EIP-1559 `maxFeePerGas` and `maxPriorityFeePerGas`.
- Send the transaction with wallet confirmation and return the transaction hash.
- Track transaction status through `idle`, `preparing`, `awaiting_signature`, `pending`, `confirmed`, and `failed`.
- Link submitted transactions to Sepolia Etherscan.
- Sign EIP-712 typed data from the connected wallet.
- Classify rejected signatures, wrong chain, invalid recipient, invalid amount, insufficient funds, RPC/network failure, and reverted transactions.
- Unit-test transaction construction, validation, fee formatting, typed data generation, and error classification.

## Tech Stack

- Next.js App Router
- TypeScript
- wagmi
- viem
- Reown AppKit / WalletConnect
- TanStack Query
- Vitest

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Set `NEXT_PUBLIC_REOWN_PROJECT_ID` from [Reown Cloud](https://cloud.reown.com/). The public Sepolia RPC URL in `.env.example` is suitable for demos, but a dedicated provider is recommended for production.

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run quality checks:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Network

The app is intentionally scoped to Sepolia testnet. It checks the connected wallet network before estimating, signing, or sending.

## Safety

No private keys are used or stored. All transaction sending and typed-data signing happens through the connected wallet.

## Project Shape

- `src/app`: App Router shell, global styles, metadata, and page composition.
- `src/components/wallet`: Wallet connection, network switching, balance display, and wagmi/Reown providers.
- `src/components/transaction`: Thin transaction UI that delegates validation, request construction, fee math, and error classification to `src/lib`.
- `src/components/signing`: Thin EIP-712 signing UI that delegates typed-data generation to `src/lib/signing`.
- `src/lib/tx`: Pure transaction builders, fee estimation math, display formatting, and explorer links.
- `src/lib/signing`: EIP-712 typed-data generation.
- `src/lib/validation`: Address, amount, chain, transfer, and error validation/classification.
- `src/types`: Shared transaction and error types.
- `tests`: Unit tests for the pure business logic.
