export interface Transaction {
  date: Date;
  description: string;
  amount: number;
  balance: number;
  category: string;
}

export interface VitalSign {
  name: string;
  value: number;
  unit: string;
  status: 'critical' | 'warning' | 'good';
  target: string;
  description: string;
  trend: number;
}

export interface FinancialVitals {
  savingsRate: VitalSign;
  debtToIncome: VitalSign;
  emergencyRunway: VitalSign;
  expenseVolatility: VitalSign;
  stressScore: VitalSign;
  monthlyIncome: number;
  monthlyExpenses: number;
  currentBalance: number;
  period: { start: Date; end: Date };
}

export interface Anomaly {
  transaction: Transaction;
  zscore: number;
  explanation: string;
  severity: 'high' | 'medium' | 'low';
}

export interface RecurringCharge {
  merchant: string;
  avgAmount: number;
  frequency: 'monthly' | 'weekly' | 'biweekly';
  isDebtLike: boolean;
  category: string;
}

export interface BufferSimulation {
  overdraftProb14Days: number;
  overdraftProb30Days: number;
  minBalance14: number;
  minBalance30: number;
  riskWindows: { date: Date; prob: number }[];
  monteCarloPaths: number[][];
  autoBufferPlan: {
    dailySavings: number;
    monthlySavings: number;
    targetBalance: number;
    projectedRiskAfter: number;
  };
}

export interface MicroLeak {
  merchant: string;
  monthlyTotal: number;
  count: number;
  avgAmount: number;
  category: string;
  suggestion: string;
  monthlySavingsPotential: number;
  confidence: number;
}

export const SCHEMA_MAPPINGS: Record<string, { date: string; description: string; amount: string; balance: string }> = {
  chase: { date: 'Date', description: 'Description', amount: 'Amount', balance: 'Running Balance' },
  boa: { date: 'Date', description: 'Description', amount: 'Amount', balance: 'Balance' },
  wellsfargo: { date: 'Date', description: 'Description', amount: 'Amount', balance: 'Balance' },
  generic: { date: 'Date', description: 'Description', amount: 'Amount', balance: 'Balance' },
};

export function categorizeTransaction(description: string): string {
  const desc = description.toLowerCase();
  if (/starbucks|coffee|dunkin|peet/.test(desc)) return 'Coffee';
  if (/chipotle|mcdonalds|subway|dominos|pizza|taco|burger|wendys|kfc|chick/.test(desc)) return 'Dining';
  if (/whole foods|trader joe|kroger|safeway|walmart|target|grocery/.test(desc)) return 'Groceries';
  if (/uber|lyft|transit|metro|bus|train/.test(desc)) return 'Transportation';
  if (/netflix|spotify|hulu|disney|amazon prime|apple/.test(desc)) return 'Subscriptions';
  if (/rent|lease|apartment/.test(desc)) return 'Rent';
  if (/electric|gas|water|internet|comcast|at&t|verizon|utility/.test(desc)) return 'Utilities';
  if (/direct dep|payroll|paycheck|campus jobs/.test(desc)) return 'Income';
  if (/amazon|best buy|apple store/.test(desc)) return 'Shopping';
  if (/venmo|zelle|cashapp|paypal/.test(desc)) return 'Transfer';
  return 'Other';
}

