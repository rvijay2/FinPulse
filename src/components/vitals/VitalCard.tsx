'use client';
import { VitalSign } from '@/lib/analytics';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VitalCardProps {
  vital: VitalSign;
}

const statusConfig = {
  good: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700' },
  critical: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', badge: 'bg-red-100 text-red-700' },
};

export function VitalCard({ vital }: VitalCardProps) {
  const config = statusConfig[vital.status];
  const TrendIcon = vital.trend > 2 ? TrendingUp : vital.trend < -2 ? TrendingDown : Minus;
  const trendColor = vital.trend > 2 ? 'text-emerald-500' : vital.trend < -2 ? 'text-red-500' : 'text-slate-400';

  return (
    <div className={`rounded-xl border p-4 ${config.bg} ${config.border} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{vital.name}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-3xl font-bold ${config.text}`}>{vital.value}</span>
            <span className={`text-sm font-medium ${config.text}`}>{vital.unit}</span>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${config.badge}`}>
          {vital.status.toUpperCase()}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-2">{vital.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Target: {vital.target}</span>
        {vital.trend !== 0 && (
          <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
            <TrendIcon size={12} />
            <span>{Math.abs(vital.trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
