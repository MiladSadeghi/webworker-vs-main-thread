import type { LogEntry, QueryObject, ProcessedResult, TimelineDataPoint, SummaryMetrics } from './types';

export function processLogs(logs: LogEntry[], query: QueryObject): ProcessedResult {
  const numBuckets = 30;
  const start = query.timeRange.start;
  const end = query.timeRange.end;
  const duration = end - start;
  const bucketSize = duration > 0 ? duration / numBuckets : 1;

  // Initialize timeline buckets
  const timelineData: TimelineDataPoint[] = [];
  for (let i = 0; i < numBuckets; i++) {
    const bucketStart = start + i * bucketSize;
    const bucketMid = bucketStart + bucketSize / 2;
    
    // Format label based on range duration
    // If range is within 24h, show HH:MM:SS or HH:MM. Otherwise show MM-DD HH:MM
    let timeLabel = '';
    const date = new Date(bucketMid);
    if (duration <= 24 * 60 * 60 * 1000) {
      timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } else {
      timeLabel = `${date.getMonth() + 1}-${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    timelineData.push({
      timeLabel,
      timestamp: bucketMid,
      INFO: 0,
      WARNING: 0,
      ERROR: 0,
      DEBUG: 0,
      total: 0
    });
  }

  let infoCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  let debugCount = 0;
  const filteredLogs: LogEntry[] = [];

  const lowercaseKeyword = query.keyword.toLowerCase().trim();

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];

    // 1. Time range check
    if (log.timestamp < start || log.timestamp > end) {
      continue;
    }

    // 2. Level filter
    if (query.logLevel !== 'ALL' && log.level !== query.logLevel) {
      continue;
    }

    // 3. Keyword filter
    if (lowercaseKeyword) {
      const msgMatch = log.message.toLowerCase().includes(lowercaseKeyword);
      const serviceMatch = log.service.toLowerCase().includes(lowercaseKeyword);
      const idMatch = log.id.toLowerCase().includes(lowercaseKeyword);
      const levelMatch = log.level.toLowerCase().includes(lowercaseKeyword);
      if (!msgMatch && !serviceMatch && !idMatch && !levelMatch) {
        continue;
      }
    }

    filteredLogs.push(log);

    // Increment level counts
    if (log.level === 'INFO') infoCount++;
    else if (log.level === 'WARNING') warningCount++;
    else if (log.level === 'ERROR') errorCount++;
    else if (log.level === 'DEBUG') debugCount++;

    // Add to timeline bucket
    const bucketIndex = duration > 0
      ? Math.min(numBuckets - 1, Math.max(0, Math.floor((log.timestamp - start) / bucketSize)))
      : 0;
    
    timelineData[bucketIndex][log.level]++;
    timelineData[bucketIndex].total++;
  }

  const totalCount = filteredLogs.length;
  const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0;
  
  const summaryMetrics: SummaryMetrics = {
    total: totalCount,
    infoCount,
    warningCount,
    errorCount,
    debugCount,
    errorRate
  };

  // Paginated chunk
  const paginatedLogs = filteredLogs.slice(
    (query.page - 1) * query.limit,
    query.page * query.limit
  );

  return {
    processedLogs: paginatedLogs,
    timelineData,
    summaryMetrics,
    totalCount
  };
}
