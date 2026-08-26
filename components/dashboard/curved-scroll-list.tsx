'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const EDGE_OFFSET = 7;
const CORNER_INSET = 2;
const MIN_START_RATIO = 0.8;
const MIN_THUMB_LENGTH = 20;
const CURVE_SEGMENTS = 50;

/**
 * Danh sách cuộn trong thẻ bo góc, dùng thanh cuộn SVG tự vẽ theo đúng bán kính bo góc
 * của thẻ thay cho scrollbar mặc định của trình duyệt — chỉ hiện khi nội dung vượt maxHeight.
 */
export default function CurvedScrollList({
  children,
  className,
  maxHeight = 520,
  thumbColor = '#00D2FF',
  thumbActiveColor = '#0052CC',
}: {
  children: ReactNode;
  className?: string;
  maxHeight?: number;
  /** Màu thumb lúc nghỉ / lúc đang kéo — đổi theo category để phân biệt các thẻ xếp cạnh nhau. */
  thumbColor?: string;
  thumbActiveColor?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<SVGPathElement>(null);
  const thumbRef = useRef<SVGPathElement>(null);
  const [scrollable, setScrollable] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!container || !content || !track || !thumb) return;

    let pathLength = 0;
    let thumbLength = MIN_THUMB_LENGTH;
    let dragActive = false;
    let pointerId: number | null = null;

    function updatePath() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      const r = parseFloat(getComputedStyle(container!).borderRadius) || 0;

      const effectiveRadius = Math.max(r - EDGE_OFFSET, 0);
      const trackX = w - EDGE_OFFSET;
      const topY = EDGE_OFFSET;
      const bottomY = h - EDGE_OFFSET;
      const cornerX = trackX - effectiveRadius;

      const minStartX = w * MIN_START_RATIO;
      let startX = trackX - effectiveRadius * CORNER_INSET;
      if (startX < minStartX) startX = minStartX;
      if (startX > cornerX) startX = cornerX;

      track!.setAttribute(
        'd',
        `M ${startX} ${topY}
         L ${cornerX} ${topY}
         A ${effectiveRadius} ${effectiveRadius} 0 0 1 ${trackX} ${topY + effectiveRadius}
         L ${trackX} ${bottomY - effectiveRadius}
         A ${effectiveRadius} ${effectiveRadius} 0 0 1 ${cornerX} ${bottomY}
         L ${startX} ${bottomY}`
      );

      pathLength = track!.getTotalLength();
      const isScrollable = content!.scrollHeight - content!.clientHeight > 1;
      setScrollable(isScrollable);

      const ratio = isScrollable ? content!.clientHeight / content!.scrollHeight : 1;
      thumbLength = Math.max(MIN_THUMB_LENGTH, pathLength * ratio);

      updateThumb();
    }

    function updateThumb() {
      const scrollableHeight = content!.scrollHeight - content!.clientHeight || 1;
      const scrollRatio = content!.scrollTop / scrollableHeight;
      const startOffset = (pathLength - thumbLength) * scrollRatio;
      const endOffset = startOffset + thumbLength;

      const points: string[] = [];
      for (let i = 0; i <= CURVE_SEGMENTS; i++) {
        const t = startOffset + ((endOffset - startOffset) / CURVE_SEGMENTS) * i;
        const p = track!.getPointAtLength(t);
        points.push(`${p.x} ${p.y}`);
      }
      thumb!.setAttribute('d', `M ${points[0]} ${points.slice(1).map((pt) => `L ${pt}`).join(' ')}`);
    }

    function handlePointerDown(e: PointerEvent) {
      e.preventDefault();
      dragActive = true;
      pointerId = e.pointerId;
      setDragging(true);
      thumb!.setPointerCapture(pointerId);
    }

    function handlePointerMove(e: PointerEvent) {
      if (!dragActive || e.pointerId !== pointerId) return;
      const rect = container!.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      content!.scrollTop = ratio * (content!.scrollHeight - content!.clientHeight);
      updateThumb();
    }

    function handlePointerUp(e: PointerEvent) {
      if (!dragActive || e.pointerId !== pointerId) return;
      dragActive = false;
      setDragging(false);
      try {
        thumb!.releasePointerCapture(pointerId);
      } catch {
        // pointer capture đã tự giải phóng (vd. pointer bị huỷ) — bỏ qua.
      }
      pointerId = null;
    }

    const resizeObserver = new ResizeObserver(updatePath);
    resizeObserver.observe(container);
    resizeObserver.observe(content);

    content.addEventListener('scroll', updateThumb);
    thumb.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    updatePath();

    return () => {
      resizeObserver.disconnect();
      content.removeEventListener('scroll', updateThumb);
      thumb.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const style = {
    maxHeight,
    '--curved-thumb': thumbColor,
    '--curved-thumb-active': thumbActiveColor,
  } as CSSProperties;

  return (
    <div
      ref={containerRef}
      className={cn('relative flex flex-col overflow-hidden rounded-[28px] border border-black/60 bg-white', className)}
      style={style}
    >
      <div
        ref={contentRef}
        className={cn('scrollbar-hide min-h-0 flex-1 overflow-y-auto', scrollable ? 'pr-7' : 'pr-1')}
      >
        {children}
      </div>
      {/* Luôn render SVG (kể cả khi chưa biết scrollable) để ref gắn được ngay lúc mount —
          nếu gắn/gỡ theo state scrollable thì effect bên dưới sẽ không bao giờ đọc được ref
          để tự tính scrollable, kẹt vĩnh viễn ở false. Ẩn/hiện bằng style thay vì bằng JSX. */}
      <svg className="curved-scroll-svg" style={{ display: scrollable ? undefined : 'none' }} aria-hidden="true">
        <path ref={trackRef} className="curved-scroll-track" data-dragging={dragging} />
        <path ref={thumbRef} className="curved-scroll-thumb" data-dragging={dragging} />
      </svg>
    </div>
  );
}
