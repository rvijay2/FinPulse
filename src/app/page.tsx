'use client';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalytics } from '@/context/AnalyticsContext';
import { Upload, Activity, TrendingUp, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { analyzeCSV, isLoading } = useAnalytics();
  const [dragOver, setDragOver] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    const text = await file.text();
    await analyzeCSV(text, 'chase');
    router.push('/dashboard');
  }, [analyzeCSV, router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const loadSampleData = useCallback(async () => {
    setLoadingDemo(true);
    try {
      const res = await fetch('/data/sample_transactions.csv');
      const text = await res.text();
      await analyzeCSV(text, 'chase');
      router.push('/dashboard');
    } finally {
      setLoadingDemo(false);
    }
  }, [analyzeCSV, router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
            <Activity size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">FinPulse</h1>
            <p className="text-indigo-300 text-sm">Financial Vital Signs</p>
          </div>
        </div>

        <h2 className="text-3xl sm:text-5xl font-bold text-white text-center mb-4 max-w-3xl leading-tight">
          Know Your Financial<br />
          <span className="text-indigo-400">Vital Signs</span>
        </h2>
        <p className="text-slate-400 text-center mb-12 max-w-xl text-lg">
          Upload your bank statement CSV and get instant insights into your savings rate, emergency runway, spending anomalies, and micro-leaks.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {[
            { icon: TrendingUp, label: 'Savings Rate' },
            { icon: Shield, label: 'Emergency Buffer' },
            { icon: Zap, label: 'Anomaly Detection' },
            { icon: Activity, label: 'Stress Score' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-white/10 text-white text-sm px-4 py-2 rounded-full">
              <Icon size={14} className="text-indigo-400" />
              {label}
            </div>
          ))}
        </div>

        <div className="w-full max-w-lg">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              dragOver ? 'border-indigo-400 bg-indigo-500/20' : 'border-slate-600 bg-white/5 hover:border-indigo-500 hover:bg-white/10'
            }`}
            onClick={() => document.getElementById('csv-input')?.click()}
          >
            <Upload size={36} className="mx-auto mb-3 text-slate-400" />
            <p className="text-white font-medium mb-1">Drop your bank CSV here</p>
            <p className="text-slate-400 text-sm">Supports Chase, BofA, Wells Fargo formats</p>
            <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={handleInputChange} />
          </div>

          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 border-t border-slate-700" />
            <span className="text-slate-500 text-sm">or</span>
            <div className="flex-1 border-t border-slate-700" />
          </div>

          <button
            onClick={loadSampleData}
            disabled={isLoading || loadingDemo}
            className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loadingDemo || isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Activity size={18} />
                Try with Sample Student Data
              </>
            )}
          </button>
        </div>
      </div>

      <footer className="text-center py-6 text-slate-600 text-sm">
        No data is stored or shared. Analysis runs on our secure server.
      </footer>
    </main>
  );
}
