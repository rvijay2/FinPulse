'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalytics } from '@/context/AnalyticsContext';
import { Navigation } from '@/components/layout/Navigation';
import { VitalCard } from '@/components/vitals/VitalCard';
import { VitalsRadar } from '@/components/vitals/VitalsRadar';
import { BalanceTimeline } from '@/components/charts/BalanceTimeline';
import { MonteCarloChart } from '@/components/charts/MonteCarloChart';
import { AnomalyCard } from '@/components/anomalies/AnomalyCard';
import { BufferGauge } from '@/components/buffer/BufferGauge';
import { MicroLeakCard } from '@/components/savings/MicroLeakCard';
import { DollarSign, TrendingUp, AlertTriangle, Droplets, ArrowLeft, CheckCircle, Target, Shield } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { vitals, anomalies, simulation, microLeaks, agentPlans, transactions, isLoading, error } = useAnalytics();
  const [activeTab, setActiveTab] = useState('overview');
  const [doctorNote, setDoctorNote] = useState<string>('');

  useEffect(() => {
    if (!isLoading && !vitals) {
      router.push('/');
    }
  }, [vitals, isLoading, router]);

  useEffect(() => {
    if (vitals) {
      fetch('/api/doctor-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vitals }),
      }).then(r => r.json()).then(d => setDoctorNote(d.narrative || '')).catch(() => {});
    }
  }, [vitals]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Analyzing your finances...</p>
        </div>
      </div>
    );
  }

  if (error || !vitals) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'No data available'}</p>
          <button onClick={() => router.push('/')} className="text-indigo-600 hover:underline flex items-center gap-1 mx-auto">
            <ArrowLeft size={16} /> Back to start
          </button>
        </div>
      </div>
    );
  }

  const vitalsList = [vitals.savingsRate, vitals.debtToIncome, vitals.emergencyRunway, vitals.expenseVolatility, vitals.stressScore];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Monthly Income', value: `$${vitals.monthlyIncome.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600' },
                { label: 'Monthly Expenses', value: `$${vitals.monthlyExpenses.toLocaleString()}`, icon: DollarSign, color: 'text-slate-600' },
                { label: 'Current Balance', value: `$${vitals.currentBalance.toLocaleString()}`, icon: Target, color: 'text-indigo-600' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <stat.icon size={20} className={stat.color} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Financial Vital Signs</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {vitalsList.map(vital => <VitalCard key={vital.name} vital={vital} />)}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-800 mb-2">Health Radar</h3>
                <VitalsRadar vitals={vitals} />
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-800 mb-2">Balance History</h3>
                <BalanceTimeline transactions={transactions} anomalies={anomalies} />
              </div>
            </div>

            {doctorNote && (
              <div className="bg-white rounded-xl border border-indigo-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={18} className="text-indigo-500" />
                  <h3 className="font-semibold text-slate-800">AI Financial Assessment</h3>
                </div>
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {(() => doctorNote.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`(.+?)`/g, '$1').replace(/\[(.+?)\]\(.+?\)/g, '$1').replace(/^#{1,6}\s+/gm, '').trim())()} 
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'buffer' && simulation && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Emergency Buffer Analysis</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <BufferGauge probability={simulation.overdraftProb14Days} label="Overdraft Risk" days={14} />
              <BufferGauge probability={simulation.overdraftProb30Days} label="Overdraft Risk" days={30} />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-800 mb-3">Monte Carlo Balance Projection (30 Days)</h3>
              <p className="text-xs text-slate-500 mb-3">500 simulated scenarios based on your spending patterns</p>
              <MonteCarloChart simulation={simulation} currentBalance={vitals.currentBalance} />
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
              <h3 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                <Shield size={18} /> Auto Buffer Plan
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Save Daily', value: `$${simulation.autoBufferPlan.dailySavings.toFixed(2)}` },
                  { label: 'Save Monthly', value: `$${simulation.autoBufferPlan.monthlySavings.toFixed(2)}` },
                  { label: 'Target Balance', value: `$${simulation.autoBufferPlan.targetBalance.toLocaleString()}` },
                  { label: 'Projected Risk After', value: `${(simulation.autoBufferPlan.projectedRiskAfter * 100).toFixed(1)}%` },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-lg p-3">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="font-bold text-indigo-700 text-lg">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'savings' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Savings Assistant</h2>
            
            {microLeaks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Droplets size={18} className="text-blue-500" />
                  <h3 className="font-semibold text-slate-700">Micro-Leak Detection</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{microLeaks.length} found</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {microLeaks.map((leak, i) => <MicroLeakCard key={leak.merchant} leak={leak} rank={i + 1} />)}
                </div>
              </div>
            )}

            {agentPlans.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-700 mb-3">Savings Plans</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {agentPlans.map((plan, i) => (
                    <div key={plan.id} className={`rounded-xl border p-4 ${i === 1 ? 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-200 bg-white'}`}>
                      {i === 1 && <div className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-wide">Recommended</div>}
                      <h4 className="font-bold text-slate-800 mb-1">{plan.title}</h4>
                      <p className="text-xs text-slate-500 mb-3">{plan.explanation}</p>
                      <div className="text-2xl font-bold text-emerald-600 mb-3">${plan.totalMonthlySavings}/mo</div>
                      <div className="space-y-1 text-xs text-slate-600 mb-3">
                        <div>Stress score: {plan.projectedStressScore}/100</div>
                        <div>Runway: {plan.projectedRunway} months</div>
                        <div>Confidence: {(plan.confidence * 100).toFixed(0)}%</div>
                      </div>
                      <div className="space-y-1">
                        {plan.actions.slice(0, 3).map(action => (
                          <div key={action.merchant} className="flex items-center justify-between text-xs bg-white rounded p-2">
                            <span className="truncate">{action.merchant}</span>
                            <span className="text-emerald-600 font-semibold ml-2">-${action.monthlySavings.toFixed(0)}</span>
                          </div>
                        ))}
                        {plan.actions.length > 3 && <p className="text-xs text-slate-400 pl-2">+{plan.actions.length - 3} more</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'anomalies' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-800">Spending Anomalies</h2>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{anomalies.length} detected</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-800 mb-3">Balance History with Anomaly Markers</h3>
              <BalanceTimeline transactions={transactions} anomalies={anomalies} />
              <p className="text-xs text-slate-400 mt-2">Red dots indicate anomalous transactions</p>
            </div>

            {anomalies.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <CheckCircle size={36} className="mx-auto mb-3 text-emerald-500" />
                <p className="font-medium">No anomalies detected!</p>
                <p className="text-sm">Your spending patterns look consistent.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {anomalies.map((anomaly, i) => <AnomalyCard key={i} anomaly={anomaly} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
