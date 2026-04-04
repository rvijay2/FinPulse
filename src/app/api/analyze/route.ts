import { NextRequest, NextResponse } from 'next/server';
import { parseCSV, computeVitals, detectAnomalies, detectRecurring, runMonteCarloSimulation, detectMicroLeaks } from '@/lib/analytics';
import { runAgentPlanner } from '@/lib/agentPlanner';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csvText, schema = 'chase' } = body;
    
    if (!csvText) {
      return NextResponse.json({ error: 'csvText is required' }, { status: 400 });
    }
    
    const transactions = parseCSV(csvText, schema);
    if (transactions.length === 0) {
      return NextResponse.json({ error: 'No valid transactions found' }, { status: 400 });
    }
    
    const vitals = computeVitals(transactions);
    const anomalies = detectAnomalies(transactions);
    const recurring = detectRecurring(transactions);
    const simulation = runMonteCarloSimulation(transactions, vitals.currentBalance);
    const microLeaks = detectMicroLeaks(transactions);
    const agentPlans = await runAgentPlanner(vitals, microLeaks, simulation);
    
    return NextResponse.json({
      vitals,
      anomalies,
      recurring,
      simulation,
      microLeaks,
      agentPlans,
      transactions: transactions.map(t => ({ ...t, date: t.date.toISOString() })),
    });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
