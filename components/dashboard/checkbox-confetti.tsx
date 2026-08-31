'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

interface Particle {
  id: number;
  dx: number;
  dy: number;
  color: string;
  size: number;
}

interface Burst {
  id: number;
  x: number;
  y: number;
  particles: Particle[];
}

const COLORS = ['#4FA3F7', '#FFB84D', '#2DD4BF', '#9B7EF0', '#FF7A5C', '#FF6FA0'];
const PARTICLE_COUNT = 10;
// Khớp/hơi dài hơn thời lượng animation firework-particle (950ms ở globals.css)
// để hạt kịp mờ dần hết tự nhiên trước khi bị dọn, không bị cắt cụt giữa chừng.
const LIFETIME_MS = 1000;

function makeParticles(seed: number): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.4;
    const distance = 16 + Math.random() * 18;
    return {
      id: seed * 100 + i,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      color: COLORS[i % COLORS.length],
      size: 3 + Math.random() * 2,
    };
  });
}

/** Vài hạt nhỏ bắn nhẹ từ đúng vị trí click khi tick "Hoàn thành" — tái dùng animation
 *  `firework-particle` đã có ở globals.css (tôn trọng prefers-reduced-motion), chỉ khác
 *  FireworkBurst (component pháo hoa mừng ăn theo % khung chứa) ở chỗ đây neo đúng 1 điểm
 *  toạ độ viewport qua portal, nhẹ và ngắn hơn nhiều cho hợp với 1 lượt tick checkbox. */
export function useCheckboxConfetti() {
  const [burst, setBurst] = useState<Burst | null>(null);
  const idRef = useRef(0);

  function fire(x: number, y: number) {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    idRef.current += 1;
    setBurst({ id: idRef.current, x, y, particles: makeParticles(idRef.current) });
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
      <div className="pointer-events-none fixed z-[60]" style={{ left: burst.x, top: burst.y }} aria-hidden="true">
        {burst.particles.map((p) => (
          <span
            key={p.id}
            className="animate-firework-particle absolute rounded-full"
            style={
              {
                width: p.size,
                height: p.size,
                background: p.color,
                boxShadow: `0 0 4px ${p.color}`,
                '--dx': `${p.dx}px`,
                '--dy': `${p.dy}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>,
      document.body
    );

  return { fire, node };
}
