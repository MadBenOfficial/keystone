import type { Metadata } from 'next';
import { Hepta_Slab, Manrope, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/Toasts';

const display = Hepta_Slab({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const body = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'keystone - an on-chain AI dependency planner',
  description:
    'State an objective. A Strategist AI decomposes it into a dependency graph of milestones under validator consensus, then prerequisites progressively unlock dependents until the goal is achieved. The whole plan, drafted and settled on GenLayer.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
