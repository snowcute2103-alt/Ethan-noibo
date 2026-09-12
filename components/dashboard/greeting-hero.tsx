'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Spotlight } from '@/components/ui/spotlight';

// RetroTv xáo thứ tự kênh bằng Math.random() lúc render — SSR thì random ở server,
// hydrate lại random khác ở client, nên 2 bên luôn lệch nhau (gây lỗi "hydration
// mismatch" ở kênh preload). Tắt hẳn SSR cho component này thay vì cố đồng bộ 2 lần
// random riêng biệt — component chỉ dựng ở client nên không còn gì để lệch.
const RetroTv = dynamic(() => import('@/components/dashboard/retro-tv'), { ssr: false });

const STARS = [
  { left: '2%', size: 2, duration: 11, delay: 0 },
  { left: '7%', size: 3, duration: 15, delay: 3 },
  { left: '13%', size: 2, duration: 9, delay: 6 },
  { left: '18%', size: 3, duration: 13, delay: 1.5 },
  { left: '24%', size: 2, duration: 10, delay: 8 },
  { left: '29%', size: 3, duration: 16, delay: 4.5 },
  { left: '35%', size: 2, duration: 12, delay: 2 },
  { left: '40%', size: 3, duration: 9, delay: 7 },
  { left: '46%', size: 2, duration: 14, delay: 0.8 },
  { left: '51%', size: 3, duration: 11, delay: 5.2 },
  { left: '57%', size: 2, duration: 13, delay: 9 },
  { left: '62%', size: 3, duration: 10, delay: 3.6 },
  { left: '68%', size: 2, duration: 17, delay: 10.5 },
  { left: '73%', size: 2, duration: 14, delay: 12 },
  { left: '79%', size: 2, duration: 9, delay: 11 },
  { left: '84%', size: 3, duration: 18, delay: 2.8 },
  { left: '90%', size: 2, duration: 12.5, delay: 5.8 },
  { left: '95%', size: 3, duration: 10.5, delay: 8.4 },
];

/** Nút tắt tới 3 chương mini game cuối trang Văn hoá — id khớp với FlowSection tương ứng trong
 *  culture-flow-overview.tsx (trang đó tự cuộn tới đúng chương khi nhận link có hash này). Mỗi nút 1 màu
 *  nền pastel riêng (nhạt, dịu mắt) kèm chữ cùng tông nhưng đậm hơn để đủ tương phản đọc được. */
const GAME_LINKS = [
  { href: '/dashboard/van-hoa#game-gnat-swat', label: 'Luyện mắt', bg: '#ffd9ad', text: '#8a4a12' },
  { href: '/dashboard/van-hoa#game-rotate-puzzle', label: 'Luyện não', bg: '#ded0fb', text: '#5b2e9e' },
  { href: '/dashboard/van-hoa#game-air-hockey', label: 'Luyện phản xạ', bg: '#c3eef2', text: '#106672' },
];

export default function GreetingHero({ greeting, department }: { greeting: string; department: string }) {
  return (
    <div className="greeting-hero relative h-[340px] overflow-hidden rounded-[var(--ui-radius-panel)] bg-black sm:h-[400px] min-[1025px]:h-[560px]">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {STARS.map((star, i) => (
          <span
            key={i}
            className="animate-star-rise-card absolute bottom-0 rounded-full bg-white"
            style={{
              left: star.left,
              width: star.size,
              height: star.size,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="white" />

      <div className="flex h-full flex-col-reverse sm:grid sm:grid-cols-2 min-[1280px]:grid-cols-[2fr_3fr]">
        <div className="greeting-hero-copy relative z-10 flex min-w-0 flex-1 flex-col p-5 sm:basis-1/2 sm:p-6 min-[1025px]:p-10">
          <p className="font-heading text-sm font-medium uppercase tracking-[0.2em] text-cyan sm:text-base min-[1025px]:text-lg min-[1025px]:tracking-[0.25em]">
            Cổng thông tin nội bộ
          </p>
          <div className="flex flex-1 flex-col justify-center">
            <h2 className="title-glow font-heading mt-3 flex flex-col gap-2 text-3xl font-light uppercase leading-[1.2] tracking-normal text-white sm:mt-4 sm:text-4xl min-[1025px]:gap-3 min-[1025px]:text-[clamp(2.5rem,2.75vw,3rem)]">
              <span>{greeting},</span>
              <span>{department}</span>
            </h2>
            <div className="gradient-divider animate-gradient-divider mt-4 w-16 min-[1025px]:w-24" aria-hidden="true" />

            <div className="mt-4 hidden max-w-xs sm:block">
              <p className="text-xs font-semibold text-white min-[1025px]:text-sm">Áp lực quá thì xả stress với vài game:</p>
              <div className="mt-2 flex flex-col items-start gap-1.5">
                {GAME_LINKS.map(({ href, label, bg, text }) => (
                  <Link
                    key={href}
                    href={href}
                    style={{ backgroundColor: bg, color: text }}
                    className="rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:brightness-95 min-[1025px]:text-sm"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex h-1/2 flex-1 items-center justify-center overflow-hidden [container-type:size] sm:h-full sm:basis-1/2">
          <RetroTv />
        </div>
      </div>
    </div>
  );
}
