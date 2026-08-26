'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X } from 'lucide-react';
import { departmentLabel } from '@/lib/roles';
import type { BirthdayPerson } from '@/lib/users';
import avatarPlaceholder from '@/public/images/avatar-placeholder.jpg';
import BirthdayTicket from '@/components/dashboard/birthday-ticket';

/** Popup "Xem ai sinh nhật tháng này" — mở từ thẻ Chương trình sinh nhật ở trang chủ. */
export default function BirthdayModal({
  open,
  onClose,
  people,
}: {
  open: boolean;
  onClose: () => void;
  people: BirthdayPerson[];
}) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  // Portal ra document.body — Reveal (cha xa của thẻ này) giữ transform translateY(0) sau khi
  // chạy xong animate-fade-up (fill-mode "both"), biến nó thành containing block cho descendant
  // "fixed", nên nếu render tại chỗ, popup sẽ định vị theo khung Reveal thay vì viewport.
  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 p-4 backdrop-blur-[2px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sinh nhật tháng này"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_24px_48px_-20px_rgba(16,26,48,0.45)]"
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-4 sm:px-8 sm:pt-6">
          <div>
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-blue-cta">Sinh nhật</p>
            <h2 className="font-heading mt-0.5 text-lg font-medium uppercase tracking-wide text-navy">Tháng này</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="shrink-0 border border-navy/15 p-1.5 text-navy/60 transition hover:border-navy hover:text-navy"
          >
            <X size={16} strokeWidth={2.25} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 flex min-h-0 flex-col gap-2 overflow-y-auto px-5 pb-4 sm:mt-5 sm:px-8 sm:pb-6">
          {people.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Tháng này chưa có ai sinh nhật.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {people.map((person) => (
                <li
                  key={person.fullName}
                  className="flex items-center gap-2 border border-navy/10 bg-surface-2 px-3 py-2"
                >
                  <Image
                    src={person.avatarUrl || avatarPlaceholder}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{person.fullName}</p>
                    <p className="truncate text-xs text-muted">{departmentLabel(person.department)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-navy px-2.5 py-1 text-xs font-semibold text-white">
                    Ngày {person.day}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Vé luôn hiển thị trọn vẹn, không nằm trong vùng cuộn của danh sách phía trên. */}
          <BirthdayTicket />
        </div>
      </div>
    </div>,
    document.body
  );
}
