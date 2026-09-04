'use client';

import { useRef, type CSSProperties, type MouseEvent } from 'react';
import { Medal } from 'lucide-react';

interface AwardCardProps {
  name: string;
  month: string;
  accent: string;
  index: number;
}

const MAX_TILT_DEG = 16;

let reduceMotionQuery: MediaQueryList | null = null;
function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  reduceMotionQuery ??= window.matchMedia('(prefers-reduced-motion: reduce)');
  return reduceMotionQuery.matches;
}

/**
 * Badge vinh danh kiểu "holographic foil" — nghiêng 3D toàn khối theo chuột + ánh cầu vồng
 * lấp lánh (idle drift luôn chạy + spotlight bám chuột khi hover). Cập nhật qua CSS var thay
 * vì setState để tránh re-render mỗi lần rê chuột.
 */
export default function AwardCard({ name, month, accent, index }: AwardCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el || prefersReducedMotion()) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.setProperty('--rx', `${(0.5 - py) * MAX_TILT_DEG}deg`);
    el.style.setProperty('--ry', `${(px - 0.5) * MAX_TILT_DEG}deg`);
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
    el.style.setProperty('--shine', '1');
    el.style.setProperty('--scale', '1.045');
  }

  function handleMouseLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--shine', '0');
    el.style.setProperty('--scale', '1');
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ animationDelay: `${Math.min(index * 45, 900)}ms`, perspective: '1000px' } as CSSProperties}
      className="animate-fade-up"
    >
      <div
        ref={cardRef}
        className="relative rounded-[16px] p-[1.5px] transition-[transform] duration-200 ease-out will-change-transform min-[1025px]:rounded-[26px]"
        style={{
          background: `linear-gradient(135deg, ${accent}, #F5A623 45%, #00D2FF 75%, #7C6CF0)`,
          transform: 'scale(var(--scale, 1)) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
          transformStyle: 'preserve-3d',
          boxShadow: '0 24px 48px -24px rgba(0,0,0,0.55)',
        }}
      >
        <div className="relative overflow-hidden rounded-[14.5px] bg-gradient-to-br from-[#0b1220] via-[#131b30] to-[#1a2745] px-4 py-3.5 min-[1025px]:rounded-[24.5px] min-[1025px]:px-6 min-[1025px]:py-5">
          {/* Lớp cầu vồng luôn lấp lánh nhẹ, tự trôi */}
          <div
            aria-hidden="true"
            className="animate-holo-drift pointer-events-none absolute inset-0 opacity-40 mix-blend-color-dodge"
            style={{
              backgroundImage:
                'linear-gradient(115deg, transparent 15%, rgba(255,111,145,0.65) 30%, rgba(245,166,35,0.65) 45%, rgba(0,210,255,0.65) 60%, rgba(124,108,240,0.65) 75%, transparent 90%)',
              backgroundSize: '260% 260%',
            }}
          />
          {/* Lớp spotlight bám theo chuột khi hover */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[var(--shine,0)] transition-opacity duration-300 mix-blend-overlay"
            style={{
              background:
                'radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.95), rgba(0,210,255,0.55) 30%, rgba(245,166,35,0.55) 55%, rgba(255,111,145,0.55) 78%, transparent 85%)',
            }}
          />

          <div className="relative flex items-center gap-3 min-[1025px]:gap-4">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ring-white/15 transition-transform duration-200 min-[1025px]:h-12 min-[1025px]:w-12"
              style={{ background: `linear-gradient(135deg, ${accent}33, transparent)`, transform: 'translateZ(30px)' }}
            >
              <Medal size={22} strokeWidth={2.25} style={{ color: accent }} aria-hidden="true" />
            </span>
            <div className="min-w-0" style={{ transform: 'translateZ(20px)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#F5C776]">Ethan Ecom · Xuất sắc</p>
              <p className="font-heading mt-1 text-base font-medium tracking-wide leading-tight text-white min-[1025px]:text-lg">{name}</p>
              <p className="mt-0.5 text-xs font-semibold text-white/50">{month}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
