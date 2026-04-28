"use client";

import { useState } from "react";
import { type Hash } from "viem";
import { useAccount, useWalletClient } from "wagmi";

import { supportedChain } from "@/lib/chains";
import { formatAddress } from "@/lib/format";
import type { ExecutionLogItem } from "@/lib/logs/execution-log";
import { createExecutionLog } from "@/lib/logs/execution-log";
import type { ExecutionMode } from "@/lib/mode/execution-mode";
import { buildMockHash, mockWalletAddress } from "@/lib/mode/execution-mode";
import { buildLabTypedData } from "@/lib/signing/typed-data";
import { getUnixTimeMs, getUnixTimeNonce } from "@/lib/time/clock";
import { isSupportedChain } from "@/lib/validation/chain";
import { buildWeb3Error, classifyWeb3Error } from "@/lib/validation/errors";

export function TypedDataSigner({
  mode,
  onLog
}: {
  mode: ExecutionMode;
  onLog: (item: ExecutionLogItem) => void;
}) {
  const { address, chainId, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient({ chainId: supportedChain.id });
  const [purpose, setPurpose] = useState("I am testing typed-data signing on Sepolia.");
  const [signature, setSignature] = useState<Hash>();
  const [error, setError] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  async function signTypedData() {
    setError("");
    setSignature(undefined);

    const signingAddress = mode === "mock" ? mockWalletAddress : address;

    if (mode === "live" && (!isConnected || !address)) {
      const classified = buildWeb3Error("WALLET_NOT_CONNECTED");
      setError(classified.message);
      log("error", "typed_data_signature_failed", classified.message, { errorCode: classified.code, mode });
      return;
    }

    if (mode === "live" && !isSupportedChain(chainId, supportedChain.id)) {
      const classified = buildWeb3Error("WRONG_CHAIN");
      setError(classified.message);
      log("error", "typed_data_signature_failed", classified.message, { errorCode: classified.code, mode });
      return;
    }

    if (mode === "live" && !walletClient) {
      const classified = buildWeb3Error("CLIENT_UNAVAILABLE");
      setError(classified.message);
      log("error", "typed_data_signature_failed", classified.message, { errorCode: classified.code, mode });
      return;
    }

    try {
      setIsSigning(true);
      log("info", "typed_data_signature_requested", "Typed-data signature requested.", { mode });
      const typedData = buildLabTypedData({
        wallet: signingAddress ?? mockWalletAddress,
        purpose,
        nonce: getUnixTimeNonce()
      });
      const result =
        mode === "mock"
          ? buildMockHash(`typed-data-${purpose}-${getUnixTimeMs()}`)
          : await walletClient!.signTypedData(typedData);

      setSignature(result);
      log("success", "typed_data_signature_succeeded", "Typed-data signature succeeded.", { mode });
    } catch (err) {
      const classified = classifyWeb3Error(err);
      setError(classified.message);
      log("error", "typed_data_signature_failed", classified.message, { errorCode: classified.code, mode });
    } finally {
      setIsSigning(false);
    }
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
        <p className="eyebrow">EIP-712 signing</p>
        <h2>Typed-data signature</h2>
        <p className="muted">
          Builds a deterministic typed-data payload in the signing library and requests a{" "}
          {mode === "mock" ? "mock" : "wallet"} signature.
        </p>
      </div>

      <div className="typed-preview">
        <div>
          <span>Domain</span>
          <strong>Web3 Transaction Execution Lab v1</strong>
        </div>
        <div>
          <span>Chain</span>
          <strong>Sepolia ({supportedChain.id})</strong>
        </div>
        <div>
          <span>Signer</span>
          <strong>{formatAddress(mode === "mock" ? mockWalletAddress : address)}</strong>
        </div>
      </div>

      <label className="form-label">
        Purpose
        <textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} rows={4} />
      </label>

      <button className="primary" type="button" onClick={signTypedData} disabled={isSigning || (mode === "live" && !isConnected)}>
        {isSigning ? "Signing..." : "Sign typed data"}
      </button>

      {signature ? (
        <div className="result">
          <span>Signature</span>
          <code>{signature}</code>
        </div>
      ) : null}

      {error ? <div className="error">{error}</div> : null}
    </section>
  );
}
