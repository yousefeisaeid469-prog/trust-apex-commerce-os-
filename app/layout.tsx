import './globals.css';
import type { Metadata, Viewport } from 'next';
import TrustExperienceUpgrade from '../components/trust-experience-upgrade';
import { headers } from 'next/headers';

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', colorScheme: 'dark' };

export const metadata: Metadata = {
  title: 'TRUST V196 APEX — Merchant Super OS & Commerce OS',
  description: 'TRUST V196 APEX: merchant super OS, customer experience, commerce, payments, fulfillment, logistics, trust and private control plane.',
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = headers().get('x-nonce') ?? undefined;
  return <html lang="ar" dir="rtl"><head><link rel="preconnect" href="/" /></head><body><TrustExperienceUpgrade />{children}<script nonce={nonce} dangerouslySetInnerHTML={{__html:`if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));}`}} /></body></html>;
}