export function parseCSV(csvText: string, schema = 'chase'): Transaction[] {
  const mapping = SCHEMA_MAPPINGS[schema] || SCHEMA_MAPPINGS.generic;
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const getIdx = (col: string) => headers.findIndex(h => h.toLowerCase() === col.toLowerCase());
  const dateIdx = getIdx(mapping.date);
  const descIdx = getIdx(mapping.description);
  const amtIdx = getIdx(mapping.amount);
  const balIdx = getIdx(mapping.balance);
  
  const transactions: Transaction[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { fields.push(current.trim()); current = ''; }
      else { current += char; }
    }
    fields.push(current.trim());
    
    if (fields.length < 3) continue;
    
    const dateStr = dateIdx >= 0 ? fields[dateIdx] : fields[0];
    const desc = descIdx >= 0 ? fields[descIdx] : fields[1];
    const amtStr = amtIdx >= 0 ? fields[amtIdx] : fields[2];
    const balStr = balIdx >= 0 && balIdx < fields.length ? fields[balIdx] : '0';
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) continue;
    
    const amount = parseFloat(amtStr.replace(/[$,]/g, ''));
    const balance = parseFloat(balStr.replace(/[$,]/g, ''));
    
    if (isNaN(amount)) continue;
    
    transactions.push({
      date,
      description: desc,
      amount,
      balance: isNaN(balance) ? 0 : balance,
      category: categorizeTransaction(desc),
    });
  }
  
  return transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function computeVitals(transactions: Transaction[]): FinancialVitals {
  if (transactions.length === 0) {
    const empty: VitalSign = { name: '', value: 0, unit: '', status: 'warning', target: '', description: '', trend: 0 };
    return {
      savingsRate: { ...empty, name: 'Savings Rate' },
      debtToIncome: { ...empty, name: 'Debt-to-Income' },
      emergencyRunway: { ...empty, name: 'Emergency Runway' },
      expenseVolatility: { ...empty, name: 'Expense Volatility' },
      stressScore: { ...empty, name: 'Stress Score' },
      monthlyIncome: 0, monthlyExpenses: 0, currentBalance: 0,
      period: { start: new Date(), end: new Date() },
    };
  }

  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const start = sorted[0].date;
  const end = sorted[sorted.length - 1].date;
  
  const monthlyData: Record<string, { income: number; expenses: number }> = {};
  for (const t of sorted) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[key]) monthlyData[key] = { income: 0, expenses: 0 };
    if (t.amount > 0) monthlyData[key].income += t.amount;
    else monthlyData[key].expenses += Math.abs(t.amount);
  }
  
  const months = Object.values(monthlyData);
  const numMonths = Math.max(months.length, 1);
  
  const totalIncome = months.reduce((s, m) => s + m.income, 0);
  const totalExpenses = months.reduce((s, m) => s + m.expenses, 0);
  const avgMonthlyIncome = totalIncome / numMonths;
  const avgMonthlyExpenses = totalExpenses / numMonths;
  
  const monthKeys = Object.keys(monthlyData).sort();
  const recentMonth = monthKeys.length > 0 ? monthlyData[monthKeys[monthKeys.length - 1]] : { income: avgMonthlyIncome, expenses: avgMonthlyExpenses };
  const prevMonth = monthKeys.length > 1 ? monthlyData[monthKeys[monthKeys.length - 2]] : recentMonth;
  
  const savingsRateVal = avgMonthlyIncome > 0 ? ((avgMonthlyIncome - avgMonthlyExpenses) / avgMonthlyIncome) * 100 : 0;
  const prevSavingsRate = prevMonth.income > 0 ? ((prevMonth.income - prevMonth.expenses) / prevMonth.income) * 100 : 0;
  const currSavingsRate = recentMonth.income > 0 ? ((recentMonth.income - recentMonth.expenses) / recentMonth.income) * 100 : 0;
  
  const debtLikeCategories = ['Rent', 'Utilities', 'Subscriptions'];
  const monthlyDebt = sorted
    .filter(t => t.amount < 0 && debtLikeCategories.includes(t.category))
    .reduce((s, t) => s + Math.abs(t.amount), 0) / numMonths;
  const dtiVal = avgMonthlyIncome > 0 ? (monthlyDebt / avgMonthlyIncome) * 100 : 0;
  
  const currentBalance = sorted[sorted.length - 1].balance;
  const runwayVal = avgMonthlyExpenses > 0 ? currentBalance / avgMonthlyExpenses : 0;
  
  const expenseValues = months.map(m => m.expenses);
  const meanExp = expenseValues.reduce((s, v) => s + v, 0) / expenseValues.length;
  const stdExp = expenseValues.length > 1
    ? Math.sqrt(expenseValues.reduce((s, v) => s + Math.pow(v - meanExp, 2), 0) / (expenseValues.length - 1))
    : 0;
  const volatilityVal = meanExp > 0 ? (stdExp / meanExp) * 100 : 0;
  
  const srScore = Math.max(0, Math.min(100, (1 - savingsRateVal / 30) * 25));
  const dtiScore = Math.max(0, Math.min(100, (dtiVal / 50) * 25));
  const runwayScore = Math.max(0, Math.min(100, Math.max(0, (3 - runwayVal) / 3) * 25));
  const volScore = Math.max(0, Math.min(100, (volatilityVal / 60) * 25));
  const stressVal = srScore + dtiScore + runwayScore + volScore;
  
  const getStatus = (value: number, thresholds: { critical: number; warning: number }, inverse = false): 'critical' | 'warning' | 'good' => {
    if (inverse) {
      if (value > thresholds.critical) return 'critical';
      if (value > thresholds.warning) return 'warning';
      return 'good';
    } else {
      if (value < thresholds.critical) return 'critical';
      if (value < thresholds.warning) return 'warning';
      return 'good';
    }
  };
  
  const trendPct = (curr: number, prev: number) => prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : 0;
  
  return {
    savingsRate: {
      name: 'Savings Rate',
      value: Math.round(savingsRateVal * 10) / 10,
      unit: '%',
      status: getStatus(savingsRateVal, { critical: 5, warning: 15 }),
      target: '>15%',
      description: 'Percentage of income saved after expenses',
      trend: trendPct(currSavingsRate, prevSavingsRate),
    },
    debtToIncome: {
      name: 'Debt-to-Income',
      value: Math.round(dtiVal * 10) / 10,
      unit: '%',
      status: getStatus(dtiVal, { critical: 36, warning: 20 }, true),
      target: '<20%',
      description: 'Fixed recurring obligations as % of income',
      trend: 0,
    },
    emergencyRunway: {
      name: 'Emergency Runway',
      value: Math.round(runwayVal * 10) / 10,
      unit: 'mo',
      status: getStatus(runwayVal, { critical: 1, warning: 3 }),
      target: '>3 months',
      description: 'How long current balance covers monthly expenses',
      trend: trendPct(currentBalance, sorted.length > 30 ? sorted[sorted.length - 30].balance : sorted[0].balance),
    },
    expenseVolatility: {
      name: 'Expense Volatility',
      value: Math.round(volatilityVal * 10) / 10,
      unit: '%',
      status: getStatus(volatilityVal, { critical: 50, warning: 25 }, true),
      target: '<25%',
      description: 'Month-to-month variation in spending',
      trend: 0,
    },
    stressScore: {
      name: 'Stress Score',
      value: Math.round(stressVal),
      unit: '/100',
      status: getStatus(stressVal, { critical: 70, warning: 40 }, true),
      target: '<40',
      description: 'Composite financial health score (lower is better)',
      trend: 0,
    },
    monthlyIncome: Math.round(avgMonthlyIncome),
    monthlyExpenses: Math.round(avgMonthlyExpenses),
    currentBalance: Math.round(currentBalance),
    period: { start, end },
  };
}

