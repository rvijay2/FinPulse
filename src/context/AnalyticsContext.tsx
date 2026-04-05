'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import type { FinancialVitals, Anomaly, RecurringCharge, BufferSimulation, MicroLeak, Transaction } from '@/lib/analytics';
import type { SavingsPlan } from '@/lib/agentPlanner';

interface AnalyticsData {
  vitals: FinancialVitals | null;
  anomalies: Anomaly[];
  recurring: RecurringCharge[];
  simulation: BufferSimulation | null;
  microLeaks: MicroLeak[];
  agentPlans: SavingsPlan[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

interface AnalyticsContextType extends AnalyticsData {
  analyzeCSV: (csvText: string, schema?: string) => Promise<void>;
  reset: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

const initialState: AnalyticsData = {
  vitals: null, anomalies: [], recurring: [], simulation: null,
  microLeaks: [], agentPlans: [], transactions: [], isLoading: false, error: null,
};

interface TransactionFromAPI {
  date: string;
  description: string;
  amount: number;
  balance: number;
  category: string;
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AnalyticsData>(initialState);

  const analyzeCSV = async (csvText: string, schema = 'chase') => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText, schema }),
      });
      if (!response.ok) throw new Error('Analysis failed');
      const result = await response.json();
      setData({
        ...result,
        transactions: result.transactions.map((t: TransactionFromAPI) => ({ ...t, date: new Date(t.date) })),
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setData(prev => ({ ...prev, isLoading: false, error: err instanceof Error ? err.message : 'Unknown error' }));
    }
  };

  const reset = () => setData(initialState);

  return (
    <AnalyticsContext.Provider value={{ ...data, analyzeCSV, reset }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return ctx;
}
