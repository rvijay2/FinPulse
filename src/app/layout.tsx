import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AnalyticsProvider } from '@/context/AnalyticsContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FinPulse - Financial Vital Signs',
  description: 'Know your financial health at a glance',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 min-h-screen`}>
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