export function detectAnomalies(transactions: Transaction[]): Anomaly[] {
  const expenses = transactions.filter(t => t.amount < 0);
  if (expenses.length < 5) return [];
  
  const amounts = expenses.map(t => Math.abs(t.amount));
  const sorted = [...amounts].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const madArr = amounts.map(v => Math.abs(v - median)).sort((a, b) => a - b);
  const mad = madArr[Math.floor(madArr.length / 2)];
  const madScaled = mad * 1.4826;
  
  const anomalies: Anomaly[] = [];
  for (const t of expenses) {
    const absAmt = Math.abs(t.amount);
    const zscore = madScaled > 0 ? (absAmt - median) / madScaled : 0;
    if (zscore > 2.5) {
      const severity: 'high' | 'medium' | 'low' = zscore > 4 ? 'high' : zscore > 3 ? 'medium' : 'low';
      anomalies.push({
        transaction: t,
        zscore: Math.round(zscore * 10) / 10,
        explanation: `This ${t.category} charge of $${absAmt.toFixed(2)} is ${zscore.toFixed(1)}x larger than your typical spending`,
        severity,
      });
    }
  }
  
  return anomalies.sort((a, b) => b.zscore - a.zscore);
}

export function detectRecurring(transactions: Transaction[]): RecurringCharge[] {
  const merchantMap: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    if (t.amount >= 0) continue;
    const upper = t.description.toUpperCase();
    const spaceDigitIdx = upper.search(/ \d/);
    const key = (spaceDigitIdx >= 0 ? upper.slice(0, spaceDigitIdx) : upper).trim().slice(0, 20);
    if (!merchantMap[key]) merchantMap[key] = [];
    merchantMap[key].push(t);
  }
  
  const recurring: RecurringCharge[] = [];
  for (const [merchant, txns] of Object.entries(merchantMap)) {
    if (txns.length < 2) continue;
    const amounts = txns.map(t => Math.abs(t.amount));
    const avgAmt = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    const stdAmt = Math.sqrt(amounts.reduce((s, v) => s + Math.pow(v - avgAmt, 2), 0) / amounts.length);
    const cv = avgAmt > 0 ? stdAmt / avgAmt : 1;
    if (cv > 0.5) continue;
    
    const sortedTxns = txns.sort((a, b) => a.date.getTime() - b.date.getTime());
    const gaps: number[] = [];
    for (let i = 1; i < sortedTxns.length; i++) {
      gaps.push((sortedTxns[i].date.getTime() - sortedTxns[i-1].date.getTime()) / (1000 * 60 * 60 * 24));
    }
    const avgGap = gaps.reduce((s, v) => s + v, 0) / gaps.length;
    
    let frequency: 'monthly' | 'weekly' | 'biweekly' = 'monthly';
    if (avgGap < 10) frequency = 'weekly';
    else if (avgGap < 20) frequency = 'biweekly';
    
    const category = categorizeTransaction(merchant);
    recurring.push({
      merchant: merchant.slice(0, 30),
      avgAmount: Math.round(avgAmt * 100) / 100,
      frequency,
      isDebtLike: ['Rent', 'Utilities', 'Subscriptions'].includes(category),
      category,
    });
  }
  
  return recurring.sort((a, b) => b.avgAmount - a.avgAmount);
}

