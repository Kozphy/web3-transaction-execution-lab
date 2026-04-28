"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Hash } from "viem";
import { useAccount, useBalance, usePublicClient, useWalletClient } from "wagmi";

import { sepoliaExplorerUrl, supportedChain } from "@/lib/chains";
import type { ExecutionLogItem } from "@/lib/logs/execution-log";
import { createExecutionLog } from "@/lib/logs/execution-log";
import type { ExecutionMode, MockOutcome } from "@/lib/mode/execution-mode";
import { buildMockFeeEstimate, buildMockHash, mockBalanceWei, mockWalletAddress } from "@/lib/mode/execution-mode";
import { getUnixTimeMs } from "@/lib/time/clock";
import { buildEip1559TransferTransaction, buildEthTransferTransaction } from "@/lib/tx/builder";
import { buildExplorerTransactionUrl } from "@/lib/tx/explorer";
import { buildFeeEstimate, formatEth, formatGas, hasSufficientFunds } from "@/lib/tx/fees";
import { isSupportedChain } from "@/lib/validation/chain";
import { buildWeb3Error, classifyWeb3Error } from "@/lib/validation/errors";
import { validateTransferInput } from "@/lib/validation/transfer";
import {
  createTransactionHistoryItem,
  updateTransactionHistoryItem
} from "@/lib/history/transaction-history";
import type { FeeEstimate, TransactionHistoryItem, TransactionStatus, TransferTransactionRequest } from "@/types/transactions";

