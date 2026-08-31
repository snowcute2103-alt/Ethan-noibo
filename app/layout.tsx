import type { Metadata } from 'next';
import Script from 'next/script';
import { Alex_Brush, Fahkwang, Libre_Baskerville, Mulish, Noto_Serif } from 'next/font/google';
import './globals.css';

const fahkwang = Fahkwang({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-heading',
});

const mulish = Mulish({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

/** Serif báo in — dùng cho phần đọc dài kiểu NYT (trang Quy trình/SOP). Có subset vietnamese nên dấu tiếng Việt hiển thị đúng, khác Libre Baskerville bên dưới. */
const notoSerif = Noto_Serif({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

/** Thay tạm cho BaskervilleVN (font riêng, không có sẵn) — cùng họ Baskerville, miễn phí bản quyền qua Google Fonts. Chỉ dùng cho chữ "Ethan Ecom" trên ParallaxHero. */
const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-baskerville',
});

/** Chữ script vàng trên vé "Admit One" (birthday ticket). */
const alexBrush = Alex_Brush({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-script',
});

export const metadata: Metadata = {
  title: 'Nội Bộ · Ethan Ecom',
  description: 'Cổng thông tin nội bộ Ethan Ecom — chỉ dành cho nhân sự.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`site-shell ${fahkwang.variable} ${mulish.variable} ${libreBaskerville.variable} ${alexBrush.variable} ${notoSerif.variable} font-body`}
      >
        {children}
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{const saved=localStorage.getItem('ethan-theme');const theme=saved==='light'||saved==='dark'?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme}catch{document.documentElement.dataset.theme='light'}`}
        </Script>
      </body>
    </html>
  );
}
