import { Sliders, Zap, Cpu, Activity, Flame } from 'lucide-react';

interface TelemetryCardProps {
  executionMode: 'worker' | 'main';
  setExecutionMode: (mode: 'worker' | 'main') => void;
  fps: { avg: number; min: number };
  lastProcessingTime: number;
  onInduceLag: () => void;
}

export default function TelemetryCard({
  executionMode,
  setExecutionMode,
  fps,
  lastProcessingTime,
  onInduceLag
}: TelemetryCardProps) {
  return (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800/50 p-5 backdrop-blur-sm flex flex-col gap-4">
      {/* Mode header & Switcher */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-base font-bold text-slate-205 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-405" />
            Query Mode Controls
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${executionMode === 'worker' ? 'bg-indigo-900/40 text-indigo-400 border border-indigo-500/20' : 'bg-rose-900/40 text-rose-400 border border-rose-500/20'}`}>
            {executionMode === 'worker' ? 'Web Worker' : 'Main Thread'}
          </span>
        </div>

        <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-900 flex items-center mb-3.5">
          <button
            type="button"
            onClick={() => setExecutionMode('worker')}
            aria-label="Switch to Web Worker Mode"
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              executionMode === 'worker'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-205'
            }`}
          >
            <Zap className="h-4 w-4" />
            Worker Mode
          </button>
          <button
            type="button"
            onClick={() => setExecutionMode('main')}
            aria-label="Switch to Main Thread Mode"
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              executionMode === 'main'
                ? 'bg-rose-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-205'
            }`}
          >
            <Cpu className="h-4 w-4" />
            Main Thread
          </button>
        </div>
      </div>

      {/* Telemetry Stats */}
      <div className="border-t border-slate-900/60 pt-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-base font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-455" />
            Performance Telemetry
          </span>
          <span className={`h-3 w-3 rounded-full ${
            fps.avg >= 55 ? 'bg-emerald-500' : fps.avg >= 40 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
          }`}></span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-955 p-3.5 rounded-xl border border-slate-900 text-center">
            <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider mb-1">
              Average FPS
            </span>
            <span className={`text-4xl font-extrabold font-mono tracking-tight ${
              fps.avg >= 55 ? 'text-emerald-400' : fps.avg >= 40 ? 'text-amber-400' : 'text-rose-455'
            }`}>
              {fps.avg}
            </span>
          </div>
          <div className="bg-slate-955 p-3.5 rounded-xl border border-slate-900 text-center">
            <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider mb-1">
              Min FPS (Drop)
            </span>
            <span className={`text-4xl font-extrabold font-mono tracking-tight ${
              fps.min >= 52 ? 'text-emerald-400' : fps.min >= 35 ? 'text-amber-400' : 'text-rose-405'
            }`}>
              {fps.min}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm text-slate-300">
          <span>Query Time: <strong className={`font-mono text-slate-100 text-base ${lastProcessingTime > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>{lastProcessingTime.toFixed(1)} ms</strong></span>
          <button
            type="button"
            onClick={onInduceLag}
            aria-label="Induce 250 milliseconds UI lag"
            className="text-xs bg-slate-900 hover:bg-slate-800 text-amber-450 py-1.5 px-3.5 rounded-lg border border-slate-800 cursor-pointer flex items-center gap-1.5 font-bold transition-colors"
          >
            <Flame className="h-4 w-4 animate-pulse" />
            Lag UI (250ms)
          </button>
        </div>
      </div>
    </div>
  );
}
