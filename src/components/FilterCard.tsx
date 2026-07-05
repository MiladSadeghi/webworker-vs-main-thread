import { Search, X } from 'lucide-react';
import type { QueryObject } from '../types';

interface FilterCardProps {
  query: QueryObject;
  setQuery: React.Dispatch<React.SetStateAction<QueryObject>>;
  applyPreset: (hours: number | 'all') => void;
}

export default function FilterCard({ query, setQuery, applyPreset }: FilterCardProps) {
  return (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800/50 p-5 backdrop-blur-sm flex flex-col gap-4.5">
      <span className="text-base font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
        <Search className="h-5 w-5 text-indigo-400" />
        Filter Query Rules
      </span>

      {/* Keyword */}
      <div>
        <label htmlFor="keyword-filter" className="text-xs text-slate-400 font-semibold block mb-1.5 uppercase">
          Keyword Filter
        </label>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            id="keyword-filter"
            type="text"
            value={query.keyword}
            onChange={(e) => setQuery(q => ({ ...q, keyword: e.target.value, page: 1 }))}
            placeholder="e.g. 'apply discount', 'error'..."
            className="w-full bg-slate-950 border border-slate-800/50 hover:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-11 pr-10 text-sm placeholder:text-slate-600 transition-colors"
          />
          {query.keyword && (
            <button
              type="button"
              onClick={() => setQuery(q => ({ ...q, keyword: '', page: 1 }))}
              aria-label="Clear keyword search input"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-900 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Severity Level */}
      <div>
        <label htmlFor="severity-filter" className="text-xs text-slate-400 font-semibold block mb-1.5 uppercase">
          Log Severity Level
        </label>
        <select
          id="severity-filter"
          value={query.logLevel}
          onChange={(e) => setQuery(q => ({ ...q, logLevel: e.target.value as any, page: 1 }))}
          className="w-full bg-slate-950 border border-slate-800/50 hover:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 px-3.5 text-sm text-slate-205 transition-colors cursor-pointer"
        >
          <option value="ALL">ALL LEVELS</option>
          <option value="INFO">INFO ONLY</option>
          <option value="DEBUG">DEBUG ONLY</option>
          <option value="WARNING">WARNING ONLY</option>
          <option value="ERROR">ERROR ONLY</option>
        </select>
      </div>

      {/* Time Presets */}
      <div>
        <label htmlFor="presets-group" className="text-xs text-slate-400 font-semibold block mb-1.5 uppercase">
          Time Window Presets
        </label>
        <div id="presets-group" className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => applyPreset(1)}
            aria-label="Set time window to last 1 hour"
            className="bg-slate-950 hover:bg-slate-900 py-2.5 rounded-lg border border-slate-800/50 text-xs font-semibold text-slate-300 hover:text-slate-100 cursor-pointer transition-colors"
          >
            1h
          </button>
          <button
            type="button"
            onClick={() => applyPreset(6)}
            aria-label="Set time window to last 6 hours"
            className="bg-slate-950 hover:bg-slate-900 py-2.5 rounded-lg border border-slate-800/50 text-xs font-semibold text-slate-300 hover:text-slate-100 cursor-pointer transition-colors"
          >
            6h
          </button>
          <button
            type="button"
            onClick={() => applyPreset(12)}
            aria-label="Set time window to last 12 hours"
            className="bg-slate-950 hover:bg-slate-900 py-2.5 rounded-lg border border-slate-800/50 text-xs font-semibold text-slate-300 hover:text-slate-100 cursor-pointer transition-colors"
          >
            12h
          </button>
          <button
            type="button"
            onClick={() => applyPreset('all')}
            aria-label="Set time window to entire 24 hours"
            className="bg-slate-950 hover:bg-slate-900 py-2.5 rounded-lg border border-slate-800/50 text-xs font-semibold text-slate-300 hover:text-slate-100 cursor-pointer transition-colors"
          >
            24h
          </button>
        </div>
      </div>
    </div>
  );
}
