'use client';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import type { FinancialVitals } from '@/lib/analytics';

interface VitalsRadarProps {
  vitals: FinancialVitals;
}

export function VitalsRadar({ vitals }: VitalsRadarProps) {
  const normalize = (value: number, min: number, max: number, invert = false) => {
    const norm = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    return invert ? 100 - norm : norm;
  };

  const data = [
    { subject: 'Savings Rate', A: normalize(vitals.savingsRate.value, 0, 30), fullMark: 100 },
    { subject: 'Low Debt', A: normalize(vitals.debtToIncome.value, 0, 50, true), fullMark: 100 },
    { subject: 'Runway', A: normalize(vitals.emergencyRunway.value, 0, 6), fullMark: 100 },
    { subject: 'Stability', A: normalize(vitals.expenseVolatility.value, 0, 60, true), fullMark: 100 },
    { subject: 'Low Stress', A: normalize(vitals.stressScore.value, 0, 100, true), fullMark: 100 },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
          <Radar name="Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
          <Tooltip formatter={(value: number) => [`${Math.round(value)}/100`, 'Health Score']} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
