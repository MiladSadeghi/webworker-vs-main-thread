import { Database, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { LogEntry, QueryObject } from '../types';

interface LogExplorerProps {
  processedLogs: LogEntry[];
  isGenerating: boolean;
  isQuerying: boolean;
  query: QueryObject;
  setQuery: React.Dispatch<React.SetStateAction<QueryObject>>;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const levelColors = {
  INFO: { text: 'text-emerald-450', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  DEBUG: { text: 'text-purple-455', bg: 'bg-purple-500/10 border-purple-500/20' },
  WARNING: { text: 'text-amber-455', bg: 'bg-amber-500/10 border-amber-500/20' },
  ERROR: { text: 'text-rose-450', bg: 'bg-rose-500/10 border-rose-500/20' }
};

const formatTime = (timestamp: number) => {
  if (timestamp === 0) return '--:--:--';
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + 
         '.' + d.getMilliseconds().toString().padStart(3, '0');
};

const escapeRegExp = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const highlightText = (text: string, highlight: string) => {
  if (!highlight.trim()) return <span className="text-slate-355">{text}</span>;
  const parts = text.split(new RegExp(`(${escapeRegExp(highlight)})`, 'gi'));
  return (
    <span className="text-slate-355">
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-brand-primary/35 text-indigo-150 px-1 rounded font-bold border border-brand-primary/30">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export default function LogExplorer({
  processedLogs,
  isGenerating,
  isQuerying,
  query,
  setQuery,
  totalCount,
  totalPages,
  onPageChange
}: LogExplorerProps) {
  return (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800/50 p-5 backdrop-blur-sm flex-1 min-h-0 flex flex-col justify-between">
      {/* Header info */}
      <div className="flex items-center justify-between shrink-0 mb-3.5">
        <span className="text-base font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Database className="h-5 w-5 text-indigo-400" />
          Active Log Entries
          {isQuerying && <span className="text-sm text-indigo-400 font-semibold animate-pulse tracking-wide">(querying...)</span>}
        </span>
        <div className="text-sm text-slate-400 font-semibold">
          Showing <span className="text-slate-100 font-bold">{processedLogs.length > 0 ? (query.page - 1) * query.limit + 1 : 0}</span> to <span className="text-slate-100 font-bold">{Math.min(query.page * query.limit, totalCount)}</span> of <span className="text-slate-100 font-bold">{totalCount.toLocaleString()}</span> logs
        </div>
      </div>

      {/* Scrollable table container */}
      <div className="flex-1 min-h-0 overflow-y-auto border border-slate-800/50 rounded-xl bg-slate-950/60">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-900/90 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-800/50 text-slate-350 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4 w-32 font-mono">Timestamp</th>
              <th className="py-3.5 px-4 w-24">Level</th>
              <th className="py-3.5 px-4 w-40">Service</th>
              <th className="py-3.5 px-4">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/30 font-mono text-[14px] leading-relaxed">
            {isGenerating ? (
              <tr>
                <td colSpan={4} className="py-20 text-center text-slate-500 font-bold">
                  Generating 50,000 mock logs. Please wait...
                </td>
              </tr>
            ) : processedLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-20 text-center text-slate-500 font-bold">
                  No logs found matching search criteria.
                </td>
              </tr>
            ) : (
              processedLogs.map((log) => {
                const colors = levelColors[log.level];
                return (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-900/30 transition-colors border-b border-slate-900/20"
                  >
                    <td className="py-3 px-4 text-slate-400 align-top select-all">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 align-top">
                      <span className={`inline-block py-0.5 px-2 rounded font-bold text-xs border uppercase ${colors.text} ${colors.bg}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-indigo-300 font-semibold align-top select-all">
                      {log.service}
                    </td>
                    <td className="py-3 px-4 align-top break-all select-all text-slate-200">
                      {highlightText(log.message, query.keyword)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination panel (Locked at bottom, shrink-0) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 mt-4 pt-3.5 border-t border-slate-900/40 shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Lines:</span>
            <select
              value={query.limit}
              aria-label="Select number of logs to show per page"
              onChange={(e) => setQuery(q => ({ ...q, limit: parseInt(e.target.value, 10), page: 1 }))}
              className="bg-slate-950 border border-slate-800/50 hover:border-slate-800 rounded-lg py-1.5 px-2.5 text-sm text-slate-350 cursor-pointer transition-colors"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="250">250</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onPageChange(1)}
              disabled={query.page === 1}
              aria-label="Go to first page"
              className="bg-slate-950 hover:bg-slate-900 disabled:opacity-30 p-2 rounded-lg border border-slate-800/50 text-slate-400 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronsLeft className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(query.page - 1)}
              disabled={query.page === 1}
              aria-label="Go to previous page"
              className="bg-slate-950 hover:bg-slate-900 disabled:opacity-30 p-2 rounded-lg border border-slate-800/50 text-slate-400 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>

            <span className="text-sm text-slate-355 px-2.5 font-medium">
              Page <span className="font-bold text-slate-205">{query.page}</span> of <span className="font-bold text-slate-205">{totalPages}</span>
            </span>

            <button
              type="button"
              onClick={() => onPageChange(query.page + 1)}
              disabled={query.page === totalPages}
              aria-label="Go to next page"
              className="bg-slate-950 hover:bg-slate-900 disabled:opacity-30 p-2 rounded-lg border border-slate-800/50 text-slate-400 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              disabled={query.page === totalPages}
              aria-label="Go to last page"
              className="bg-slate-950 hover:bg-slate-900 disabled:opacity-30 p-2 rounded-lg border border-slate-800/50 text-slate-400 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronsRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
