"use client";

import type { ExecutionMode } from "@/lib/mode/execution-mode";
import { getModeLabel } from "@/lib/mode/execution-mode";

export function ExecutionModeToggle({
  mode,
  onModeChange
}: {
  mode: ExecutionMode;
  onModeChange: (mode: ExecutionMode) => void;
}) {
  return (
    <section className="card mode-card">
      <div>
        <p className="eyebrow">Execution mode</p>
        <h2>{getModeLabel(mode)}</h2>
        <p className="muted">
          Mock mode simulates the complete flow without a wallet. Live mode uses Sepolia wallet signing through
          wagmi, viem, and Reown AppKit.
        </p>
      </div>
      <div className="segmented-control" role="group" aria-label="Execution mode">
        <button
          className={mode === "mock" ? "selected" : ""}
          type="button"
          onClick={() => onModeChange("mock")}
        >
          Mock
        </button>
        <button
          className={mode === "live" ? "selected" : ""}
          type="button"
          onClick={() => onModeChange("live")}
        >
          Live Sepolia
        </button>
      </div>
    </section>
  );
}
