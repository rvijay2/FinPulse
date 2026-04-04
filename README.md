# FinPulse — Financial Vital Signs

FinPulse is a Next.js web application that analyzes your bank statement CSV and surfaces key financial health metrics — savings rate, emergency runway, overdraft risk, spending anomalies, and micro-leaks — in a single dashboard.

## Features

- **Financial Vital Signs**: Savings rate, debt-to-income ratio, emergency runway, expense volatility, and composite stress score
- **Balance Timeline**: Interactive chart of your account balance with anomaly markers
- **Emergency Buffer Analysis**: Monte Carlo simulation (500 paths, 30-day horizon) with overdraft risk gauges and auto-savings plan
- **Anomaly Detection**: MAD-based Z-score flagging of unusual transactions
- **Micro-Leak Detection**: Identifies small recurring spending patterns with savings potential
- **Savings Plans**: Three AI-generated savings plans (conservative / balanced / aggressive)
- **AI Assessment**: Doctor-note style narrative (uses OpenAI if `OPENAI_API_KEY` is set, otherwise local fallback)

## Supported CSV Formats

- Chase (`Date`, `Description`, `Amount`, `Running Balance`)
- Bank of America (`Date`, `Description`, `Amount`, `Balance`)
- Wells Fargo (`Date`, `Description`, `Amount`, `Balance`)
- Generic (same column names as BofA/WF)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Upload a bank statement CSV or click **Try with Sample Student Data** to explore with pre-generated data.

## Environment Variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | (Optional) Enables GPT-4o-mini financial narrative. Falls back to local if unset. |

## Docker

```bash
docker-compose up --build
```

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **TailwindCSS** for styling
- **Recharts** for charts (radar, area, line)
- **All analytics in TypeScript** — no Python required
