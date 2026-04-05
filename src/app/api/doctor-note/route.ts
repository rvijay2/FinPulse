import { NextRequest, NextResponse } from 'next/server';

interface VitalsMetrics {
  savingsRate?: { value?: number; status?: string };
  stressScore?: { value?: number; status?: string };
  emergencyRunway?: { value?: number; status?: string };
  debtToIncome?: { value?: number; status?: string };
}

function generateLocalNarrative(vitals: VitalsMetrics): string {
  const sr = vitals?.savingsRate?.value ?? 0;
  const stress = vitals?.stressScore?.value ?? 50;
  const runway = vitals?.emergencyRunway?.value ?? 0;
  const dti = vitals?.debtToIncome?.value ?? 0;
  
  let assessment = '';
  if (stress < 40) assessment = 'Your finances are in good health.';
  else if (stress < 70) assessment = 'Your finances show some areas for improvement.';
  else assessment = 'Your finances need immediate attention.';
  
  const findings: string[] = [];
  if (sr < 5) findings.push(`Your savings rate of ${sr.toFixed(1)}% is critically low — target 15%+.`);
  else if (sr < 15) findings.push(`Your savings rate of ${sr.toFixed(1)}% has room to grow — aim for 15%+.`);
  else findings.push(`Great savings rate of ${sr.toFixed(1)}%!`);
  
  if (runway < 1) findings.push(`Emergency runway of ${runway.toFixed(1)} months is dangerously low.`);
  else if (runway < 3) findings.push(`Your ${runway.toFixed(1)}-month emergency runway needs strengthening.`);
  else findings.push(`Healthy emergency runway of ${runway.toFixed(1)} months.`);
  
  if (dti > 36) findings.push(`Debt-to-income ratio of ${dti.toFixed(1)}% exceeds recommended limits.`);
  else findings.push(`Debt-to-income ratio of ${dti.toFixed(1)}% is manageable.`);
  
  return `**Financial Health Assessment**\n\n${assessment}\n\n**Key Findings:**\n${findings.map(f => `• ${f}`).join('\n')}\n\n**Recommendation:** ${stress > 60 ? 'Prioritize building your emergency fund and reducing discretionary spending.' : 'Continue current habits and look for opportunities to boost your savings rate.'}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const vitals = body.vitals as VitalsMetrics;
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const { default: OpenAI } = await import('openai');
        const client = new OpenAI({ apiKey });
        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: 'You are a friendly financial advisor. Provide a concise 3-4 sentence health assessment based on the financial metrics. Use plain language, be encouraging but honest. Format with markdown.',
          }, {
            role: 'user',
            content: `Financial metrics: ${JSON.stringify(body)}`,
          }],
          max_tokens: 300,
        });
        return NextResponse.json({ narrative: response.choices[0]?.message?.content || generateLocalNarrative(vitals) });
      } catch (openaiErr) {
        console.error('OpenAI API error, falling back to local narrative:', openaiErr);
        return NextResponse.json({ narrative: generateLocalNarrative(vitals) });
      }
    }
    
    return NextResponse.json({ narrative: generateLocalNarrative(vitals) });
  } catch (error) {
    console.error('Doctor note error:', error);
    return NextResponse.json({ error: 'Failed to generate note' }, { status: 500 });
  }
}
