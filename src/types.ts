export interface LogEntry {
  id: string;
  timestamp: number; // millisecond timestamp
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  service: string;
  message: string;
}

export interface TimeRange {
  start: number; // millisecond timestamp
  end: number; // millisecond timestamp
}

export interface QueryObject {
  keyword: string;
  logLevel: 'ALL' | 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  timeRange: TimeRange;
  page: number;
  limit: number;
}

export interface TimelineDataPoint {
  timeLabel: string; // formatted time string (e.g. HH:MM)
  timestamp: number;
  INFO: number;
  WARNING: number;
  ERROR: number;
  DEBUG: number;
  total: number;
}

export interface SummaryMetrics {
  total: number;
  infoCount: number;
  warningCount: number;
  errorCount: number;
  debugCount: number;
  errorRate: number; // percentage (0-100)
}

export interface ProcessedResult {
  processedLogs: LogEntry[]; // current page
  timelineData: TimelineDataPoint[];
  summaryMetrics: SummaryMetrics;
  totalCount: number;
}

export type WorkerRequest =
  | { type: 'INGEST'; logs: LogEntry[] }
  | { type: 'QUERY'; query: QueryObject; requestId: string; iterations?: number };

export type WorkerResponse =
  | { type: 'INGEST_DONE' }
  | { type: 'QUERY_RESULT'; requestId: string; result: ProcessedResult; processingTime: number };
