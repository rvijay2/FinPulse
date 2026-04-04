'use client';
import type { Anomaly } from '@/lib/analytics';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface AnomalyCardProps {
  anomaly: Anomaly;
}

const severityConfig = {
  high: { icon: AlertTriangle, bg: 'bg-red-50 border-red-200', iconColor: 'text-red-500', badge: 'bg-red-100 text-red-700' },
  medium: { icon: AlertCircle, bg: 'bg-amber-50 border-amber-200', iconColor: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
  low: { icon: Info, bg: 'bg-blue-50 border-blue-200', iconColor: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
};

export function AnomalyCard({ anomaly }: AnomalyCardProps) {
  const config = severityConfig[anomaly.severity];
  const Icon = config.icon;
  const absAmt = Math.abs(anomaly.transaction.amount);
  const txDate = anomaly.transaction.date instanceof Date 
    ? anomaly.transaction.date 
    : new Date(anomaly.transaction.date);

  return (
    <div className={`rounded-xl border p-4 ${config.bg} transition-all hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 flex-shrink-0 ${config.iconColor}`} size={18} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="font-semibold text-slate-800 text-sm truncate">{anomaly.transaction.description}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${config.badge}`}>
              Z={anomaly.zscore}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
            <span>{txDate.toLocaleDateString()}</span>
            <span className="font-semibold text-slate-700">${absAmt.toFixed(2)}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs ${config.badge}`}>{anomaly.transaction.category}</span>
          </div>
          <p className="text-xs text-slate-600">{anomaly.explanation}</p>
        </div>
      </div>
    </div>
  );
}
