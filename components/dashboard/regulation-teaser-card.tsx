'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Image, { type StaticImageData } from 'next/image';
import { X } from 'lucide-react';

/**
 * Thẻ nhỏ kiểu "rail" báo in cho nội dung phụ (Chính sách/Thông báo dạng quy định) đi kèm SOP —
 * bấm vào mở popup hiện nguyên component chi tiết có sẵn (PolicyCard/NoticeBanner) qua `children`,
 * không dựng lại UI chi tiết riêng để tránh trùng lặp.
 */
export default function RegulationTeaserCard({
  image,
  kicker,
  title,
  intro,
  meta,
  children,
}: {
  image: StaticImageData;
  kicker: string;
  title: string;
  intro: string;
  meta: string;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        className="group flex w-full flex-col gap-3 border-t border-navy/15 pt-6 text-left first:border-t-0 first:pt-0"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-2">
          <Image src={image} alt={title} fill sizes="340px" className="object-cover" />
        </div>
        <div>
          <p className="font-heading text-[10px] font-bold uppercase tracking-[0.25em] text-navy/50">{kicker}</p>
          <h4 className="mt-1.5 font-serif text-lg font-bold leading-snug tracking-tight text-navy group-hover:underline">
            {title}
          </h4>
          <p className="mt-1.5 line-clamp-2 font-serif text-sm italic leading-relaxed text-muted">{intro}</p>
          <p className="mt-1.5 font-heading text-[11px] font-semibold uppercase tracking-wide text-navy/40">{meta}</p>
        </div>
      </button>

      {isOpen && (
        <div
          role="presentation"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/60 p-3 backdrop-blur-sm sm:items-center sm:p-6"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            className="relative my-8 w-full max-w-2xl sm:my-0"
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng"
              className="absolute -right-3 -top-3 z-20 flex h-10 w-10 items-center justify-center border border-navy/15 bg-white text-navy/70 shadow-sm transition hover:border-navy hover:text-navy"
            >
              <X size={18} strokeWidth={2.25} aria-hidden="true" />
            </button>
            <div className="max-h-[85vh] overflow-y-auto">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
