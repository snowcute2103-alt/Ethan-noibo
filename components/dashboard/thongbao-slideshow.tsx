'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ThongBaoSlide {
  key: string;
  label: string;
  node: ReactNode;
}

const AUTOPLAY_MS = 8000;

/** Carousel 1 slide/lần cho Thông báo + Chính sách + Announcement — tự chạy, dừng khi người dùng thao tác. */
export default function ThongBaoSlideshow({ slides }: { slides: ThongBaoSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  if (slides.length === 0) return null;

  const goTo = (next: number) => {
    setIndex(((next % slides.length) + slides.length) % slides.length);
    setPaused(true);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="rounded-full bg-navy/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-navy/70">
          {slides[index].label}
        </span>
        {slides.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">
              {index + 1}/{slides.length}
            </span>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-navy/10 text-navy transition-colors hover:bg-navy/5"
              aria-label="Thông báo trước"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-navy/10 text-navy transition-colors hover:bg-navy/5"
              aria-label="Thông báo tiếp theo"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <div key={slides[index].key} className="animate-fade-up mt-4 max-h-[420px] overflow-y-auto rounded-[20px] sm:max-h-[480px]">
        {slides[index].node}
      </div>

      {slides.length > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-navy' : 'w-1.5 bg-navy/20'
              }`}
              aria-label={`Đến thông báo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
