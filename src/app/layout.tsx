import type { Metadata } from 'next';
import './globals.css';
import { AnalyticsProvider } from '@/context/AnalyticsContext';

export const metadata: Metadata = {
  title: 'FinPulse - Financial Vital Signs',
  description: 'Know your financial health at a glance',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen font-sans">
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
