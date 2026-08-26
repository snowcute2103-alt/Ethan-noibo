'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

type SpinningTextProps = {
  text: string;
  radius?: number;
  textClassName?: string;
  speed?: number;
  direction?: 'normal' | 'reverse';
  className?: string;
};

/** Chữ chạy vòng tròn quanh 1 path SVG, xoay liên tục — dùng cho badge/huy hiệu tròn. */
export function SpinningText({
  text,
  radius = 37,
  textClassName = 'text-[8px] fill-current',
  speed = 10,
  direction = 'normal',
  className,
}: SpinningTextProps) {
  const pathId = `spinning-text-${useId().replace(/[:]/g, '')}`;

  return (
    <div className={className}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <g
          className="origin-center animate-spin"
          style={{ animationDuration: `${speed}s`, animationDirection: direction }}
        >
          <path
            id={pathId}
            d={`
              M 50,50
              m -${radius},0
              a ${radius},${radius} 0 1,1 ${radius * 2},0
              a ${radius},${radius} 0 1,1 -${radius * 2},0
            `}
            fill="none"
          />
          <text className={cn('font-medium uppercase tracking-widest', textClassName)}>
            <textPath xlinkHref={`#${pathId}`} startOffset="0%">
              {text}
            </textPath>
          </text>
        </g>
      </svg>
    </div>
  );
}

export default SpinningText;
