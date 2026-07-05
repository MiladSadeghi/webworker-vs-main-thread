import { useState, useEffect, useRef } from "react";
import { generateMockLogs } from "./mockData";
import { processLogs } from "./analysisLog";
import type { LogEntry, QueryObject, ProcessedResult } from "./types";

// Import subcomponents
import TelemetryCard from "./components/TelemetryCard";
import MetricsCard from "./components/MetricsCard";
import FilterCard from "./components/FilterCard";
import TimelineChart from "./components/TimelineChart";
import LogExplorer from "./components/LogExplorer";

const handleInduceLag = () => {
  const blockDuration = 250; // ms
  const start = performance.now();
  while (performance.now() - start < blockDuration) {
    // Busy block
  }
};

export default function App() {
  // 1. Data & Ingestion State
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);

  // Time boundaries of generated logs
  const [boundaries, setBoundaries] = useState({ min: 0, max: 0 });

  // 2. Query & Search State
  const [query, setQuery] = useState<QueryObject>({
    keyword: "",
    logLevel: "ALL",
    timeRange: { start: 0, end: 0 },
    page: 1,
    limit: 50,
  });

  // 3. Execution & Benchmark Controls
  const [executionMode, setExecutionMode] = useState<"worker" | "main">(
    "worker",
  );
  const [isQuerying, setIsQuerying] = useState(false);
  const [lastProcessingTime, setLastProcessingTime] = useState<number>(0);

  // 4. Processing Result
  const [result, setResult] = useState<ProcessedResult>({
    processedLogs: [],
    timelineData: [],
    summaryMetrics: {
      total: 0,
      infoCount: 0,
      warningCount: 0,
      errorCount: 0,
      debugCount: 0,
      errorRate: 0,
    },
    totalCount: 0,
  });

  // 5. FPS Telemetry State
  const [fps, setFps] = useState({ avg: 60, min: 60 });
  const frameTimes = useRef<number[]>([]);
  const minFpsResetTimer = useRef<number>(0);

  // 6. Web Worker Reference & Race Condition Protection
  const workerRef = useRef<Worker | null>(null);
  const nextRequestId = useRef(1);
  const latestRequestId = useRef(0);
  const prevFilters = useRef({
    keyword: "",
    logLevel: "ALL",
    timeRange: { start: 0, end: 0 },
  });

  // --- Initialize Mock Logs ---
  useEffect(() => {
    const timer = setTimeout(() => {
      const logs = generateMockLogs();
      setAllLogs(logs);

      if (logs.length > 0) {
        const timestamps = logs.map((l) => l.timestamp);
        const min = Math.min(...timestamps);
        const max = Math.max(...timestamps);
        setBoundaries({ min, max });
        setQuery((q) => ({
          ...q,
          timeRange: { start: min, end: max },
        }));
      }
      setIsGenerating(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // --- Web Worker Setup & Communication ---
  useEffect(() => {
    const worker = new Worker(new URL("./analysisWorker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<any>) => {
      const msg = event.data;
      if (msg.type === "INGEST_DONE") {
        // Ingestion complete
      } else if (msg.type === "QUERY_RESULT") {
        if (parseInt(msg.requestId, 10) === latestRequestId.current) {
          setResult(msg.result);
          setLastProcessingTime(msg.processingTime);
          setIsQuerying(false);
        }
      }
    };

    if (allLogs.length > 0) {
      worker.postMessage({ type: "INGEST", logs: allLogs });
    }

    return () => {
      worker.terminate();
    };
  }, [allLogs]);

  // --- Run Query (Worker vs Main Thread Mode) ---
  useEffect(() => {
    if (allLogs.length === 0 || boundaries.min === 0) return;

    const reqId = nextRequestId.current++;
    latestRequestId.current = reqId;

    setIsQuerying(true);

    const filtersChanged =
      query.keyword !== prevFilters.current.keyword ||
      query.logLevel !== prevFilters.current.logLevel ||
      query.timeRange.start !== prevFilters.current.timeRange.start ||
      query.timeRange.end !== prevFilters.current.timeRange.end;

    prevFilters.current = {
      keyword: query.keyword,
      logLevel: query.logLevel,
      timeRange: { ...query.timeRange },
    };

    const iterations = filtersChanged ? 60 : 1;

    if (executionMode === "worker") {
      const setupWorkerListener = (w: Worker) => {
        w.onmessage = (event: MessageEvent<any>) => {
          const msg = event.data;
          if (msg.type === "INGEST_DONE") {
            w.postMessage({
              type: "QUERY",
              query,
              requestId: reqId.toString(),
              iterations,
            });
          } else if (msg.type === "QUERY_RESULT") {
            if (parseInt(msg.requestId, 10) === latestRequestId.current) {
              setResult(msg.result);
              setLastProcessingTime(msg.processingTime);
              setIsQuerying(false);
            }
          }
        };
      };

      if (isQuerying && workerRef.current) {
        // Cancel ongoing query immediately to prevent queue backlog
        workerRef.current.terminate();

        const worker = new Worker(
          new URL("./analysisWorker.ts", import.meta.url),
          {
            type: "module",
          },
        );
        workerRef.current = worker;
        setupWorkerListener(worker);
        worker.postMessage({ type: "INGEST", logs: allLogs });
      } else if (workerRef.current) {
        setupWorkerListener(workerRef.current);
        workerRef.current.postMessage({
          type: "QUERY",
          query,
          requestId: reqId.toString(),
          iterations,
        });
      }
    } else {
      const timer = setTimeout(() => {
        if (latestRequestId.current !== reqId) return;

        const startTime = performance.now();
        let res: ProcessedResult | null = null;

        for (let i = 0; i < iterations; i++) {
          res = processLogs(allLogs, query);
        }

        const endTime = performance.now();
        const processingTime = endTime - startTime;

        if (res) {
          setResult(res);
        }
        setLastProcessingTime(processingTime);
        setIsQuerying(false);
      }, 30);

      return () => clearTimeout(timer);
    }
  }, [query, executionMode, allLogs, boundaries]);

  // --- FPS Telemetry loop ---
  useEffect(() => {
    let animFrameId: number;
    let lastTime = 0;

    const calculateFps = (timestamp: number) => {
      if (lastTime !== 0) {
        const delta = timestamp - lastTime;

        frameTimes.current.push(delta);
        if (frameTimes.current.length > 60) {
          frameTimes.current.shift();
        }

        const totalDelta = frameTimes.current.reduce((a, b) => a + b, 0);
        const avg = Math.round(1000 / (totalDelta / frameTimes.current.length));

        const maxDelta = Math.max(...frameTimes.current);
        const min = Math.round(1000 / maxDelta);

        setFps((prev) => {
          const currentMin = prev.min;
          const newMin = Math.min(min, currentMin);
          return {
            avg: Math.min(avg, 60),
            min: Math.min(newMin, 60),
          };
        });
      }
      lastTime = timestamp;
      animFrameId = requestAnimationFrame(calculateFps);
    };

    animFrameId = requestAnimationFrame(calculateFps);

    minFpsResetTimer.current = window.setInterval(() => {
      setFps((prev) => ({ ...prev, min: prev.avg }));
    }, 4000);

    return () => {
      cancelAnimationFrame(animFrameId);
      clearInterval(minFpsResetTimer.current);
    };
  }, []);

  // --- Preset Handlers ---
  const applyPreset = (hours: number | "all") => {
    if (boundaries.max === 0) return;
    let start = boundaries.min;
    if (hours !== "all") {
      start = Math.max(boundaries.min, boundaries.max - hours * 60 * 60 * 1000);
    }
    setQuery((q) => ({
      ...q,
      timeRange: { start, end: boundaries.max },
      page: 1,
    }));
  };

  // --- Page Navigation Handlers ---
  const totalPages = Math.max(1, Math.ceil(result.totalCount / query.limit));

  const handlePageChange = (newPage: number) => {
    const pageVal = Math.min(totalPages, Math.max(1, newPage));
    setQuery((q) => ({ ...q, page: pageVal }));
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Main Content Area (Split-pane fixed h-screen viewport layout) */}
      <main className="grow min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 w-full mx-auto overflow-hidden">
        {/* Left Sidebar Pane (Scrolls independently if needed) */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-h-0 overflow-y-auto pr-1">
          <TelemetryCard
            executionMode={executionMode}
            setExecutionMode={setExecutionMode}
            fps={fps}
            lastProcessingTime={lastProcessingTime}
            onInduceLag={handleInduceLag}
          />
          <MetricsCard
            totalCount={result.totalCount}
            summaryMetrics={result.summaryMetrics}
          />
          <FilterCard
            query={query}
            setQuery={setQuery}
            applyPreset={applyPreset}
          />
        </div>

        {/* Right Content Pane */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-0 overflow-hidden">
          <TimelineChart timelineData={result.timelineData} />
          <LogExplorer
            processedLogs={result.processedLogs}
            isGenerating={isGenerating}
            isQuerying={isQuerying}
            query={query}
            setQuery={setQuery}
            totalCount={result.totalCount}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </main>
    </div>
  );
}
