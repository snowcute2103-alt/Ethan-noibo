'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, X } from 'lucide-react';
import type { WhatsNewItem } from '@/lib/content/whats-new';
import avatarPlaceholder from '@/public/images/avatar-placeholder.jpg';

/** Popup nổi hiện mỗi lần trang chủ load lại, gộp Thông báo + Rule mới cập nhật. Tắt đi thì gim nút chuông ở góc màn hình để mở lại. */
export default function WhatsNewModal({ items, avatarUrl }: { items: WhatsNewItem[]; avatarUrl?: string | null }) {
  const [open, setOpen] = useState(items.length > 0);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (items.length === 0) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Xem ${items.length} cập nhật mới`}
        className="fixed bottom-4 right-4 z-[60] flex h-14 w-14 items-center justify-center border-2 border-navy bg-white text-navy shadow-[0_24px_48px_-20px_rgba(16,26,48,0.45)] transition hover:bg-navy hover:text-white sm:bottom-8 sm:right-8"
      >
        <Bell size={22} strokeWidth={2.25} aria-hidden="true" />
        <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-gold text-xs font-bold text-navy">
          {items.length}
        </span>
      </button>
    );
  }

  return (
    <div
      role="presentation"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-[60] flex items-end justify-end bg-navy/30 p-4 backdrop-blur-[2px] sm:p-8"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Có gì mới"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-sm flex-col overflow-y-auto border-2 border-navy bg-white shadow-[0_24px_48px_-20px_rgba(16,26,48,0.45)]"
      >
        <div className="h-1.5 bg-gradient-to-r from-cyan via-blue-cta to-gold-2" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-blue-cta">Mới cập nhật</p>
            <h2 className="mt-1 font-heading text-xl font-medium uppercase tracking-wide text-navy">Có gì mới</h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Đóng"
            className="shrink-0 border border-navy/15 p-1.5 text-navy/60 transition hover:border-navy hover:text-navy"
          >
            <X size={16} strokeWidth={2.25} aria-hidden="true" />
          </button>
        </div>
        <ul className="mt-5 flex flex-col gap-2 px-6 pb-6">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="block border border-navy/80 bg-surface-2 px-4 py-3 transition hover:bg-navy/5"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-blue">{item.category}</span>
                <p className="mt-1 text-sm font-medium leading-snug text-ink">{item.title}</p>
                <span
                  className="mt-2 inline-flex w-fit items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs text-white"
                  style={{ background: 'linear-gradient(135deg, #1A2745 0%, #0052CC 55%, #00D2FF 100%)' }}
                >
                  <Image
                    src={avatarUrl || avatarPlaceholder}
                    alt="Từ BGĐ"
                    width={20}
                    height={20}
                    className="h-5 w-5 shrink-0 rounded-full object-cover"
                  />
                  <span className="font-semibold">BGĐ</span>
                  <span className="text-white/80">{item.date}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
