import type { Metadata } from 'next';
import { Fahkwang, Mulish } from 'next/font/google';
import './globals.css';

const fahkwang = Fahkwang({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
});

const mulish = Mulish({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Nội Bộ · Ethan Ecom',
  description: 'Cổng thông tin nội bộ Ethan Ecom — chỉ dành cho nhân sự.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${fahkwang.variable} ${mulish.variable} font-body`}>{children}</body>
    </html>
  );
}
