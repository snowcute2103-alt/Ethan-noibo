'use client';

import { useEffect, useRef, useState } from 'react';

interface CoreValuesStairProps {
  values: string[];
}

/** 5 giá trị cốt lõi theo bố cục editorial dọc, căn trái và giãn đều theo chiều cao cột. */
export function CoreValuesStair({ values }: CoreValuesStairProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    let frame = 0;

    function updateActiveValue() {
      frame = 0;
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      if (containerRect.bottom < 0 || containerRect.top > viewportHeight) {
        setActiveIndex(-1);
        return;
      }

      const focusY = viewportHeight * 0.52;
      let closestIndex = -1;
      let closestDistance = Number.POSITIVE_INFINITY;

      rowRefs.current.forEach((row, index) => {
        if (!row) return;
        const rect = row.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - focusY);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex(closestIndex);
    }

    function requestUpdate() {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveValue);
    }

    updateActiveValue();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [values]);

  return (
    <div ref={containerRef} className="flex min-h-0 w-full flex-1 py-8 sm:py-10 lg:py-12">
      <div className="flex w-full flex-1 flex-col items-start justify-between gap-8 text-left sm:gap-10 lg:gap-12">
        {values.map((value, i) => (
          <div
            key={value}
            ref={(element) => {
              rowRefs.current[i] = element;
            }}
            className="flex w-full items-center justify-start gap-3 sm:gap-4"
          >
            <span
              className={`h-px w-5 shrink-0 bg-gradient-to-r from-transparent transition-[color,filter] duration-300 sm:w-8 ${activeIndex === i ? 'core-value-neon-line to-cyan' : 'to-cyan/25'}`}
              aria-hidden="true"
            />
            <p
              className={`font-heading whitespace-nowrap text-[clamp(1.65rem,3.25vw,3.6rem)] font-black uppercase leading-none tracking-[-0.04em] transition-[color,text-shadow] duration-300 ${activeIndex === i ? 'core-value-neon' : 'text-white'}`}
            >
              {value}
            </p>
            <span
              className={`h-px min-w-4 flex-1 bg-gradient-to-l from-transparent transition-[color,filter] duration-300 ${activeIndex === i ? 'core-value-neon-line to-cyan' : 'to-cyan/25'}`}
              aria-hidden="true"
            />
            <span className="sr-only">Giá trị {i + 1} trong 5</span>
          </div>
        ))}
      </div>
    </div>
  );
}
