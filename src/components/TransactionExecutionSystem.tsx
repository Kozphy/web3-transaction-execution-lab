"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ErrorDashboard } from "@/components/errors/ErrorDashboard";
import { TransactionHistoryPanel } from "@/components/history/TransactionHistoryPanel";
import { ExecutionLogPanel } from "@/components/logs/ExecutionLogPanel";
import { ExecutionModeToggle } from "@/components/mode/ExecutionModeToggle";
import { MonitoringDashboard } from "@/components/monitoring/MonitoringDashboard";
import { TypedDataSigner } from "@/components/signing/TypedDataSigner";
import { TransactionExecutor } from "@/components/transaction/TransactionExecutor";
import { WalletSummary } from "@/components/wallet/WalletSummary";
import {
  clearTransactionHistory,
  loadTransactionHistory,
  saveTransactionHistory,
  upsertTransactionHistoryItem
} from "@/lib/history/transaction-history";
import {
  appendExecutionLog,
  clearExecutionLogs,
  createExecutionLog,
  loadExecutionLogs,
  saveExecutionLogs,
  type ExecutionLogItem
} from "@/lib/logs/execution-log";
import {
  EXECUTION_MODE_STORAGE_KEY,
  parseExecutionMode,
  type ExecutionMode
} from "@/lib/mode/execution-mode";
import type { TransactionHistoryItem } from "@/types/transactions";

export function TransactionExecutionSystem() {
  const [mode, setMode] = useState<ExecutionMode>("mock");
  const [history, setHistory] = useState<TransactionHistoryItem[]>([]);
  const [logs, setLogs] = useState<ExecutionLogItem[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMode(parseExecutionMode(window.localStorage.getItem(EXECUTION_MODE_STORAGE_KEY)));
      setHistory(loadTransactionHistory(window.localStorage));
      setLogs(loadExecutionLogs(window.localStorage));
      hydrated.current = true;
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (hydrated.current) {
      window.localStorage.setItem(EXECUTION_MODE_STORAGE_KEY, mode);
    }
  }, [mode]);

  useEffect(() => {
    if (hydrated.current) {
      saveTransactionHistory(window.localStorage, history);
    }
  }, [history]);

  useEffect(() => {
    if (hydrated.current) {
      saveExecutionLogs(window.localStorage, logs);
    }
  }, [logs]);

  const recordLog = useCallback((item: ExecutionLogItem) => {
    setLogs((current) => appendExecutionLog(current, item));
  }, []);

  const recordHistoryItem = useCallback((item: TransactionHistoryItem) => {
    setHistory((current) => upsertTransactionHistoryItem(current, item));
  }, []);

  function handleModeChange(nextMode: ExecutionMode) {
    setMode(nextMode);
    recordLog(
      createExecutionLog({
        level: "info",
        eventType: "mode_changed",
        message: `Execution mode changed to ${nextMode}.`,
        metadata: { mode: nextMode }
      })
    );
  }

  function handleClearHistory() {
    clearTransactionHistory(window.localStorage);
    setHistory([]);
  }

  function handleClearLogs() {
    clearExecutionLogs(window.localStorage);
    setLogs([]);
  }

  return (
    <main className="page">
      <ExecutionModeToggle mode={mode} onModeChange={handleModeChange} />
      <WalletSummary mode={mode} onLog={recordLog} />
      <div className="lab-grid">
        <TransactionExecutor mode={mode} onHistoryItem={recordHistoryItem} onLog={recordLog} />
        <TypedDataSigner mode={mode} onLog={recordLog} />
      </div>
      <div className="dashboard-grid">
        <TransactionHistoryPanel items={history} onClear={handleClearHistory} />
        <ExecutionLogPanel logs={logs} onClear={handleClearLogs} />
        <ErrorDashboard history={history} logs={logs} />
        <MonitoringDashboard history={history} logs={logs} />
      </div>
    </main>
  );
}
