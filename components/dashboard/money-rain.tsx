'use client';

import { useEffect, useState } from 'react';
import { MoneyBillIcon, GoldCoinIcon } from './money-icons';

interface FallingItem {
  id: number;
  kind: 'bill' | 'coin';
  left: number;
  size: number;
  rotate: number;
  duration: number;
  delay: number;
}

const ITEM_COUNT = 34;
const BURST_LIFETIME_MS = 5400;

/** Hiệu ứng "tiền & đồng xu rơi" phủ toàn màn hình khi vào trang — chạy một lần, tôn trọng prefers-reduced-motion. */
export default function MoneyRain() {
  const [items, setItems] = useState<FallingItem[]>([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setItems(
      Array.from({ length: ITEM_COUNT }, (_, i) => ({
        id: i,
        kind: Math.random() < 0.45 ? 'coin' : 'bill',
        left: Math.random() * 100,
        size: 22 + Math.random() * 18,
        rotate: Math.random() * 80 - 40,
        duration: 3.4 + Math.random() * 2.2,
        delay: Math.random() * 1.1,
      })),
    );

    const timeout = setTimeout(() => setItems([]), BURST_LIFETIME_MS);
    return () => clearTimeout(timeout);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {items.map((item) => (
        <div
          key={item.id}
          className="animate-money-fall absolute -top-12"
          style={{
            left: `${item.left}%`,
            animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
          }}
        >
          <div style={{ transform: `rotate(${item.rotate}deg)` }}>
            {item.kind === 'coin' ? <GoldCoinIcon size={item.size} /> : <MoneyBillIcon width={item.size * 1.4} />}
          </div>
        </div>
      ))}
    </div>
  );
}
