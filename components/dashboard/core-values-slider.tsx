'use client';

import { useRef, useState } from 'react';
import Image, { type StaticImageData } from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CoreValueSlide {
  title: string;
  image: StaticImageData;
}

interface CoreValuesSliderProps {
  slides: CoreValueSlide[];
}

const SWIPE_THRESHOLD_RATIO = 0.15;
const EDGE_DRAG_RESISTANCE = 0.35;

/** Slider ảnh nền full-bleed cho "5 giá trị cốt lõi" — kéo/vuốt, chấm điều hướng, mũi tên 2 bên,
 *  phím trái/phải. Mỗi slide = 1 giá trị + ảnh thật từ ethanecom.com, overlay gradient navy để chữ nổi rõ. */
export function CoreValuesSlider({ slides }: CoreValuesSliderProps) {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const widthRef = useRef(0);
  const dragXRef = useRef(0);

  const count = slides.length;

  function goTo(next: number) {
    setIndex(Math.max(0, Math.min(count - 1, next)));
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!trackRef.current || count <= 1) return;
    draggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.clientX;
    widthRef.current = trackRef.current.offsetWidth;
    trackRef.current.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    let diff = e.clientX - startXRef.current;
    if ((index === 0 && diff > 0) || (index === count - 1 && diff < 0)) {
      diff *= EDGE_DRAG_RESISTANCE;
    }
    dragXRef.current = diff;
    setDragX(diff);
  }

  function endDrag() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    const threshold = widthRef.current * SWIPE_THRESHOLD_RATIO;
    if (dragXRef.current <= -threshold) goTo(index + 1);
    else if (dragXRef.current >= threshold) goTo(index - 1);
    dragXRef.current = 0;
    setDragX(0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowRight') goTo(index + 1);
    if (e.key === 'ArrowLeft') goTo(index - 1);
  }

  const dragPercent = widthRef.current ? (dragX / widthRef.current) * 100 : 0;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="5 giá trị cốt lõi"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative w-full overflow-hidden outline-none"
    >
      <div aria-live="polite" className="sr-only">
        {slides[index]?.title}
      </div>

      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => draggingRef.current && endDrag()}
        className={`flex touch-pan-y cursor-grab select-none active:cursor-grabbing ${
          isDragging ? '' : 'transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]'
        }`}
        style={{ transform: `translateX(${-index * 100 + dragPercent}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.title}
            aria-hidden={i !== index}
            className="relative h-[58vh] min-h-[380px] w-full shrink-0 sm:min-h-[460px] md:h-[64vh] md:max-h-[620px]"
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              draggable={false}
              className="pointer-events-none object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/55 to-navy-deep/20"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-navy-deep/25" aria-hidden="true" />
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <p className="font-heading text-center text-[clamp(2.25rem,7vw,5.5rem)] font-black uppercase leading-[1.05] tracking-tight text-white drop-shadow-[0_6px_28px_rgba(0,0,0,0.55)]">
                {slide.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {index > 0 && (
        <button
          type="button"
          aria-label="Giá trị trước"
          onClick={() => goTo(index - 1)}
          className="group absolute left-0 top-0 z-20 flex h-full w-[12%] min-w-12 items-center justify-start bg-gradient-to-r from-black/25 to-transparent opacity-0 outline-none transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100"
        >
          <ChevronLeft
            size={28}
            strokeWidth={2.5}
            className="ml-3 text-white transition-transform duration-300 group-hover:-translate-x-1"
            aria-hidden="true"
          />
        </button>
      )}
      {index < count - 1 && (
        <button
          type="button"
          aria-label="Giá trị tiếp theo"
          onClick={() => goTo(index + 1)}
          className="group absolute right-0 top-0 z-20 flex h-full w-[12%] min-w-12 items-center justify-end bg-gradient-to-l from-black/25 to-transparent opacity-0 outline-none transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100"
        >
          <ChevronRight
            size={28}
            strokeWidth={2.5}
            className="mr-3 text-white transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </button>
      )}

      <ul className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-3">
        {slides.map((slide, i) => (
          <li key={slide.title}>
            <button
              type="button"
              aria-label={`Xem ${slide.title}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
              className={`block h-2.5 w-2.5 rounded-full border-2 border-white transition-all duration-300 ${
                i === index ? 'scale-110 bg-white' : 'bg-transparent hover:bg-white/50'
              }`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
