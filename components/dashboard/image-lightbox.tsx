'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import Image from 'next/image';
import { Minus, Plus, RotateCcw, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ImageLightboxProps {
  src: string | null;
  alt: string;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.4;

type Point = { x: number; y: number };
type Gesture = { mode: 'pan'; startX: number; startY: number; originX: number; originY: number } | { mode: 'pinch'; initialDistance: number; initialScale: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distanceOf(points: Point[]) {
  const [a, b] = points;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, Point>());
  const gestureRef = useRef<Gesture | null>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [src]);

  function clampTranslate(nextScale: number, current: Point) {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || nextScale <= MIN_SCALE) return { x: 0, y: 0 };
    const maxX = (rect.width * (nextScale - 1)) / (2 * nextScale);
    const maxY = (rect.height * (nextScale - 1)) / (2 * nextScale);
    return { x: clamp(current.x, -maxX, maxX), y: clamp(current.y, -maxY, maxY) };
  }

  function zoomTo(nextScale: number) {
    const clamped = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    setScale(clamped);
    setTranslate((current) => clampTranslate(clamped, current));
  }

  function handleWheel(e: ReactWheelEvent<HTMLDivElement>) {
    e.preventDefault();
    zoomTo(scale + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
  }

  function handleDoubleClick() {
    zoomTo(scale > MIN_SCALE ? MIN_SCALE : 2.4);
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      gestureRef.current = { mode: 'pinch', initialDistance: distanceOf(Array.from(pointersRef.current.values())), initialScale: scale };
    } else if (pointersRef.current.size === 1 && scale > MIN_SCALE) {
      gestureRef.current = { mode: 'pan', startX: e.clientX, startY: e.clientY, originX: translate.x, originY: translate.y };
      setIsPanning(true);
    }
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const gesture = gestureRef.current;
    if (gesture?.mode === 'pinch' && pointersRef.current.size === 2) {
      const currentDistance = distanceOf(Array.from(pointersRef.current.values()));
      if (gesture.initialDistance > 0) zoomTo(gesture.initialScale * (currentDistance / gesture.initialDistance));
    } else if (gesture?.mode === 'pan') {
      const dx = (e.clientX - gesture.startX) / scale;
      const dy = (e.clientY - gesture.startY) / scale;
      setTranslate(clampTranslate(scale, { x: gesture.originX + dx, y: gesture.originY + dy }));
    }
  }

  function endPointer(e: ReactPointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) gestureRef.current = null;
    if (pointersRef.current.size === 0) setIsPanning(false);
  }

  const zoomPercent = Math.round(scale * 100);

  return (
    <Dialog open={src !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-[min(96vw,1100px)] border-none bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        {src && (
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-deep p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)] sm:p-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <div
              ref={frameRef}
              onWheel={handleWheel}
              onDoubleClick={handleDoubleClick}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endPointer}
              onPointerCancel={endPointer}
              className="relative h-[68vh] w-full touch-none select-none overflow-hidden rounded-[10px] sm:h-[76vh]"
              style={{ cursor: scale > MIN_SCALE ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in' }}
            >
              <div
                className="absolute inset-0"
                style={{
                  transform: `scale(${scale}) translate(${translate.x}px, ${translate.y}px)`,
                  transition: isPanning || gestureRef.current?.mode === 'pinch' ? 'none' : 'transform 150ms ease-out',
                }}
              >
                <Image src={src} alt={alt} fill sizes="96vw" className="object-contain" draggable={false} />
              </div>
            </div>
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/50 px-2 py-1.5 backdrop-blur">
              <button
                type="button"
                onClick={() => zoomTo(scale - ZOOM_STEP)}
                disabled={scale <= MIN_SCALE}
                aria-label="Thu nhỏ"
                className="grid h-7 w-7 place-items-center rounded-full text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="w-11 text-center text-[11px] font-semibold tabular-nums text-white/85">{zoomPercent}%</span>
              <button
                type="button"
                onClick={() => zoomTo(scale + ZOOM_STEP)}
                disabled={scale >= MAX_SCALE}
                aria-label="Phóng to"
                className="grid h-7 w-7 place-items-center rounded-full text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => zoomTo(1)}
                disabled={scale === MIN_SCALE}
                aria-label="Đặt lại độ zoom"
                className="ml-0.5 grid h-7 w-7 place-items-center rounded-full text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
