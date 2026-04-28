"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Hash } from "viem";
import { useAccount, useBalance, usePublicClient, useWalletClient } from "wagmi";

import { sepoliaExplorerUrl, supportedChain } from "@/lib/chains";
import { buildEip1559TransferTransaction, buildEthTransferTransaction } from "@/lib/tx/builder";
import { buildExplorerTransactionUrl } from "@/lib/tx/explorer";
import { buildFeeEstimate, formatEth, formatGas, hasSufficientFunds } from "@/lib/tx/fees";
import { isSupportedChain } from "@/lib/validation/chain";
import { buildWeb3Error, classifyWeb3Error } from "@/lib/validation/errors";
import { validateTransferInput } from "@/lib/validation/transfer";
import type { FeeEstimate, TransactionStatus, TransferTransactionRequest } from "@/types/transactions";

export function TransactionExecutor() {
  const { address, chainId, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: supportedChain.id });
  const { data: walletClient } = useWalletClient({ chainId: supportedChain.id });
  const { data: balance } = useBalance({
    address,
    chainId: supportedChain.id,
    query: {
      enabled: Boolean(address)
    }
  });

  const [recipient, setRecipient] = useState("");
  const [amountEth, setAmountEth] = useState("");
  const [preparedRequest, setPreparedRequest] = useState<TransferTransactionRequest>();
  const [feeEstimate, setFeeEstimate] = useState<FeeEstimate>();
  const [hash, setHash] = useState<Hash>();
  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [error, setError] = useState("");

  const canUseWallet = isConnected && address && isSupportedChain(chainId, supportedChain.id);
  const explorerUrl = hash ? buildExplorerTransactionUrl(sepoliaExplorerUrl, hash) : undefined;
  const totalCostLabel = useMemo(
    () => (feeEstimate ? formatEth(feeEstimate.estimatedTotalCostWei, 8) : "Estimate required"),
    [feeEstimate]
  );

  async function prepareTransaction(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError("");
    setHash(undefined);

    if (!isConnected || !address) {
      setError(buildWeb3Error("WALLET_NOT_CONNECTED").message);
      return;
    }

    if (!isSupportedChain(chainId, supportedChain.id)) {
      setError(buildWeb3Error("WRONG_CHAIN").message);
      return;
    }

    if (!publicClient) {
      setError(buildWeb3Error("CLIENT_UNAVAILABLE").message);
      return;
    }

    const validation = validateTransferInput({ recipient, amountEth }, address);
    if (!validation.ok) {
      setError(buildWeb3Error(validation.error).message);
      return;
    }

    try {
      setStatus("preparing");
      const request = buildEthTransferTransaction(validation.request);
      const [gas, fees] = await Promise.all([
        publicClient.estimateGas(request),
        publicClient.estimateFeesPerGas({ type: "eip1559" })
      ]);

      const estimate = buildFeeEstimate({
        gas,
        valueWei: validation.request.value,
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas
      });

      setPreparedRequest(validation.request);
      setFeeEstimate(estimate);

      if (!hasSufficientFunds(balance?.value, estimate)) {
        setStatus("failed");
        setError(buildWeb3Error("INSUFFICIENT_FUNDS").message);
        return;
      }

      setStatus("idle");
    } catch (err) {
      setStatus("failed");
      setError(classifyWeb3Error(err).message);
    }
  }

  async function sendTransaction() {
    setError("");

    if (!canUseWallet) {
      setError(buildWeb3Error(!isConnected ? "WALLET_NOT_CONNECTED" : "WRONG_CHAIN").message);
      return;
    }

    if (!walletClient || !publicClient) {
      setError(buildWeb3Error("CLIENT_UNAVAILABLE").message);
      return;
    }

    if (!preparedRequest || !feeEstimate) {
      setError("Prepare and estimate the transaction before sending.");
      return;
    }

    try {
      setStatus("awaiting_signature");
      const transactionHash = await walletClient.sendTransaction(
        buildEip1559TransferTransaction(preparedRequest, feeEstimate, supportedChain)
      );

      setHash(transactionHash);
      setStatus("pending");

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: transactionHash,
        confirmations: 1
      });

      if (receipt.status === "reverted") {
        setStatus("failed");
        setError(buildWeb3Error("TRANSACTION_REVERTED").message);
        return;
      }

      setStatus("confirmed");
    } catch (err) {
      setStatus("failed");
      setError(classifyWeb3Error(err).message);
    }
  }

  function resetPreparedState() {
    setPreparedRequest(undefined);
    setFeeEstimate(undefined);
    setHash(undefined);
    setStatus("idle");
  }

  return (
    <section className="card">
      <div className="section-heading">
        <p className="eyebrow">Execution pipeline</p>
        <h2>ETH transfer transaction</h2>
        <p className="muted">
          Inputs are validated, a transfer request is constructed, EIP-1559 fees are estimated, and the wallet
          sends the signed transaction.
        </p>
      </div>

      <form className="form" onSubmit={prepareTransaction}>
        <label>
          Recipient address
          <input
            placeholder="0x..."
            value={recipient}
            onChange={(event) => {
              setRecipient(event.target.value.trim());
              resetPreparedState();
            }}
          />
        </label>

        <label>
          Amount in Sepolia ETH
          <input
            inputMode="decimal"
            placeholder="0.001"
            value={amountEth}
            onChange={(event) => {
              setAmountEth(event.target.value.trim());
              resetPreparedState();
            }}
          />
        </label>

        <div className="button-row">
          <button type="submit" disabled={status === "preparing" || !canUseWallet}>
            {status === "preparing" ? "Preparing..." : "Validate and estimate"}
          </button>
          <button
            className="primary"
            type="button"
            onClick={sendTransaction}
            disabled={!feeEstimate || status === "awaiting_signature" || status === "pending" || !canUseWallet}
          >
            {status === "awaiting_signature"
              ? "Awaiting signature..."
              : status === "pending"
                ? "Confirming..."
                : "Send transaction"}
          </button>
        </div>
      </form>

      <div className="metrics-grid">
        <Metric label="Estimated gas" value={feeEstimate ? feeEstimate.gas.toString() : "Not estimated"} />
        <Metric label="maxFeePerGas" value={formatGas(feeEstimate?.maxFeePerGas)} />
        <Metric label="maxPriorityFeePerGas" value={formatGas(feeEstimate?.maxPriorityFeePerGas)} />
        <Metric label="Estimated max total" value={totalCostLabel} />
        <Metric label="Wallet balance" value={formatEth(balance?.value)} />
        <Metric label="Status" value={status} />
      </div>

      {hash && explorerUrl ? (
        <div className="result">
          <span>Transaction hash</span>
          <a href={explorerUrl} target="_blank" rel="noreferrer">
            {hash}
          </a>
        </div>
      ) : null}

      {error ? <div className="error">{error}</div> : null}
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
