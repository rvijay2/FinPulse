'use client';

interface VitalRingProps {
  value: number;
  max: number;
  label: string;
  color: string;
  size?: number;
}

export function VitalRing({ value, max, label, color, size = 80 }: VitalRingProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, value / max));
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className="text-xs text-slate-500 text-center leading-tight">{label}</span>
    </div>
  );
}
