import { Database } from 'lucide-react';
import type { SummaryMetrics } from '../types';

interface MetricsCardProps {
  totalCount: number;
  summaryMetrics: SummaryMetrics;
}

export default function MetricsCard({ totalCount, summaryMetrics }: MetricsCardProps) {
  return (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800/50 p-5 backdrop-blur-sm flex flex-col gap-4">
      <span className="text-base font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
        <Database className="h-5 w-5 text-purple-450" />
        Incident Summary Metrics
      </span>

      <div className="grid grid-cols-3 gap-3 text-center text-sm font-mono">
        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
          <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider mb-0.5">Matched</span>
          <span className="font-extrabold text-slate-100 text-lg">{totalCount}</span>
        </div>
        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
          <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider mb-0.5">Errors</span>
          <span className="font-extrabold text-rose-500 text-lg">{summaryMetrics.errorCount}</span>
        </div>
        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
          <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider mb-0.5">Warns</span>
          <span className="font-extrabold text-amber-500 text-lg">{summaryMetrics.warningCount}</span>
        </div>
      </div>

      <div className="border-t border-slate-900/60 pt-4">
        <div className="flex items-center justify-between mb-2 text-sm font-semibold text-slate-400">
          <span>Error Frequency Rate</span>
          <span className={`${summaryMetrics.errorRate > 15 ? 'text-rose-455' : 'text-emerald-455'} font-mono text-base`}>
            {summaryMetrics.errorRate.toFixed(2)}%
          </span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-900 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              summaryMetrics.errorRate > 15 ? 'bg-rose-500' : summaryMetrics.errorRate > 5 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, summaryMetrics.errorRate)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
