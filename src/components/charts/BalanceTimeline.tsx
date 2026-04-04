'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import type { Transaction, Anomaly } from '@/lib/analytics';

interface BalanceTimelineProps {
  transactions: Transaction[];
  anomalies: Anomaly[];
}

export function BalanceTimeline({ transactions, anomalies }: BalanceTimelineProps) {
  const anomalyDates = new Set(anomalies.map(a => a.transaction.date instanceof Date 
    ? a.transaction.date.toISOString().split('T')[0]
    : new Date(a.transaction.date).toISOString().split('T')[0]
  ));
  
  const data = transactions
    .filter((_, i) => i % 2 === 0 || i === transactions.length - 1)
    .map(t => {
      const date = t.date instanceof Date ? t.date : new Date(t.date);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance: t.balance,
        isAnomaly: anomalyDates.has(date.toISOString().split('T')[0]),
      };
    });

  const anomalyPoints = anomalies.map(a => {
    const date = a.transaction.date instanceof Date ? a.transaction.date : new Date(a.transaction.date);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      balance: a.transaction.balance,
    };
  });

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip formatter={(v: number) => [`$${Math.round(v)}`, 'Balance']} />
          <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} dot={false} />
          {anomalyPoints.map((pt, i) => (
            <ReferenceDot key={i} x={pt.date} y={pt.balance} r={5} fill="#ef4444" stroke="white" strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
