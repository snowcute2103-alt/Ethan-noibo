'use client';

import { useEffect, useState, type CSSProperties } from 'react';

interface Particle {
  id: number;
  dx: number;
  dy: number;
  color: string;
  delay: number;
  size: number;
}

interface Burst {
  id: number;
  x: number;
  y: number;
  delay: number;
  particles: Particle[];
}

const COLORS = ['#F5A623', '#FF6F91', '#00D2FF', '#7C6CF0', '#FFD54D'];
const BURST_COUNT = 4;
const PARTICLES_PER_BURST = 14;
const LIFETIME_MS = 4200;

function makeParticles(burstId: number): Particle[] {
  return Array.from({ length: PARTICLES_PER_BURST }, (_, i) => {
    const angle = (i / PARTICLES_PER_BURST) * Math.PI * 2 + Math.random() * 0.3;
    const distance = 55 + Math.random() * 50;
    return {
      id: burstId * 100 + i,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      color: COLORS[(burstId + i) % COLORS.length],
      delay: Math.random() * 0.15,
      size: 4 + Math.random() * 4,
    };
  });
}

/** Pháo hoa chào mừng khi vào trang — nổ vài điểm ngẫu nhiên rồi tự dọn, tôn trọng prefers-reduced-motion. */
export default function FireworkBurst() {
  const [bursts, setBursts] = useState<Burst[]>([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setBursts(
      Array.from({ length: BURST_COUNT }, (_, i) => ({
        id: i,
        x: 15 + Math.random() * 70,
        y: 12 + Math.random() * 55,
        delay: i * 0.35 + Math.random() * 0.2,
        particles: makeParticles(i),
      })),
    );

    const timeout = setTimeout(() => setBursts([]), LIFETIME_MS);
    return () => clearTimeout(timeout);
  }, []);

  if (bursts.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {bursts.map((burst) => (
        <div key={burst.id} className="absolute" style={{ left: `${burst.x}%`, top: `${burst.y}%` }}>
          {burst.particles.map((p) => (
            <span
              key={p.id}
              className="animate-firework-particle absolute rounded-full"
              style={
                {
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  boxShadow: `0 0 6px ${p.color}`,
                  animationDelay: `${burst.delay + p.delay}s`,
                  '--dx': `${p.dx}px`,
                  '--dy': `${p.dy}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}
