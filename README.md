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
- Switch between mock mode and live Sepolia mode.
- Persist local transaction history, execution logs, error analytics, and monitoring metrics.
- Show a Grafana-style dashboard for transaction health and execution telemetry.

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

## Mock Mode

Mock mode is the default local-safe execution path. It does not require a wallet connection and simulates:

- Wallet address, Sepolia chain ID, network name, and ETH balance.
- Gas estimation and EIP-1559 fee fields.
- Transaction hash generation.
- Pending, confirmed, and failed transaction outcomes.
- EIP-712 typed-data signatures.

Use mock mode to demo the full product flow in interviews, screen recordings, and CI-like environments without depending on a wallet, faucet funds, or RPC availability.

## Live Mode

Live mode uses Reown AppKit, wagmi, and viem against Sepolia only. All live signing and transaction sending happens through the connected wallet. The app never stores private keys, seed phrases, or wallet JSON files.

To test live mode:

1. Set `NEXT_PUBLIC_REOWN_PROJECT_ID` in `.env.local`.
2. Start the app with `npm run dev`.
3. Switch the mode toggle to `Live Sepolia`.
4. Connect a wallet.
5. Switch the wallet network to Sepolia if prompted.
6. Fund the wallet with Sepolia ETH.
7. Validate, estimate, send, and confirm a small transfer.

## Safety

No private keys are used or stored. All transaction sending and typed-data signing happens through the connected wallet.

## Observability

The app includes local production-style observability primitives:

- Transaction history persisted in `localStorage`.
- Structured execution logs with level and event-type filters.
- Error dashboard with counts, latest error, error rate, most common error, and suggested actions.
- Monitoring dashboard with attempts, confirmations, failures, pending count, success/failure rate, average gas, average fee, average confirmation time, latest status, log counts, and a lightweight timeline.

## Project Shape

- `src/app`: App Router shell, global styles, metadata, and page composition.
- `src/components/mode`: Mock/live execution mode toggle.
- `src/components/wallet`: Wallet connection, network switching, balance display, and wagmi/Reown providers.
- `src/components/transaction`: Thin transaction UI that delegates validation, request construction, fee math, and error classification to `src/lib`.
- `src/components/signing`: Thin EIP-712 signing UI that delegates typed-data generation to `src/lib/signing`.
- `src/components/history`: Local transaction history panel.
- `src/components/logs`: Structured execution log panel.
- `src/components/errors`: Error analytics dashboard.
- `src/components/monitoring`: Grafana-style monitoring dashboard.
- `src/lib/mode`: Execution mode parsing and mock execution helpers.
- `src/lib/history`: Transaction history serialization, sorting, and storage helpers.
- `src/lib/logs`: Structured log builders, filters, serialization, and storage helpers.
- `src/lib/errors`: Error analytics aggregation.
- `src/lib/monitoring`: Monitoring metric calculations.
- `src/lib/tx`: Pure transaction builders, fee estimation math, display formatting, and explorer links.
- `src/lib/signing`: EIP-712 typed-data generation.
- `src/lib/validation`: Address, amount, chain, transfer, and error validation/classification.
- `src/types`: Shared transaction and error types.
- `tests`: Unit tests for the pure business logic.

## Why This Is Production-Style

- Dual-mode architecture separates deterministic mock execution from wallet-safe live execution.
- Business logic is deterministic and testable in `src/lib`, while React components stay focused on UI orchestration.
- Live mode preserves wallet custody: no private keys or seed phrases are handled by the app.
- Local observability mirrors real execution systems with transaction history, structured logs, error analytics, and monitoring metrics.
- Error classification turns low-level wallet/RPC failures into actionable user-facing states.
- Monitoring metrics make reliability visible: success rate, failure rate, pending count, gas averages, fee averages, and confirmation latency.

## Portfolio Explanation

This project demonstrates frontend Web3 infrastructure skills beyond a simple connect-wallet demo. It shows how to build a transaction execution surface with clear state transitions, wallet-safe signing, typed-data flows, local persistence, observability, and pure business logic that can be tested without browser or wallet dependencies.

## Interview Talking Points

- Why mock mode improves demos, testing, and development reliability.
- How live mode keeps wallet signing and transaction broadcasting user-controlled.
- How EIP-1559 fee estimation is separated from send request construction.
- How transaction status moves through `idle`, `preparing`, `awaiting_signature`, `pending`, `confirmed`, and `failed`.
- How structured logs and error analytics help debug wallet/RPC issues.
- How bigint-based wei math avoids floating point errors in transaction cost checks.