export function TransactionExecutor({
  mode,
  onHistoryItem,
  onLog
}: {
  mode: ExecutionMode;
  onHistoryItem: (item: TransactionHistoryItem) => void;
  onLog: (item: ExecutionLogItem) => void;
}) {
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
  const [mockOutcome, setMockOutcome] = useState<MockOutcome>("confirmed");
  const [historyItem, setHistoryItem] = useState<TransactionHistoryItem>();

  const activeAddress = mode === "mock" ? mockWalletAddress : address;
  const activeBalance = mode === "mock" ? mockBalanceWei : balance?.value;
  const canUseWallet = mode === "mock" || (isConnected && address && isSupportedChain(chainId, supportedChain.id));
  const explorerUrl = hash ? buildExplorerTransactionUrl(sepoliaExplorerUrl, hash) : undefined;
  const totalCostLabel = useMemo(
    () => (feeEstimate ? formatEth(feeEstimate.estimatedTotalCostWei, 8) : "Estimate required"),
    [feeEstimate]
  );

  async function prepareTransaction(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError("");
    setHash(undefined);

    log("info", "validation_started", "Validating transfer input.", { mode });

    if (!activeAddress) {
      const classified = buildWeb3Error("WALLET_NOT_CONNECTED");
      failValidation(classified.message, classified.code);
      return;
    }

    if (mode === "live" && (!isConnected || !address)) {
      setError(buildWeb3Error("WALLET_NOT_CONNECTED").message);
      log("error", "validation_failed", buildWeb3Error("WALLET_NOT_CONNECTED").message, {
        errorCode: "WALLET_NOT_CONNECTED"
      });
      return;
    }

    if (mode === "live" && !isSupportedChain(chainId, supportedChain.id)) {
      const classified = buildWeb3Error("WRONG_CHAIN");
      failValidation(classified.message, classified.code);
      return;
    }

    if (mode === "live" && !publicClient) {
      const classified = buildWeb3Error("CLIENT_UNAVAILABLE");
      failValidation(classified.message, classified.code);
      return;
    }

    const validation = validateTransferInput({ recipient, amountEth }, activeAddress);
    if (!validation.ok) {
      const classified = buildWeb3Error(validation.error);
      failValidation(classified.message, classified.code);
      return;
    }

    try {
      setStatus("preparing");
      log("info", "gas_estimation_started", "Estimating gas and EIP-1559 fees.", { mode });
      const estimate =
        mode === "mock"
          ? buildMockFeeEstimate(validation.request.value)
          : await estimateLiveFees(validation.request);

      setPreparedRequest(validation.request);
      setFeeEstimate(estimate);

      const nextHistoryItem = createTransactionHistoryItem({
        mode,
        from: validation.request.account,
        to: validation.request.to,
        amountEth,
        chainId: supportedChain.id,
        status: "idle",
        feeEstimate: estimate
      });
      setHistoryItem(nextHistoryItem);
      onHistoryItem(nextHistoryItem);

      if (!hasSufficientFunds(activeBalance, estimate)) {
        const classified = buildWeb3Error("INSUFFICIENT_FUNDS");
        const failedItem = updateTransactionHistoryItem(nextHistoryItem, {
          status: "failed",
          errorCode: classified.code,
          errorMessage: classified.message
        });
        setHistoryItem(failedItem);
        onHistoryItem(failedItem);
        setStatus("failed");
        setError(classified.message);
        log("error", "gas_estimation_failed", classified.message, { errorCode: classified.code, mode });
        return;
      }

      setStatus("idle");
      log("success", "gas_estimation_succeeded", "Gas estimation succeeded.", {
        mode,
        gas: estimate.gas.toString(),
        maxFeePerGas: estimate.maxFeePerGas.toString()
      });
    } catch (err) {
      const classified = classifyWeb3Error(err);
      setStatus("failed");
      setError(classified.message);
      log("error", "gas_estimation_failed", classified.message, { errorCode: classified.code, mode });
    }
  }

  async function sendTransaction() {
    setError("");

    if (!canUseWallet) {
      const classified = buildWeb3Error(!isConnected ? "WALLET_NOT_CONNECTED" : "WRONG_CHAIN");
      setError(classified.message);
      log("error", "transaction_failed", classified.message, { errorCode: classified.code, mode });
      return;
    }

    if (mode === "live" && (!walletClient || !publicClient)) {
      setError(buildWeb3Error("CLIENT_UNAVAILABLE").message);
      return;
    }

    if (!preparedRequest || !feeEstimate) {
      setError("Prepare and estimate the transaction before sending.");
      return;
    }

    try {
      setStatus("awaiting_signature");
      log("info", "transaction_requested", "Transaction send requested.", { mode });
      log("info", "wallet_signature_requested", "Wallet signature requested.", { mode });
      const transactionHash =
        mode === "mock"
          ? buildMockHash(`${preparedRequest.to}-${amountEth}-${getUnixTimeMs()}`)
          : await walletClient!.sendTransaction(
              buildEip1559TransferTransaction(preparedRequest, feeEstimate, supportedChain)
            );

      setHash(transactionHash);
      setStatus("pending");
      const submittedItem = updateCurrentHistory("pending", {
        hash: transactionHash,
        explorerUrl: mode === "live" ? buildExplorerTransactionUrl(sepoliaExplorerUrl, transactionHash) : undefined
      });
      log("success", "transaction_submitted", "Transaction submitted.", { mode, hash: transactionHash });
      log("info", "transaction_pending", "Transaction is pending confirmation.", { mode, hash: transactionHash });

      if (mode === "mock") {
        await delay(650);
        if (mockOutcome === "failed") {
          const classified = buildWeb3Error("TRANSACTION_REVERTED");
          setStatus("failed");
          setError(classified.message);
          updateCurrentHistory("failed", {
            baseItem: submittedItem,
            errorCode: classified.code,
            errorMessage: classified.message
          });
          log("error", "transaction_failed", classified.message, { errorCode: classified.code, mode });
          return;
        }

        setStatus("confirmed");
        updateCurrentHistory("confirmed", { baseItem: submittedItem });
        log("success", "transaction_confirmed", "Mock transaction confirmed.", { mode, hash: transactionHash });
        return;
      }

      const receipt = await publicClient!.waitForTransactionReceipt({
        hash: transactionHash,
        confirmations: 1
      });

      if (receipt.status === "reverted") {
        const classified = buildWeb3Error("TRANSACTION_REVERTED");
        setStatus("failed");
        setError(classified.message);
        updateCurrentHistory("failed", {
          baseItem: submittedItem,
          errorCode: classified.code,
          errorMessage: classified.message
        });
        log("error", "transaction_failed", classified.message, { errorCode: classified.code, mode });
        return;
      }

      setStatus("confirmed");
      updateCurrentHistory("confirmed", { baseItem: submittedItem });
      log("success", "transaction_confirmed", "Transaction confirmed on Sepolia.", { mode, hash: transactionHash });
    } catch (err) {
      const classified = classifyWeb3Error(err);
      setStatus("failed");
      setError(classified.message);
      updateCurrentHistory("failed", {
        errorCode: classified.code,
        errorMessage: classified.message
      });
      log("error", "transaction_failed", classified.message, { errorCode: classified.code, mode });
    }
  }

  function resetPreparedState() {
    setPreparedRequest(undefined);
    setFeeEstimate(undefined);
    setHash(undefined);
    setStatus("idle");
    setHistoryItem(undefined);
  }

  async function estimateLiveFees(request: TransferTransactionRequest) {
    if (!publicClient) {
      throw new Error("Public client unavailable");
    }

    const [gas, fees] = await Promise.all([
      publicClient.estimateGas(buildEthTransferTransaction(request)),
      publicClient.estimateFeesPerGas({ type: "eip1559" })
    ]);

    return buildFeeEstimate({
      gas,
      valueWei: request.value,
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas
    });
  }

  function failValidation(message: string, errorCode: string) {
    setError(message);
    setStatus("failed");
    log("error", "validation_failed", message, { errorCode, mode });
  }

  function updateCurrentHistory(
    nextStatus: TransactionStatus,
    options: {
      baseItem?: TransactionHistoryItem;
      hash?: Hash;
      explorerUrl?: string;
      errorCode?: TransactionHistoryItem["errorCode"];
      errorMessage?: string;
    } = {}
  ) {
    const baseItem = options.baseItem ?? historyItem;
    if (!baseItem) {
      return undefined;
    }

    const nextItem = updateTransactionHistoryItem(baseItem, {
      status: nextStatus,
      hash: options.hash ?? baseItem.hash,
      explorerUrl: options.explorerUrl ?? baseItem.explorerUrl,
      errorCode: options.errorCode ?? baseItem.errorCode,
      errorMessage: options.errorMessage ?? baseItem.errorMessage
    });
    setHistoryItem(nextItem);
    onHistoryItem(nextItem);
    return nextItem;
  }

  function log(
    level: ExecutionLogItem["level"],
    eventType: ExecutionLogItem["eventType"],
    message: string,
    metadata?: Record<string, unknown>
  ) {
    onLog(createExecutionLog({ level, eventType, message, metadata }));
  }

  return (
    <section className="card">
      <div className="section-heading">
        <p className="eyebrow">Execution pipeline</p>
        <h2>ETH transfer transaction</h2>
        <p className="muted">
          Inputs are validated, a transfer request is constructed, EIP-1559 fees are estimated, and execution
          routes through {mode === "mock" ? "a deterministic mock simulator" : "the connected Sepolia wallet"}.
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

        {mode === "mock" ? (
          <label>
            Mock result
            <select value={mockOutcome} onChange={(event) => setMockOutcome(event.target.value as MockOutcome)}>
              <option value="confirmed">Confirm transaction</option>
              <option value="failed">Fail transaction</option>
            </select>
          </label>
        ) : null}

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
        <Metric label="Wallet balance" value={formatEth(activeBalance)} />
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

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
