# FinPulse — Financial Vital Signs

> **Know your financial health at a glance.** FinPulse turns a plain bank CSV into a complete financial health dashboard: vital signs, emergency runway, anomaly detection, micro-leak finder, and an AI-generated assessment — all running client-side or on your own server.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Financial Vital Signs** | Savings rate, debt-to-income proxy, emergency runway, expense volatility, and a composite Financial Stress Score (0–100) |
| **Health Radar** | Spider/radar chart showing all 5 vitals at a glance, fitness-app style |
| **Balance Timeline** | Interactive line chart with anomaly markers |
| **Emergency Buffer Autopilot** | Monte Carlo simulation (500 paths, 14- and 30-day horizon) with overdraft risk gauges and an auto micro-savings plan |
| **Anomaly Detection (Financial EKG)** | MAD-based robust Z-score flags unusual transactions with explanations |
| **Invisible Savings Assistant** | Detects micro-leaks (small frequent charges) and proposes actionable savings with confidence + monthly impact |
| **Agentic Savings Planner** | Server-side planner that iteratively proposes and evaluates three candidate savings plans (conservative / balanced / aggressive) |
| **AI Doctor Note** | Grounded financial narrative — uses OpenAI GPT-4o-mini when `OPENAI_API_KEY` is set, otherwise a local fallback |

---

## 🗂 Repository layout

```
FinPulse/
├── public/data/
│   └── sample_transactions.csv   ← pre-generated 120-day student dataset
├── scripts/
│   └── generate-sample-data.ts   ← re-generate the sample CSV
├── src/
│   ├── app/
│   │   ├── page.tsx              ← landing page (upload or sample data)
│   │   ├── dashboard/page.tsx    ← 4-tab dashboard
│   │   └── api/
│   │       ├── analyze/route.ts  ← POST /api/analyze (CSV → metrics)
│   │       └── doctor-note/route.ts
│   ├── components/               ← charts, vitals, anomalies, buffer, savings
│   ├── context/AnalyticsContext.tsx
│   └── lib/
│       ├── analytics.ts          ← all metrics + simulation logic
│       └── agentPlanner.ts       ← agentic savings planner
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🚀 Running locally

### Prerequisites
- Node.js ≥ 18

```bash
git clone https://github.com/rvijay2/FinPulse.git
cd FinPulse
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).  
Click **Try with Sample Student Data** to explore immediately, or drag-and-drop your own bank CSV.

---

## 🐳 Running with Docker

```bash
# optional: set your OpenAI key in .env or export it first
docker-compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📁 Replacing the sample dataset

The pre-built sample lives at `public/data/sample_transactions.csv`. You can replace it in two ways:

### Option A — Drag and drop in the UI
Upload your own bank export directly on the landing page. Supported schemas:

| Bank | Date | Description | Amount | Balance column |
|---|---|---|---|---|
| **Chase** | `Date` | `Description` | `Amount` | `Running Balance` |
| **Bank of America** | `Date` | `Description` | `Amount` | `Balance` |
| **Wells Fargo** | `Date` | `Description` | `Amount` | `Balance` |
| **Generic** | `Date` | `Description` | `Amount` | `Balance` |

### Option B — Regenerate the sample CSV
```bash
npx tsx scripts/generate-sample-data.ts
# OR
npx ts-node --esm scripts/generate-sample-data.ts
```
This overwrites `public/data/sample_transactions.csv` with a fresh 120-day dataset.

---

## 🔑 Environment variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | No | Enables GPT-4o-mini AI doctor note. Falls back to local narrative when absent. |

Create a `.env.local` at the project root:
```
OPENAI_API_KEY=sk-...
```

---

## 🧱 Tech stack

- **Next.js 14** (App Router) + TypeScript
- **TailwindCSS** for styling
- **shadcn/ui** component primitives
- **Recharts** for all charts (radar, area, line, sparklines)
- **All analytics in TypeScript** — no Python, no external ML services

---

## 📊 Vital sign thresholds

| Vital | Critical | Warning | Good |
|---|---|---|---|
| Savings Rate | < 5 % | 5–15 % | > 15 % |
| Debt-to-Income proxy | > 36 % | 20–36 % | < 20 % |
| Emergency Runway | < 1 month | 1–3 months | > 3 months |
| Expense Volatility | > 50 % CV | 25–50 % | < 25 % |
| Financial Stress Score | > 70 | 40–70 | < 40 |
