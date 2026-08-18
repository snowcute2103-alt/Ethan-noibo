import { Gem, Sparkle } from 'lucide-react';
import type { CSSProperties } from 'react';
import { GoldCoinIcon } from './money-icons';

interface ScatterItem {
  kind: 'coin' | 'gem' | 'sparkle';
  size: number;
  color?: string;
  rotate: number;
  twinkleDelay: number;
  position: CSSProperties;
}

const ITEMS: ScatterItem[] = [
  { kind: 'coin', size: 34, rotate: -12, twinkleDelay: 0, position: { top: '6%', left: '5%' } },
  { kind: 'gem', size: 26, color: '#00D2FF', rotate: 14, twinkleDelay: 0.6, position: { top: '14%', right: '8%' } },
  { kind: 'sparkle', size: 20, color: '#FF6F91', rotate: 6, twinkleDelay: 1.1, position: { top: '48%', left: '3%' } },
  { kind: 'coin', size: 28, rotate: 18, twinkleDelay: 1.7, position: { bottom: '8%', right: '5%' } },
  { kind: 'sparkle', size: 18, color: '#F5A623', rotate: -20, twinkleDelay: 2.2, position: { bottom: '18%', left: '16%' } },
  { kind: 'gem', size: 22, color: '#FF6F91', rotate: -8, twinkleDelay: 0.3, position: { top: '36%', right: '20%' } },
  { kind: 'coin', size: 24, rotate: 24, twinkleDelay: 2.8, position: { bottom: '32%', left: '42%' } },
];

const ICONS = { gem: Gem, sparkle: Sparkle } as const;

/** Rải coin thật (SVG gradient) + gem/sparkle lấp lánh làm nền trang trí cho khu vực tối — không phải ảnh tải về, nhẹ và khớp theme. */
export default function CoinScatter() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70" aria-hidden="true">
      {ITEMS.map((item, i) => (
        <div
          key={i}
          className="animate-twinkle absolute"
          style={{ transform: `rotate(${item.rotate}deg)`, animationDelay: `${item.twinkleDelay}s`, ...item.position }}
        >
          {item.kind === 'coin' ? (
            <GoldCoinIcon size={item.size} />
          ) : (
            (() => {
              const Icon = ICONS[item.kind];
              return <Icon size={item.size} strokeWidth={1.5} style={{ color: item.color }} />;
            })()
          )}
        </div>
      ))}
    </div>
  );
}
