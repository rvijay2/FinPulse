'use client';

interface BufferGaugeProps {
  probability: number;
  label: string;
  days: number;
}

export function BufferGauge({ probability, label, days }: BufferGaugeProps) {
  const pct = Math.min(100, Math.max(0, probability));
  const color = pct > 30 ? '#ef4444' : pct > 15 ? '#f59e0b' : '#10b981';
  const bgColor = pct > 30 ? 'bg-red-50 border-red-200' : pct > 15 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200';
  const statusLabel = pct > 30 ? 'HIGH RISK' : pct > 15 ? 'MODERATE' : 'LOW RISK';
  const statusColor = pct > 30 ? 'text-red-600' : pct > 15 ? 'text-amber-600' : 'text-emerald-600';
  
  const r = 45;
  const cx = 60;
  const cy = 60;
  const startAngle = -210;
  const endAngle = 30;
  const totalArc = endAngle - startAngle;
  const progressArc = (pct / 100) * totalArc;
  
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arc = (angle: number) => ({
    x: cx + r * Math.cos(toRad(angle)),
    y: cy + r * Math.sin(toRad(angle)),
  });
  
  const start = arc(startAngle);
  const trackEnd = arc(endAngle);
  const progressEnd = arc(startAngle + progressArc);
  const largeArc = totalArc > 180 ? 1 : 0;
  const progressLargeArc = progressArc > 180 ? 1 : 0;

  return (
    <div className={`rounded-xl border p-4 ${bgColor} flex flex-col items-center`}>
      <svg width={120} height={90} viewBox="0 0 120 90">
        <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${trackEnd.x} ${trackEnd.y}`}
          fill="none" stroke="#e2e8f0" strokeWidth={8} strokeLinecap="round" />
        {pct > 0 && (
          <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${progressLargeArc} 1 ${progressEnd.x} ${progressEnd.y}`}
            fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" />
        )}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="16" fontWeight="bold" fill={color}>
          {pct.toFixed(1)}%
        </text>
      </svg>
      <p className="text-sm font-medium text-slate-700 text-center">{label}</p>
      <p className="text-xs text-slate-500 text-center">{days}-day outlook</p>
      <span className={`mt-1 text-xs font-bold ${statusColor}`}>{statusLabel}</span>
    </div>
  );
}
