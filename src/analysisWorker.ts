/// <reference lib="webworker" />

import { processLogs } from "./analysisLog";
import type { LogEntry, WorkerRequest, WorkerResponse } from "./types";

let cachedLogs: LogEntry[] = [];

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;

  if (message.type === "INGEST") {
    cachedLogs = message.logs;
    ctx.postMessage({ type: "INGEST_DONE" } as WorkerResponse);
  } else if (message.type === "QUERY") {
    const { query, requestId, iterations = 1 } = message;

    const startTime = performance.now();
    let result;
    for (let i = 0; i < iterations; i++) {
      result = processLogs(cachedLogs, query);
    }
    const endTime = performance.now();
    const processingTime = endTime - startTime;

    ctx.postMessage({
      type: "QUERY_RESULT",
      requestId,
      result: result!,
      processingTime,
    } as WorkerResponse);
  }
};

export {};
