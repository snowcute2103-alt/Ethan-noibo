'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

interface Particle {
  id: number;
  x: string;
  yPeak: string;
  yEnd: string;
  r: string;
  color: string;
  width: number;
  height: number;
  round: boolean;
  duration: number;
}

interface Burst {
  id: number;
  particles: Particle[];
}

const COLORS = ['#ffeb3b', '#e91e63', '#9c27b0', '#2196f3', '#4caf50', '#ff9800', '#00bcd4', '#8bc34a', '#ff5722', '#f44336'];
const PARTICLE_COUNT = 130;
// Khớp/hơi dài hơn duration animation dài nhất để hạt kịp mờ hết trước khi bị dọn khỏi DOM.
const LIFETIME_MS = 3000;

function makeParticles(seed: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const peakVh = -(Math.random() * 30 + 45);
    const endVh = peakVh + 25;
    // Cộng 3 số random rồi chia trung bình để tạo phân bố dồn về giữa (kiểu chuông),
    // thay vì random đều khiến hạt dàn trải quá rộng.
    const x = ((Math.random() + Math.random() + Math.random()) / 3 - 0.5) * 70;
    return {
      id: seed * 1000 + i,
      x: `${x}vw`,
      yPeak: `${peakVh}vh`,
      yEnd: `${endVh}vh`,
      r: `${Math.random() * 1080}deg`,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      width: Math.random() * 4.5 + 3.5,
      height: Math.random() * 9 + 7.5,
      round: Math.random() > 0.5,
      duration: Math.random() * 1000 + 1900,
    };
  });
}

/** Pháo hoa giấy bắn từ đáy màn hình bay lên khi tick "Hoàn thành" — toả rộng khắp
 *  viewport theo vw/vh (giống demo gốc), không neo theo vị trí click. */
export function useCheckboxConfetti() {
  const [burst, setBurst] = useState<Burst | null>(null);
  const idRef = useRef(0);

  function fire() {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    idRef.current += 1;
    setBurst({ id: idRef.current, particles: makeParticles(idRef.current) });
  }

  useEffect(() => {
    if (!burst) return;
    const timeout = setTimeout(() => setBurst(null), LIFETIME_MS);
    return () => clearTimeout(timeout);
  }, [burst]);

  const node =
    burst &&
    typeof document !== 'undefined' &&
    createPortal(
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] overflow-visible" aria-hidden="true">
        {burst.particles.map((p) => (
          <span
            key={p.id}
            className="animate-checkbox-confetti absolute bottom-0 left-1/2"
            style={
              {
                width: p.width,
                height: p.height,
                background: p.color,
                borderRadius: p.round ? '50%' : '2px',
                animationDuration: `${p.duration}ms`,
                '--cx': p.x,
                '--cy-peak': p.yPeak,
                '--cy-end': p.yEnd,
                '--cr': p.r,
              } as CSSProperties
            }
          />
        ))}
      </div>,
      document.body
    );

  return { fire, node };
}
