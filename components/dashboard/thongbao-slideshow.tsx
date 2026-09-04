'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import avatarPlaceholder from '@/public/images/avatar-placeholder.jpg';

export interface ThongBaoSlide {
  key: string;
  label: string;
  title: string;
  excerpt: string;
  date: string;
  author?: string;
  authorAvatarUrl?: string | null;
  image?: string;
  /** Gạch đầu dòng ngắn tóm tắt (tối đa 3, hiển thị 1 dòng/gạch) — lấp khoảng trống giữa thẻ. */
  details?: string[];
  /** Nội dung đầy đủ, hiển thị trong popup khi bấm vào thẻ đang ở giữa. */
  node: ReactNode;
}

/**
 * Bảng màu kiểu giấy note (cặp nhạt/đậm) — mỗi thông báo giữ cố định 1 màu (hash theo
 * key) dù carousel xoay vị trí; thẻ chính dùng tông "strong", thẻ phụ dùng "soft".
 */
const NOTE_COLORS = [
  { soft: '#FFF4D6', strong: '#FFD873' }, // vàng
  { soft: '#E7F0FF', strong: '#8FB8FF' }, // xanh dương
  { soft: '#E3F5E1', strong: '#8FDBA0' }, // xanh lá
  { soft: '#FFE8CF', strong: '#FFB37A' }, // cam đào
  { soft: '#E9E6FB', strong: '#B7ADF2' }, // tím
];

function noteColorFor(key: string): { soft: string; strong: string } {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return NOTE_COLORS[hash % NOTE_COLORS.length];
}

function centerIndexOf(length: number): number {
  return length % 2 ? (length - 1) / 2 : length / 2;
}

/** Xoay mảng (đã sắp mới nhất trước) sao cho phần tử mới nhất rơi đúng vào vị trí giữa của carousel. */
function centerNewestFirst<T>(items: T[]): T[] {
  const n = items.length;
  if (n === 0) return items;
  const shift = (n - centerIndexOf(n)) % n;
  return [...items.slice(shift), ...items.slice(0, shift)];
}

