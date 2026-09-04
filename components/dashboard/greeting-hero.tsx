'use client';

import RetroTv from '@/components/dashboard/retro-tv';
import { Spotlight } from '@/components/ui/spotlight';

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

export default function GreetingHero({ greeting, department }: { greeting: string; department: string }) {
  return (
    <div className="relative h-[460px] overflow-hidden rounded-[var(--ui-radius-panel)] bg-black sm:h-[500px] lg:h-[560px]">
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

      <div className="flex h-full flex-col-reverse sm:flex-row">
        <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center p-8 sm:basis-1/2 sm:p-12">
          <p className="font-heading text-xl font-medium uppercase tracking-[0.3em] text-cyan sm:text-2xl">
            Cổng thông tin nội bộ
          </p>
          <h2 className="title-glow font-heading mt-6 text-4xl font-light uppercase leading-[1.3] tracking-normal text-white sm:text-5xl lg:text-6xl">
            {greeting},
            <br />
            {department}
          </h2>
          <div className="gradient-divider animate-gradient-divider mt-6 w-24" aria-hidden="true" />
        </div>

        <div className="relative flex h-1/2 flex-1 items-center justify-center overflow-hidden [container-type:size] sm:h-full sm:basis-1/2">
          <RetroTv />
        </div>
      </div>
    </div>
  );
}
