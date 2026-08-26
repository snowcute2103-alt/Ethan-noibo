'use client';

import type { FocusEvent, MouseEvent, ReactNode } from 'react';
import { useRef } from 'react';

const DEFAULT_TONE = '#f4f7f9';

function toneFromTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>('[data-hover-tone]')?.dataset.hoverTone ?? null;
}

export default function HoverToneSection({ children }: { children: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);

  const setTone = (tone: string) => {
    sectionRef.current?.style.setProperty('--content-section-tone', tone);
  };

  const handleMouseOver = (event: MouseEvent<HTMLElement>) => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const tone = toneFromTarget(event.target);
    if (tone) setTone(tone);
  };

  const handleFocus = (event: FocusEvent<HTMLElement>) => {
    const tone = toneFromTarget(event.target);
    if (tone) setTone(tone);
  };

  const handleFocusOut = (event: FocusEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) {
      const tone = toneFromTarget(event.relatedTarget);
      if (tone) {
        setTone(tone);
        return;
      }
    }
    setTone(DEFAULT_TONE);
  };

  return (
    <section
      ref={sectionRef}
      className="content-hover-tone flex flex-col gap-10"
      aria-labelledby="other-content-title"
      onMouseOver={handleMouseOver}
      onMouseLeave={() => setTone(DEFAULT_TONE)}
      onFocusCapture={handleFocus}
      onBlurCapture={handleFocusOut}
    >
      {children}
    </section>
  );
}
