import { Activity } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { TimelineDataPoint } from '../types';

interface TimelineChartProps {
  timelineData: TimelineDataPoint[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as TimelineDataPoint;
    return (
      <div className="bg-slate-900 border border-slate-800 text-sm text-slate-200 p-4 rounded-xl shadow-2xl flex flex-col gap-2 w-52">
        <div className="font-bold border-b border-slate-800 pb-1.5 mb-1.5 text-slate-400">
          {data.timeLabel}
        </div>
        {payload.map((item: any) => (
          <div key={item.name} className="flex justify-between items-center">
            <span className="font-semibold" style={{ color: item.color }}>{item.name}</span>
            <span className="font-mono font-bold text-slate-105">{item.value}</span>
          </div>
        ))}
        <div className="border-t border-slate-800 pt-2 mt-1 font-bold text-slate-100 flex justify-between">
          <span>Total Hits</span>
          <span className="font-mono text-indigo-405">{data.total}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function TimelineChart({ timelineData }: TimelineChartProps) {
  return (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800/50 p-5 backdrop-blur-sm flex flex-col gap-3.5 h-64 shrink-0">
      <span className="text-base font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
        <Activity className="h-5 w-5 text-indigo-400" />
        Log Count Distribution Timeline
      </span>

      <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-900 flex-1 min-h-0">
        {timelineData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-slate-650 text-sm">
            No timeline data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={timelineData}
              margin={{ top: 5, right: 5, left: -20, bottom: -5 }}
            >
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#4b5563"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={4}
              />
              <YAxis
                stroke="#4b5563"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dx={-4}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.2 }} />
              <Bar dataKey="DEBUG" stackId="a" fill="#a855f7" name="DEBUG" />
              <Bar dataKey="INFO" stackId="a" fill="#10b981" name="INFO" />
              <Bar dataKey="WARNING" stackId="a" fill="#f59e0b" name="WARNING" />
              <Bar dataKey="ERROR" stackId="a" fill="#f43f5e" name="ERROR" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
