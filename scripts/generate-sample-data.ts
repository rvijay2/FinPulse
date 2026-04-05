/**
 * generate-sample-data.ts
 * Generates a realistic student bank transaction CSV (Chase-style schema).
 *
 * Run with:
 *   npx ts-node --esm scripts/generate-sample-data.ts
 *   -- OR (if ts-node not available) --
 *   npx tsx scripts/generate-sample-data.ts
 */
import * as fs from 'fs';
import * as path from 'path';

interface RawTransaction {
  date: Date;
  description: string;
  amount: number;
}

function fmtDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function rand(min: number, max: number, decimals = 2): number {
  const v = min + Math.random() * (max - min);
  return parseFloat(v.toFixed(decimals));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Generate raw events ───────────────────────────────────────────────────────

const START = new Date();
START.setDate(START.getDate() - 130);

const events: RawTransaction[] = [];

const DAYS = 130;

for (let i = 0; i < DAYS; i++) {
  const day = addDays(START, i);
  const dom = day.getDate(); // day-of-month
  const dow = day.getDay(); // 0=Sun, 6=Sat

  // ── Income ──────────────────────────────────────────────────────────────────
  // Bi-weekly paychecks on the 1st and 15th
  if (dom === 1 || dom === 15) {
    events.push({ date: day, description: 'DIRECT DEP CAMPUS JOBS', amount: rand(820, 880) });
  }

  // ── Rent (1st of month) ───────────────────────────────────────────────────
  if (dom === 1) {
    events.push({ date: day, description: 'RENT PAYMENT VENMO', amount: -650 });
  }

  // ── Utilities (5th of month) ──────────────────────────────────────────────
  if (dom === 5) {
    events.push({ date: day, description: 'ELECTRIC UTILITY CO', amount: -rand(38, 52) });
    events.push({ date: day, description: 'INTERNET COMCAST', amount: -30 });
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────
  if (dom === 1) events.push({ date: day, description: 'NETFLIX SUBSCRIPTION', amount: -15.99 });
  if (dom === 3) events.push({ date: day, description: 'SPOTIFY PREMIUM', amount: -9.99 });
  if (dom === 7) events.push({ date: day, description: 'HULU SUBSCRIPTION', amount: -13.99 });

  // ── Coffee (most weekdays) ────────────────────────────────────────────────
  if (dow >= 1 && dow <= 5 && Math.random() < 0.75) {
    events.push({
      date: day,
      description: pick(['STARBUCKS #4521', 'STARBUCKS #7832', 'DUNKIN #221', 'DUTCH BROS']),
      amount: -rand(5, 9),
    });
  }

  // ── Dining (most days) ───────────────────────────────────────────────────
  if (Math.random() < 0.65) {
    events.push({
      date: day,
      description: pick([
        'CHIPOTLE #892', 'MCDONALDS #1234', 'SUBWAY #445', 'TACO BELL #221',
        'DOMINOS PIZZA', 'CHICK-FIL-A #33', 'WENDYS #5512', 'PANDA EXPRESS',
        'FIVE GUYS #88', 'PANERA BREAD',
      ]),
      amount: -rand(9, 22),
    });
  }

  // ── Groceries (2-3x per week, mainly on weekends + Wed) ──────────────────
  if ((dow === 0 || dow === 3 || dow === 6) && Math.random() < 0.7) {
    events.push({
      date: day,
      description: pick(['WHOLE FOODS MARKET', 'TRADER JOES #45', 'KROGER #892', 'ALDI', 'WALMART GROCERY']),
      amount: -rand(22, 72),
    });
  }

  // ── Transportation (2-3x per week) ────────────────────────────────────────
  if (Math.random() < 0.4) {
    events.push({
      date: day,
      description: pick(['UBER TRIP', 'LYFT RIDE', 'UBER EATS', 'METRO TRANSIT']),
      amount: -rand(12, 42),
    });
  }
}

// ── Anomalies (sprinkled in) ──────────────────────────────────────────────────
const anomalyDays = [25, 55, 90, 115];
const anomalies: RawTransaction[] = [
  { date: addDays(START, anomalyDays[0]), description: 'AMAZON PURCHASE', amount: -rand(160, 200) },
  { date: addDays(START, anomalyDays[1]), description: 'BEST BUY #4412', amount: -rand(220, 260) },
  { date: addDays(START, anomalyDays[2]), description: 'APPLE STORE ONLINE', amount: -rand(130, 175) },
  { date: addDays(START, anomalyDays[3]), description: 'EMERGENCY MEDICAL', amount: -rand(280, 340) },
];
events.push(...anomalies);

// ── Sort by date ──────────────────────────────────────────────────────────────
events.sort((a, b) => a.date.getTime() - b.date.getTime());

// ── Compute running balance ───────────────────────────────────────────────────
let balance = 1250.00;
const rows: string[] = ['Date,Description,Amount,Running Balance'];

for (const ev of events) {
  balance = parseFloat((balance + ev.amount).toFixed(2));
  // Prevent negative balance (simulate a safety deposit occasionally)
  if (balance < 50) balance += 300;
  const amount = ev.amount > 0
    ? ev.amount.toFixed(2)
    : ev.amount.toFixed(2);
  rows.push(`${fmtDate(ev.date)},"${ev.description}",${amount},${balance.toFixed(2)}`);
}

// ── Write file ────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, '../public/data/sample_transactions.csv');
fs.writeFileSync(outPath, rows.join('\n'), 'utf8');
console.log(`✅  Wrote ${rows.length - 1} transactions → ${outPath}`);

