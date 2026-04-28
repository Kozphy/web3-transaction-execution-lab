"use client";

import { useState } from "react";
import { type Hash } from "viem";
import { useAccount, useWalletClient } from "wagmi";

import { supportedChain } from "@/lib/chains";
import { formatAddress } from "@/lib/format";
import { buildLabTypedData } from "@/lib/signing/typed-data";
import { isSupportedChain } from "@/lib/validation/chain";
import { buildWeb3Error, classifyWeb3Error } from "@/lib/validation/errors";

export function TypedDataSigner() {
  const { address, chainId, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient({ chainId: supportedChain.id });
  const [purpose, setPurpose] = useState("I am testing typed-data signing on Sepolia.");
  const [signature, setSignature] = useState<Hash>();
  const [error, setError] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  async function signTypedData() {
    setError("");
    setSignature(undefined);

    if (!isConnected || !address) {
      setError(buildWeb3Error("WALLET_NOT_CONNECTED").message);
      return;
    }

    if (!isSupportedChain(chainId, supportedChain.id)) {
      setError(buildWeb3Error("WRONG_CHAIN").message);
      return;
    }

    if (!walletClient) {
      setError(buildWeb3Error("CLIENT_UNAVAILABLE").message);
      return;
    }

    try {
      setIsSigning(true);
      const result = await walletClient.signTypedData(
        buildLabTypedData({
          wallet: address,
          purpose,
          nonce: BigInt(Date.now())
        })
      );

      setSignature(result);
    } catch (err) {
      setError(classifyWeb3Error(err).message);
    } finally {
      setIsSigning(false);
    }
  }

  return (
    <section className="card">
      <div className="section-heading">
        <p className="eyebrow">EIP-712 signing</p>
        <h2>Typed-data signature</h2>
        <p className="muted">
          Builds a deterministic typed-data payload in the signing library and requests a wallet signature.
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
          <span>Wallet</span>
          <strong>{formatAddress(address)}</strong>
        </div>
      </div>

      <label className="form-label">
        Purpose
        <textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} rows={4} />
      </label>

      <button className="primary" type="button" onClick={signTypedData} disabled={isSigning || !isConnected}>
        {isSigning ? "Waiting for wallet..." : "Sign typed data"}
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
