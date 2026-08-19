'use client';

import { useState, type MouseEvent, type ReactNode } from 'react';

interface MouseGlowPanelProps {
  className?: string;
  children: ReactNode;
}

/** Khối màu mờ bám theo con trỏ chuột khi hover — lấy cảm hứng từ hiệu ứng ambient-glow của login-1.tsx. */
export default function MouseGlowPanel({ className, children }: MouseGlowPanelProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div className={className} onMouseMove={handleMouseMove} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      <div
        className={`pointer-events-none absolute left-0 top-0 h-80 w-80 rounded-full bg-gradient-to-r from-cyan/60 via-blue-cta/60 to-gold/50 blur-3xl transition-opacity duration-200 ${
          hovering ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          transform: `translate(${pos.x - 160}px, ${pos.y - 160}px)`,
          transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
