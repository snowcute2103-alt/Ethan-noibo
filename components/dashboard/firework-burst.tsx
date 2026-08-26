'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

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
const DEFAULT_BURST_COUNT = 4;
const DEFAULT_PARTICLES_PER_BURST = 14;
const DEFAULT_LIFETIME_MS = 4200;

function makeParticles(burstId: number, particlesPerBurst: number): Particle[] {
  return Array.from({ length: particlesPerBurst }, (_, i) => {
    const angle = (i / particlesPerBurst) * Math.PI * 2 + Math.random() * 0.3;
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

interface FireworkBurstProps {
  /** Tự nổ 1 lần khi mount — mặc định true để giữ nguyên hành vi cũ (trang Khen thưởng dùng không kèm props). */
  autoPlay?: boolean;
  /** Tăng giá trị này (vd mỗi lần hover vào khung) để kích hoạt thêm 1 đợt nổ mới. */
  trigger?: number;
  /** Số điểm nổ mỗi đợt. Mặc định 4 (hiệu ứng chào mừng nhiều điểm) — hiệu ứng hover nên dùng 1 cho gọn. */
  burstCount?: number;
  /** Số hạt mỗi điểm nổ. */
  particlesPerBurst?: number;
  /** Thời gian (ms) trước khi tự dọn cả đợt — nên khớp với thời lượng animation của hạt để không kéo dài cảm giác "nổ liên tục". */
  lifetimeMs?: number;
}

/** Pháo hoa — nổ vài điểm ngẫu nhiên rồi tự dọn, tôn trọng prefers-reduced-motion. Tự nổ khi mount
 *  (trang Khen thưởng) hoặc nổ theo yêu cầu qua prop `trigger` (vd khung Chương trình sinh nhật khi hover). */
export default function FireworkBurst({
  autoPlay = true,
  trigger,
  burstCount = DEFAULT_BURST_COUNT,
  particlesPerBurst = DEFAULT_PARTICLES_PER_BURST,
  lifetimeMs = DEFAULT_LIFETIME_MS,
}: FireworkBurstProps = {}) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const idRef = useRef(0);
  const isFirstTriggerRun = useRef(true);
  const burstsRef = useRef<Burst[]>([]);

  function spawn() {
    // Đợt trước chưa dọn xong thì bỏ qua — tránh chồng nhiều đợt nổ trông như nổ liên tục không dứt.
    if (burstsRef.current.length > 0) return;
    if (window.matchMedia('(max-width: 1024px), (prefers-reduced-motion: reduce)').matches) return;
    const startId = idRef.current;
    idRef.current += burstCount;
    const next = Array.from({ length: burstCount }, (_, i) => ({
      id: startId + i,
      x: 15 + Math.random() * 70,
      y: 12 + Math.random() * 55,
      delay: i * 0.35 + Math.random() * 0.2,
      particles: makeParticles(startId + i, particlesPerBurst),
    }));
    burstsRef.current = next;
    setBursts(next);
  }

  useEffect(() => {
    if (autoPlay) spawn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (trigger === undefined) return;
    // Bỏ qua lần chạy đầu (giá trị khởi tạo của trigger) — chỉ nổ khi trigger thực sự tăng.
    if (isFirstTriggerRun.current) {
      isFirstTriggerRun.current = false;
      return;
    }
    spawn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  useEffect(() => {
    if (bursts.length === 0) return;
    const timeout = setTimeout(() => {
      burstsRef.current = [];
      setBursts([]);
    }, lifetimeMs);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bursts]);

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
