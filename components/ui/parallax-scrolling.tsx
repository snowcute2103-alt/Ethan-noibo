'use client';

import { useEffect, useRef } from 'react';
import Image, { type StaticImageData } from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useReducedEffects } from '@/lib/use-reduced-effects';

/**
 * Hero parallax chuyển thể từ mẫu Osmo (GSAP ScrollTrigger + Lenis): cùng 4 lớp,
 * cùng start/end/scrub. Layer1/2/4 dùng đúng 3 ảnh depth-layer gốc của Osmo (host tại
 * /public/images/van-hoa/parallax-layer-*.webp, không hotlink CDN Osmo) — layer4 đã có
 * sẵn alpha trong suốt nên vẽ đè lên chữ y hệt bản gốc.
 *
 * yPercent 70/55/40/10 gốc dịch layer tới 70% CHIỀU CAO CỦA CHÍNH NÓ — với vùng đệm tràn
 * (top/bottom âm) chỉ đủ ~40%, ảnh trôi gần hết ra khỏi khung trước khi cuộn hết section,
 * lộ nền đen trống (nhìn như bị cắt/mờ). Giảm biên độ xuống 20/15/8/4 và tăng vùng đệm
 * tương ứng để ảnh luôn phủ kín suốt quá trình cuộn, núi luôn hiển thị rõ.
 *
 * Component này giờ được dùng ở nhiều nơi trên cùng 1 trang (hero chương 2 của FlowArt
 * overview + hero thật của bài Founder) — dùng singleton Lenis (đếm tham chiếu) để nhiều
 * instance cùng mounted chỉ tạo 1 vòng lặp smooth-scroll duy nhất, và gsap.context() để
 * mỗi instance chỉ dọn dẹp đúng ScrollTrigger của chính nó khi unmount.
 */
let lenisInstance: Lenis | null = null;
let lenisRefCount = 0;
let lenisRaf: ((time: number) => void) | null = null;

function acquireLenis() {
  lenisRefCount += 1;
  if (!lenisInstance) {
    const instance = new Lenis();
    lenisInstance = instance;
    lenisRaf = (time: number) => instance.raf(time * 1000);
    instance.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);
  }
}

function releaseLenis() {
  lenisRefCount -= 1;
  if (lenisRefCount <= 0) {
    if (lenisRaf) gsap.ticker.remove(lenisRaf);
    lenisInstance?.destroy();
    lenisInstance = null;
    lenisRaf = null;
    lenisRefCount = 0;
  }
}

export function ParallaxHero({
  title,
  layer1,
  layer2,
  layer4,
}: {
  title: string;
  layer1: StaticImageData;
  layer2: StaticImageData;
  layer4: StaticImageData;
}) {
  const parallaxRef = useRef<HTMLDivElement>(null);
  const reduceEffects = useReducedEffects();

  useEffect(() => {
    if (reduceEffects) return;
    const root = parallaxRef.current;
    const triggerElement = root?.querySelector<HTMLElement>('[data-parallax-layers]');
    if (!triggerElement) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerElement,
          start: '0% 0%',
          end: '100% 0%',
          scrub: 0,
        },
      });

      const layers = [
        { layer: '1', yPercent: 20 },
        { layer: '2', yPercent: 15 },
        { layer: '3', yPercent: 8 },
        { layer: '4', yPercent: 4 },
      ];

      layers.forEach((layerObj, idx) => {
        tl.to(
          triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
          { yPercent: layerObj.yPercent, ease: 'none' },
          idx === 0 ? undefined : '<',
        );
      });
    }, root ?? undefined);

    acquireLenis();

    return () => {
      ctx.revert();
      releaseLenis();
    };
  }, [reduceEffects]);

  return (
    <div className="parallax relative" ref={parallaxRef}>
      <section className="parallax__header relative h-[130svh] overflow-hidden bg-black">
        <div className="parallax__visuals absolute inset-0">
          <div data-parallax-layers className="parallax__layers relative h-full w-full">
            <div
              data-parallax-layer="1"
              className="parallax__layer-img absolute inset-x-0 will-change-transform"
              style={{ top: '-35%', bottom: '-35%' }}
            >
              <Image
                src={layer1}
                alt=""
                fill
                sizes="100vw"
                priority
                className="object-cover"
                style={{ objectPosition: '50% 32%' }}
              />
            </div>

            <div
              data-parallax-layer="2"
              className="parallax__layer-img absolute inset-x-0 will-change-transform"
              style={{ top: '-30%', bottom: '-30%' }}
            >
              <Image
                src={layer2}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
                style={{ objectPosition: '50% 32%' }}
              />
            </div>

            <div
              data-parallax-layer="3"
              className="parallax__layer-title absolute inset-0 flex items-center justify-center px-6 will-change-transform"
            >
              <h2 className="parallax__title select-none text-center font-baskerville text-[clamp(3rem,13vw,11rem)] font-bold uppercase leading-[0.88] tracking-tight text-white">
                {title}
              </h2>
            </div>

            <div
              data-parallax-layer="4"
              className="parallax__layer-img pointer-events-none absolute inset-x-0 will-change-transform"
              style={{ top: '-15%', bottom: '-15%' }}
            >
              <Image
                src={layer4}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
                style={{ objectPosition: '50% 32%' }}
              />
            </div>
          </div>
        </div>

        <div
          className="parallax__fade pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-b from-transparent to-black"
          aria-hidden="true"
        />
      </section>
    </div>
  );
}
