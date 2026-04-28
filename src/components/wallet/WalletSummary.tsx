"use client";

import { useAppKit } from "@reown/appkit/react";
import { useAccount, useBalance, useDisconnect, useSwitchChain } from "wagmi";

import { supportedChain, supportedChainName } from "@/lib/chains";
import { formatAddress } from "@/lib/format";
import { formatEth } from "@/lib/tx/fees";
import { isSupportedChain } from "@/lib/validation/chain";
import { isProjectIdConfigured } from "@/lib/wagmi";

export function WalletSummary() {
  const { open } = useAppKit();
  const { address, chain, chainId, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address,
    chainId: supportedChain.id,
    query: {
      enabled: Boolean(address)
    }
  });

  const isWrongChain = isConnected && !isSupportedChain(chainId, supportedChain.id);

  return (
    <section className="card hero-card">
      <div>
        <p className="eyebrow">Transaction execution system</p>
        <h1>Production-style Web3 transaction lab</h1>
        <p className="muted">
          A Sepolia-only execution surface for wallet connection, transaction preparation, EIP-1559 fee
          estimation, confirmation tracking, and EIP-712 signing.
        </p>
      </div>

      {!isProjectIdConfigured ? (
        <div className="warning">
          Set <code>NEXT_PUBLIC_REOWN_PROJECT_ID</code> in <code>.env.local</code> to enable WalletConnect
          production routing.
        </div>
      ) : null}

      <div className="wallet-grid">
        <Metric label="Address" value={formatAddress(address)} />
        <Metric label="Chain ID" value={chainId ? String(chainId) : "Not connected"} />
        <Metric label="Network" value={chain?.name ?? "Not connected"} />
        <Metric label="Sepolia ETH Balance" value={isBalanceLoading ? "Loading..." : formatEth(balance?.value)} />
      </div>

      {isWrongChain ? (
        <div className="error">
          Wrong network. This system only executes transactions on {supportedChainName}.
        </div>
      ) : null}

      <div className="button-row">
        <button className="primary" type="button" onClick={() => open()}>
          {isConnected ? "Manage Wallet" : "Connect Wallet"}
        </button>
        {isWrongChain ? (
          <button type="button" onClick={() => switchChain({ chainId: supportedChain.id })} disabled={isSwitching}>
            {isSwitching ? "Switching..." : `Switch to ${supportedChainName}`}
          </button>
        ) : null}
        {isConnected ? (
          <button type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        ) : null}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