export function runMonteCarloSimulation(transactions: Transaction[], currentBalance: number): BufferSimulation {
  const expenses = transactions.filter(t => t.amount < 0);
  const income = transactions.filter(t => t.amount > 0);
  
  const first = transactions[0];
  const last = transactions[transactions.length - 1];
  const numDays = first && last
    ? Math.max((last.date.getTime() - first.date.getTime()) / (1000 * 60 * 60 * 24), 30)
    : 30;
  const dailyExpMean = expenses.reduce((s, t) => s + Math.abs(t.amount), 0) / numDays;
  const dailyExpStd = dailyExpMean * 0.4;
  const dailyIncMean = income.reduce((s, t) => s + t.amount, 0) / numDays;
  
  const N = 500;
  const paths14: number[][] = [];
  const paths30: number[][] = [];
  const samplePaths: number[][] = [];
  
  for (let sim = 0; sim < N; sim++) {
    let bal14 = currentBalance;
    let bal30 = currentBalance;
    const path: number[] = [currentBalance];
    
    for (let d = 0; d < 30; d++) {
      const dailyExp = Math.max(0, dailyExpMean + dailyExpStd * (Math.random() * 2 - 1) * 1.732);
      const dailyInc = Math.random() < (dailyIncMean / 60) ? dailyIncMean * 14 : 0;
      const dailyNet = dailyInc - dailyExp;
      
      if (d < 14) bal14 += dailyNet;
      bal30 += dailyNet;
      path.push(Math.max(bal30, -500));
    }
    
    paths14.push([bal14]);
    paths30.push([bal30]);
    if (sim < 50) samplePaths.push(path);
  }
  
  const overdraft14 = paths14.filter(p => p[0] < 0).length / N;
  const overdraft30 = paths30.filter(p => p[0] < 0).length / N;
  const min14 = Math.min(...paths14.map(p => p[0]));
  const min30 = Math.min(...paths30.map(p => p[0]));
  
  const riskWindows: { date: Date; prob: number }[] = [];
  for (let d = 1; d <= 30; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    const prob = d <= 14 ? overdraft14 * (d / 14) : overdraft30 * (d / 30);
    riskWindows.push({ date, prob });
  }
  
  const targetBalance = dailyExpMean * 30;
  const gap = Math.max(0, targetBalance - currentBalance);
  const dailySavings = gap / 90;
  
  return {
    overdraftProb14Days: Math.round(overdraft14 * 1000) / 10,
    overdraftProb30Days: Math.round(overdraft30 * 1000) / 10,
    minBalance14: Math.round(min14),
    minBalance30: Math.round(min30),
    riskWindows,
    monteCarloPaths: samplePaths.slice(0, 30),
    autoBufferPlan: {
      dailySavings: Math.round(dailySavings * 100) / 100,
      monthlySavings: Math.round(dailySavings * 30 * 100) / 100,
      targetBalance: Math.round(targetBalance),
      projectedRiskAfter: Math.max(0, overdraft30 - 0.05),
    },
  };
}

