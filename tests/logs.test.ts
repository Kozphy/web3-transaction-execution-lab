import { describe, expect, it } from "vitest";

import { appendExecutionLog, createExecutionLog, filterExecutionLogs } from "@/lib/logs/execution-log";

describe("execution logs", () => {
  const info = createExecutionLog({
    level: "info",
    eventType: "validation_started",
    message: "Validation started.",
    timestamp: "2026-01-01T00:00:00.000Z"
  });
  const error = createExecutionLog({
    level: "error",
    eventType: "validation_failed",
    message: "Validation failed.",
    timestamp: "2026-01-01T00:01:00.000Z"
  });

  it("appends logs latest first", () => {
    expect(appendExecutionLog([info], error)[0]).toEqual(error);
  });

  it("filters logs by level and event type", () => {
    const logs = [info, error];
    expect(filterExecutionLogs(logs, { level: "error" })).toEqual([error]);
    expect(filterExecutionLogs(logs, { eventType: "validation_started" })).toEqual([info]);
  });
});
