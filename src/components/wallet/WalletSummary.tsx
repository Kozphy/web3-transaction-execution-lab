"use client";

import { useAppKit } from "@reown/appkit/react";
import { useEffect, useRef } from "react";
import { useAccount, useBalance, useDisconnect, useSwitchChain } from "wagmi";

import { supportedChain, supportedChainName } from "@/lib/chains";
import { formatAddress } from "@/lib/format";
import type { ExecutionLogItem } from "@/lib/logs/execution-log";
import { createExecutionLog } from "@/lib/logs/execution-log";
import type { ExecutionMode } from "@/lib/mode/execution-mode";
import { getMockWalletSnapshot } from "@/lib/mode/execution-mode";
import { formatEth } from "@/lib/tx/fees";
import { isSupportedChain } from "@/lib/validation/chain";
import { isProjectIdConfigured } from "@/lib/wagmi";

export function WalletSummary({ mode, onLog }: { mode: ExecutionMode; onLog: (item: ExecutionLogItem) => void }) {
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

  const previousAddress = useRef<string | undefined>(undefined);
  const mockWallet = getMockWalletSnapshot();
  const displayedAddress = mode === "mock" ? mockWallet.address : address;
  const displayedChainId = mode === "mock" ? mockWallet.chainId : chainId;
  const displayedNetworkName = mode === "mock" ? mockWallet.networkName : chain?.name;
  const displayedBalance = mode === "mock" ? mockWallet.balanceWei : balance?.value;
  const isWrongChain = mode === "live" && isConnected && !isSupportedChain(chainId, supportedChain.id);

  useEffect(() => {
    if (mode !== "live") {
      previousAddress.current = undefined;
      return;
    }

    if (address && previousAddress.current !== address) {
      onLog(
        createExecutionLog({
          level: "success",
          eventType: "wallet_connected",
          message: "Wallet connected.",
          metadata: { address }
        })
      );
    }

    if (!address && previousAddress.current) {
      onLog(
        createExecutionLog({
          level: "info",
          eventType: "wallet_disconnected",
          message: "Wallet disconnected."
        })
      );
    }

    previousAddress.current = address;
  }, [address, mode, onLog]);

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
          production routing in live mode.
        </div>
      ) : null}

      <div className="wallet-grid">
        <Metric label="Address" value={formatAddress(displayedAddress)} />
        <Metric label="Chain ID" value={displayedChainId ? String(displayedChainId) : "Not connected"} />
        <Metric label="Network" value={displayedNetworkName ?? "Not connected"} />
        <Metric
          label="Sepolia ETH Balance"
          value={mode === "live" && isBalanceLoading ? "Loading..." : formatEth(displayedBalance)}
        />
      </div>

      {isWrongChain ? (
        <div className="error">
          Wrong network. This system only executes transactions on {supportedChainName}.
        </div>
      ) : null}

      <div className="button-row">
        {mode === "live" ? (
          <button className="primary" type="button" onClick={() => open()}>
            {isConnected ? "Manage Wallet" : "Connect Wallet"}
          </button>
        ) : null}
        {isWrongChain ? (
          <button type="button" onClick={() => switchChain({ chainId: supportedChain.id })} disabled={isSwitching}>
            {isSwitching ? "Switching..." : `Switch to ${supportedChainName}`}
          </button>
        ) : null}
        {mode === "live" && isConnected ? (
          <button type="button" onClick={() => disconnect()}>
            Disconnect
          </button>
        ) : null}
        {mode === "mock" ? <span className="pill mock">Wallet simulated</span> : null}
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