export function detectMicroLeaks(transactions: Transaction[]): MicroLeak[] {
  const merchantMap: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    if (t.amount >= 0) continue;
    const upper = t.description.toUpperCase();
    const spaceDigitIdx = upper.search(/ \d/);
    const key = (spaceDigitIdx >= 0 ? upper.slice(0, spaceDigitIdx) : upper).trim().slice(0, 25);
    if (!merchantMap[key]) merchantMap[key] = [];
    merchantMap[key].push(t);
  }
  
  const first = transactions[0];
  const last = transactions[transactions.length - 1];
  const numMonths = first && last
    ? Math.max((last.date.getTime() - first.date.getTime()) / (1000 * 60 * 60 * 24 * 30), 1)
    : 1;
  
  const leaks: MicroLeak[] = [];
  for (const [merchant, txns] of Object.entries(merchantMap)) {
    if (txns.length < 3) continue;
    const amounts = txns.map(t => Math.abs(t.amount));
    const avgAmt = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    if (avgAmt > 50) continue;
    
    const monthlyTotal = amounts.reduce((s, v) => s + v, 0) / numMonths;
    if (monthlyTotal < 10) continue;
    
    const category = categorizeTransaction(merchant);
    const savingsPotential = category === 'Coffee' ? monthlyTotal * 0.5 :
      category === 'Dining' ? monthlyTotal * 0.3 : monthlyTotal * 0.2;
    
    const suggestion = category === 'Coffee' ? 'Brew at home to cut this in half' :
      category === 'Dining' ? 'Meal prep to reduce takeout frequency' :
      category === 'Subscriptions' ? 'Review if actively used' :
      'Consider reducing frequency';
    
    leaks.push({
      merchant: merchant.slice(0, 30),
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      count: txns.length,
      avgAmount: Math.round(avgAmt * 100) / 100,
      category,
      suggestion,
      monthlySavingsPotential: Math.round(savingsPotential * 100) / 100,
      confidence: Math.min(0.95, 0.6 + txns.length * 0.05),
    });
  }
  
  return leaks.sort((a, b) => b.monthlyTotal - a.monthlyTotal).slice(0, 8);
}