function ThongBaoCard({
  slide,
  position,
  visible,
  avatarUrl,
  onSelect,
}: {
  slide: ThongBaoSlide;
  position: number;
  visible: boolean;
  avatarUrl?: string | null;
  onSelect: (position: number) => void;
}) {
  const isCenter = position === 0;
  const note = noteColorFor(slide.key);
  const cardColor = isCenter ? note.strong : note.soft;
  const authorAvatar = slide.author ? slide.authorAvatarUrl : avatarUrl;
  const authorInitials = slide.author
    ?.split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onSelect(position)}
      aria-label={isCenter ? `Xem đầy đủ: ${slide.title}` : `Đến thông báo: ${slide.title}`}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn(
        'notice-carousel-card theme-light-surface absolute left-1/2 top-1/2 flex flex-col items-start p-4 text-left text-navy transition-[transform,opacity,box-shadow] duration-500 ease-[var(--theme-ease)] sm:p-5 min-[1025px]:p-7',
        !visible && 'pointer-events-none opacity-0',
        isCenter ? 'z-10 shadow-[0_20px_40px_-14px_rgba(16,26,48,0.45)]' : 'z-0'
      )}
      style={{
        width: 'var(--notice-card-size)',
        height: 'var(--notice-card-size)',
        background: cardColor,
        clipPath: 'polygon(28px 0%, calc(100% - 28px) 0%, 100% 28px, 100% 100%, calc(100% - 28px) 100%, 28px 100%, 0 100%, 0 0)',
        // Gộp cả scale vào chung 1 chuỗi transform — style inline sẽ đè mất class scale-*
        // của Tailwind nếu tách riêng, khiến hiệu ứng phóng to/nhỏ không chạy.
        transform: `
          translate(-50%, -50%)
          translateX(${position * (100 / 1.5)}%)
          translateY(${isCenter ? -30 : position % 2 ? 12 : -12}px)
          rotate(${isCenter ? 0 : position % 2 ? 2 : -2}deg)
          scale(${isCenter ? 1.05 : 0.95})
        `,
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/70 sm:h-10 sm:w-10 min-[1025px]:h-11 min-[1025px]:w-11"
          title={slide.author || 'Từ Ban lãnh đạo'}
        >
          {authorAvatar ? (
            <Image
              src={authorAvatar}
              alt={slide.author || 'Ban lãnh đạo'}
              width={44}
              height={44}
              className="h-full w-full object-cover"
            />
          ) : slide.author ? (
            <span className="font-heading text-sm font-semibold tracking-wide text-navy" aria-label={slide.author}>
              {authorInitials}
            </span>
          ) : (
            <Image
              src={avatarPlaceholder}
              alt="Ban lãnh đạo"
              width={44}
              height={44}
              className="h-full w-full object-cover"
            />
          )}
        </span>
        <span className="rounded-full bg-white/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/80">
          {slide.label}
        </span>
      </div>
      {slide.author && <p className="mt-2 text-xs font-semibold text-navy/70">Người đăng: {slide.author}</p>}
      {slide.image ? (
        <div className="mt-3 flex min-h-0 w-full flex-1 items-stretch overflow-hidden rounded-xl">
          <div className="relative w-3/5 shrink-0">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              sizes="(max-width: 640px) 164px, 220px"
              loading={isCenter ? 'eager' : 'lazy'}
              className="object-contain object-left"
            />
          </div>
          <div className="flex min-w-0 flex-1 items-center px-3 sm:px-4">
            <h3
              className={cn(
                'font-heading text-sm uppercase leading-snug tracking-wide sm:text-base',
                isCenter ? 'font-medium text-navy' : 'font-light text-navy/70'
              )}
            >
              {slide.title}
            </h3>
          </div>
        </div>
      ) : (
        <>
          <h3
            className={cn(
              'font-heading mt-3 line-clamp-2 text-base uppercase tracking-wide sm:text-lg min-[1025px]:text-2xl',
              isCenter ? 'font-medium' : 'font-light text-navy/70'
            )}
          >
            {slide.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-navy/70 min-[1025px]:text-sm">{slide.excerpt}</p>
          {slide.details && slide.details.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1.5">
              {slide.details.slice(0, 3).map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-snug text-navy/60">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-navy/40" aria-hidden="true" />
                  <span className="line-clamp-1">{d}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <span
        className={cn(
          'inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-light tracking-wide text-white min-[1025px]:px-3.5 min-[1025px]:py-1.5 min-[1025px]:text-sm',
          slide.image ? 'mt-3' : 'mt-auto'
        )}
        style={{ background: 'linear-gradient(135deg, #1A2745 0%, #0052CC 55%, #00D2FF 100%)' }}
      >
        {slide.date}
      </span>
    </button>
  );
}

/** Carousel thẻ xếp lệch cho Thông báo + Chính sách + Announcement — mới nhất ghim giữa, bấm thẻ giữa để xem popup đầy đủ. */
export default function ThongBaoSlideshow({
  slides,
  avatarUrl,
}: {
  slides: ThongBaoSlide[];
  avatarUrl?: string | null;
}) {
  const [list, setList] = useState(() => centerNewestFirst(slides).map((s, i) => ({ ...s, tempId: i })));
  const [radius, setRadius] = useState(1);
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    setList(centerNewestFirst(slides).map((s, i) => ({ ...s, tempId: i })));
  }, [slides]);

  useEffect(() => {
    const updateRadius = () => {
      const isWide = window.matchMedia('(min-width: 1536px)').matches;
      // Màn rộng: đủ chỗ bung full-bleed để hiện 5 thẻ (giữa + 2 bên) không bị cắt.
      setRadius(isWide ? 2 : 1);
    };
    updateRadius();
    window.addEventListener('resize', updateRadius);
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  if (list.length === 0) return null;

  function move(steps: number) {
    setList((current) => {
      const next = [...current];
      if (steps > 0) {
        for (let i = steps; i > 0; i--) {
          const item = next.shift();
          if (!item) return current;
          next.push({ ...item, tempId: Math.random() });
        }
      } else {
        for (let i = steps; i < 0; i++) {
          const item = next.pop();
          if (!item) return current;
          next.unshift({ ...item, tempId: Math.random() });
        }
      }
      return next;
    });
  }

  function handleSelect(position: number) {
    if (position === 0) {
      setOpenKey(list[centerIndexOf(list.length)].key);
      return;
    }
    move(position);
  }

  const openSlide = list.find((s) => s.key === openKey) ?? null;

  return (
    <div>
      {/* Tràn hết chiều rộng viewport (thoát khung max-w của trang) để đủ chỗ bung thẻ 2 bên mà không bị cắt. */}
      <div
        className="notice-carousel-stage relative left-1/2 w-screen -translate-x-1/2 overflow-hidden"
      >
        {list.map((slide, index) => {
          const position = index - centerIndexOf(list.length);
          return (
            <ThongBaoCard
              key={slide.tempId}
              slide={slide}
              position={position}
              // Luôn render đủ thẻ (giữ nguyên key/DOM node) để transform + opacity chuyển động mượt
              // khi đổi vị trí — chỉ ẩn bằng opacity thay vì unmount, tránh giật cục lúc next/prev.
              visible={Math.abs(position) <= radius}
              avatarUrl={avatarUrl}
              onSelect={handleSelect}
            />
          );
        })}
      </div>

      {list.length > 1 && (
        <div className="mt-2 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => move(-1)}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-full border-2 border-navy/15 text-navy transition-[background-color,border-color,color,transform] duration-200 ease-[var(--theme-ease)] hover:-translate-y-0.5 hover:border-navy hover:bg-navy hover:text-white min-[1025px]:h-11 min-[1025px]:w-11"
            aria-label="Thông báo trước"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-full border-2 border-navy/15 text-navy transition-[background-color,border-color,color,transform] duration-200 ease-[var(--theme-ease)] hover:-translate-y-0.5 hover:border-navy hover:bg-navy hover:text-white min-[1025px]:h-11 min-[1025px]:w-11"
            aria-label="Thông báo tiếp theo"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {openSlide && (
        <div
          role="presentation"
          onClick={() => setOpenKey(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-[2px]"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={openSlide.title}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-[var(--ui-radius-panel)] bg-transparent sm:max-h-[85vh]"
          >
            <div className="sticky top-0 z-10 flex justify-end p-2">
              <button
                type="button"
                onClick={() => setOpenKey(null)}
                aria-label="Đóng"
                className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-navy/15 bg-white text-navy/70 shadow-sm transition-[transform,border-color,color] duration-200 ease-[var(--theme-ease)] hover:border-navy hover:text-navy min-[1025px]:h-11 min-[1025px]:w-11"
              >
                <X size={16} strokeWidth={2.25} aria-hidden="true" />
              </button>
            </div>
            <div className="px-1 pb-1">{openSlide.node}</div>
          </div>
        </div>
      )}
    </div>
  );
}
