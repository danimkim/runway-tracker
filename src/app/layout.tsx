import type { Metadata } from 'next';
import localFont from 'next/font/local';
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
