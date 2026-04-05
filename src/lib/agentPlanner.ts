import type { FinancialVitals, MicroLeak, BufferSimulation } from './analytics';

export interface SavingsAction {
  type: 'reduce' | 'eliminate' | 'defer';
  merchant: string;
  category: string;
  currentSpend: number;
  targetSpend: number;
  monthlySavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SavingsPlan {
  id: string;
  title: string;
  actions: SavingsAction[];
  totalMonthlySavings: number;
  projectedStressScore: number;
  projectedRunway: number;
  overdraftRiskAfter: number;
  confidence: number;
  explanation: string;
}

function evaluatePlan(
  actions: SavingsAction[],
  vitals: FinancialVitals,
  simulation: BufferSimulation
): Omit<SavingsPlan, 'id' | 'title' | 'actions' | 'explanation'> {
  const totalSavings = actions.reduce((s, a) => s + a.monthlySavings, 0);
  const newMonthlyExpenses = vitals.monthlyExpenses - totalSavings;
  const newSavingsRate = vitals.monthlyIncome > 0
    ? ((vitals.monthlyIncome - newMonthlyExpenses) / vitals.monthlyIncome) * 100
    : 0;
  const projectedBalance = vitals.currentBalance + totalSavings * 3;
  const projectedRunway = newMonthlyExpenses > 0 ? projectedBalance / newMonthlyExpenses : 0;
  const overdraftRiskAfter = Math.max(0, simulation.overdraftProb30Days - (totalSavings / vitals.monthlyExpenses) * 20);
  const projectedStressScore = Math.max(0, vitals.stressScore.value - (newSavingsRate > 15 ? 20 : newSavingsRate > 5 ? 10 : 0));
  const difficulty = actions.filter(a => a.difficulty === 'hard').length;
  const confidence = Math.max(0.5, 0.9 - difficulty * 0.1);

  return {
    totalMonthlySavings: Math.round(totalSavings),
    projectedStressScore,
    projectedRunway: Math.round(projectedRunway * 10) / 10,
    overdraftRiskAfter: Math.round(overdraftRiskAfter * 10) / 10,
    confidence,
  };
}

export async function runAgentPlanner(
  vitals: FinancialVitals,
  microLeaks: MicroLeak[],
  simulation: BufferSimulation,
): Promise<SavingsPlan[]> {
  if (microLeaks.length === 0) return [];

  const allActions: SavingsAction[] = microLeaks.map(leak => ({
    type: (leak.monthlySavingsPotential / leak.monthlyTotal > 0.5 ? 'eliminate' : 'reduce') as 'reduce' | 'eliminate' | 'defer',
    merchant: leak.merchant,
    category: leak.category,
    currentSpend: leak.monthlyTotal,
    targetSpend: leak.monthlyTotal - leak.monthlySavingsPotential,
    monthlySavings: leak.monthlySavingsPotential,
    difficulty: leak.monthlyTotal > 60 ? 'hard' : leak.monthlyTotal > 30 ? 'medium' : 'easy',
  }));

  const easyActions = allActions.filter(a => a.difficulty === 'easy');
  const mediumActions = allActions.filter(a => a.difficulty === 'medium');
  const hardActions = allActions.filter(a => a.difficulty === 'hard');

  const plan1Actions = [...easyActions];
  const plan2Actions = [...easyActions, ...mediumActions.slice(0, 2)];
  const plan3Actions = [...easyActions, ...mediumActions, ...hardActions.slice(0, 1)];

  const plans: SavingsPlan[] = [
    {
      id: 'plan-conservative',
      title: 'Quick Wins',
      actions: plan1Actions,
      explanation: 'Focus on easy cuts with minimal lifestyle impact. Great starting point.',
      ...evaluatePlan(plan1Actions, vitals, simulation),
    },
    {
      id: 'plan-balanced',
      title: 'Balanced Approach',
      actions: plan2Actions,
      explanation: 'Combines easy wins with moderate reductions for meaningful savings.',
      ...evaluatePlan(plan2Actions, vitals, simulation),
    },
    {
      id: 'plan-aggressive',
      title: 'Aggressive Savings',
      actions: plan3Actions,
      explanation: 'Maximum savings through significant lifestyle adjustments.',
      ...evaluatePlan(plan3Actions, vitals, simulation),
    },
  ];

  return plans.filter(p => p.actions.length > 0);
}
