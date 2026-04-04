'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { BufferSimulation } from '@/lib/analytics';

interface MonteCarloChartProps {
  simulation: BufferSimulation;
  currentBalance: number;
}

export function MonteCarloChart({ simulation }: MonteCarloChartProps) {
  const paths = simulation.monteCarloPaths.slice(0, 20);
  
  const chartData = Array.from({ length: 31 }, (_, i) => {
    const point: Record<string, number> = { day: i };
    const vals = paths.map(p => p[Math.min(i, p.length - 1)] ?? p[p.length - 1]);
    point.min = Math.min(...vals);
    point.max = Math.max(...vals);
    const sorted = [...vals].sort((a, b) => a - b);
    point.median = sorted[Math.floor(sorted.length / 2)];
    return point;
  });

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(v) => `Day ${v}`} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip formatter={(value) => [`$${Math.round(Number(value))}`, '']} labelFormatter={(l) => `Day ${l}`} />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Zero Balance', fill: '#ef4444', fontSize: 11 }} />
          <Area type="monotone" dataKey="max" stroke="none" fill="#dbeafe" fillOpacity={0.5} />
          <Area type="monotone" dataKey="min" stroke="none" fill="white" fillOpacity={1} />
          <Area type="monotone" dataKey="median" stroke="#6366f1" fill="#ede9fe" fillOpacity={0.6} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
