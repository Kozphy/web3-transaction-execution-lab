# Security Notes

## Wallet-Only Signing

This project never accepts, stores, imports, or derives private keys. Transactions and EIP-712 signatures are requested from the connected wallet only.

## Testnet Scope

The application is scoped to Sepolia testnet by default. UI actions validate the connected chain before estimating gas, sending ETH, or signing typed data.

## Transaction Safety

- Recipient addresses are validated with viem before gas estimation or sending.
- ETH amounts are parsed with viem `parseEther`.
- Gas is estimated before send.
- EIP-1559 fee fields are displayed before send.
- The app checks the wallet balance against transfer value plus estimated maximum gas cost.

## Error Handling

The UI handles common wallet and RPC failure modes:

- User rejected wallet request or signature.
- Wrong network.
- Invalid recipient address.
- Invalid or zero ETH amount.
- Insufficient funds for value plus gas.
- RPC/network failure.
- Reverted or failed transaction receipt.

## Environment Variables

`NEXT_PUBLIC_REOWN_PROJECT_ID` and `NEXT_PUBLIC_SEPOLIA_RPC_URL` are public client-side configuration values. Do not place private keys, seed phrases, privileged RPC credentials, or server secrets in `NEXT_PUBLIC_*` variables.

## Production Considerations

- Use a dedicated RPC provider with rate limits and monitoring.
- Add transaction simulation for contract interactions before execution.
- Add stronger typed-data domain separation if signatures are ever consumed by a backend or contract.
- Verify signatures server-side with nonce expiration and replay protection before granting access or privileges.
- Add allowlists, simulation, or policy checks before contract calls if this evolves beyond native ETH transfers.
- Keep dependencies updated and monitor wallet/RPC provider advisories.
