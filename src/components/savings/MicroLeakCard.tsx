'use client';
import type { MicroLeak } from '@/lib/analytics';
import { Droplets, TrendingDown } from 'lucide-react';

interface MicroLeakCardProps {
  leak: MicroLeak;
  rank: number;
}

export function MicroLeakCard({ leak, rank }: MicroLeakCardProps) {
  const savingsPct = leak.monthlyTotal > 0 ? (leak.monthlySavingsPotential / leak.monthlyTotal) * 100 : 0;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Droplets size={16} className="text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-800 text-sm truncate">#{rank} {leak.merchant}</p>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{leak.category}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
            <span>${leak.monthlyTotal.toFixed(2)}/mo</span>
            <span>{leak.count} transactions</span>
            <span>avg ${leak.avgAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 bg-blue-200 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, savingsPct)}%` }} />
            </div>
            <span className="text-xs font-semibold text-blue-600">{savingsPct.toFixed(0)}% saveable</span>
          </div>
          <p className="text-xs text-slate-600 italic">{leak.suggestion}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-semibold">
            <TrendingDown size={12} />
            <span>Save ${leak.monthlySavingsPotential.toFixed(2)}/month</span>
          </div>
        </div>
      </div>
    </div>
  );
}
