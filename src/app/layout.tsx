import type { Metadata } from 'next';
import localFont from 'next/font/local';
// CSS is loaded by Next.js at runtime; the project does not declare CSS module types.
// @ts-expect-error -- global CSS import handled by Next.js
import './globals.css';

const plusJakartaSans = localFont({
  src: './fonts/PlusJakartaSans-Latin.woff2',
  weight: '400 800',
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Runway Tracker',
  description: 'Track your living expenses runway',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${plusJakartaSans.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
