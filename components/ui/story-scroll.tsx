'use client';

import { Children, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

export interface FlowSectionProps {
  id?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  'aria-label'?: string;
  /**
   * Góc xoay (độ) lúc chương này cuộn vào khung — mặc định 30° như bản gốc. Chương có nội dung
   * cao hơn nhiều so với 1 màn hình (vd. chứa hero riêng) nên dùng góc nhỏ hơn: xoay 30° quanh
   * góc dưới-trái trên nội dung quá cao sẽ vung ra ngoài `overflow-hidden` của section, lộ
   * khoảng đen trống lúc đang chuyển cảnh — góc nhỏ hơn vẫn giữ hiệu ứng nhưng đỡ bị cắt.
   */
  rotateDeg?: number;
}

/** Một "chương" full-screen — cuộn tới sẽ ghim lại rồi trang tiếp theo trượt lên đè lên trên. */
export function FlowSection({ id, className, style = {}, children, 'aria-label': ariaLabel, rotateDeg }: FlowSectionProps) {
  return (
    <section
      id={id}
      data-flow-section
      data-flow-rotate-deg={rotateDeg ?? undefined}
      aria-label={ariaLabel}
      className={cn('relative min-h-screen w-full overflow-hidden', className)}
    >
      <div
        data-flow-inner
        className={cn(
          'flow-art-container relative flex min-h-screen w-full flex-col justify-between gap-6 px-[4vw] pb-[calc(4vw_+_50px)] pt-[clamp(2rem,8vw,4vw)]',
          'will-change-transform',
        )}
        style={{ transformOrigin: 'bottom left', ...style }}
      >
        {children}
      </div>
    </section>
  );
}

export interface FlowArtProps {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

/** Chuỗi FlowSection cuộn kiểu "ghim + xoay vào khung" — chuyển thể từ mẫu story-scroll (GSAP + ScrollTrigger pin). */
export default function FlowArt({ children, className, 'aria-label': ariaLabel = 'Story scroll' }: FlowArtProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useGSAP(
    () => {
      if (!containerRef.current || reducedMotion) return;

      const sections = Array.from(containerRef.current.querySelectorAll<HTMLElement>('[data-flow-section]'));
      if (sections.length === 0) return;

      const triggers: ScrollTrigger[] = [];

      sections.forEach((section, i) => {
        gsap.set(section, { zIndex: i + 1 });

        const inner = section.querySelector<HTMLElement>('.flow-art-container');
        if (!inner) return;

        if (i > 0) {
          const rotateDeg = section.dataset.flowRotateDeg ? Number(section.dataset.flowRotateDeg) : 30;
          gsap.set(inner, { rotation: rotateDeg, transformOrigin: 'bottom left' });
          const tween = gsap.to(inner, {
            rotation: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'top 25%',
              scrub: true,
            },
          });
          if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
        }

        if (i < sections.length - 1) {
          triggers.push(
            ScrollTrigger.create({
              trigger: section,
              start: 'bottom bottom',
              end: 'bottom top',
              pin: true,
              pinSpacing: false,
            }),
          );
        }
      });

      ScrollTrigger.refresh();

      return () => {
        triggers.forEach((t) => t.kill());
      };
    },
    { scope: containerRef, dependencies: [Children.count(children), reducedMotion] },
  );

  // Ảnh (team photo, parallax layer...) load bất đồng bộ sau khi ScrollTrigger.refresh() đã chạy
  // lần đầu — chiều cao thật của mỗi chương lúc đó còn ngắn hơn thực tế, khiến điểm ghim tính sai
  // và bị "kẹt"/cắt nội dung giữa chừng. Theo dõi chiều cao container, refresh lại mỗi khi nó đổi.
  useEffect(() => {
    if (!containerRef.current || reducedMotion) return;

    let raf = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    observer.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [reducedMotion]);

  return (
    <main ref={containerRef} aria-label={ariaLabel} className={cn('w-full overflow-x-hidden', className)}>
      {children}
    </main>
  );
}
