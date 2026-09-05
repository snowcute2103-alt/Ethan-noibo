'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X } from 'lucide-react';
import { departmentLabel } from '@/lib/roles';
import type { BirthdayPerson } from '@/lib/users';
import avatarPlaceholder from '@/public/images/avatar-placeholder.jpg';
import BirthdayTicket from '@/components/dashboard/birthday-ticket';

const MONTH_TITLE: Record<number, string> = {
  [-1]: 'Tháng trước',
  0: 'Tháng này',
  1: 'Tháng sau',
};

/** Popup "Xem ai sinh nhật tháng trước/này/sau" — mở từ thẻ Chương trình sinh nhật ở trang chủ.
 *  `monthOffset` chọn tháng cần xem (-1/0/1); offset 0 dùng `peopleThisMonth` đã SSR sẵn, offset
 *  khác 0 tự fetch qua /api/birthdays vì trang chủ chỉ render sẵn dữ liệu tháng hiện tại. */
export default function BirthdayModal({
  open,
  onClose,
  monthOffset,
  peopleThisMonth,
}: {
  open: boolean;
  onClose: () => void;
  monthOffset: number;
  peopleThisMonth: BirthdayPerson[];
}) {
  const [people, setPeople] = useState<BirthdayPerson[]>(peopleThisMonth);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (monthOffset === 0) {
      setPeople(peopleThisMonth);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/birthdays?offset=${monthOffset}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPeople(Array.isArray(data.people) ? data.people : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, monthOffset, peopleThisMonth]);

  if (!open) return null;

  // Portal ra document.body — Reveal (cha xa của thẻ này) giữ transform translateY(0) sau khi
  // chạy xong animate-fade-up (fill-mode "both"), biến nó thành containing block cho descendant
  // "fixed", nên nếu render tại chỗ, popup sẽ định vị theo khung Reveal thay vì viewport.
  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 p-3 backdrop-blur-[2px] min-[1025px]:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Sinh nhật ${MONTH_TITLE[monthOffset] ?? 'tháng này'}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_24px_48px_-20px_rgba(16,26,48,0.45)] min-[1025px]:max-h-[96vh] min-[1025px]:rounded-[20px]"
      >
        <div className="flex items-start justify-between gap-3 px-4 pt-3 sm:px-5 sm:pt-4 min-[1025px]:gap-4 min-[1025px]:px-8 min-[1025px]:pt-6">
          <div>
            <p className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-blue-cta">Sinh nhật</p>
            <h2 className="font-heading mt-0.5 text-lg font-medium uppercase tracking-wide text-navy">
              {MONTH_TITLE[monthOffset] ?? 'Tháng này'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="grid h-[44px] w-[44px] shrink-0 place-items-center border border-navy/15 text-navy/60 transition hover:border-navy hover:text-navy min-[1025px]:h-auto min-[1025px]:w-auto min-[1025px]:p-1.5"
          >
            <X size={16} strokeWidth={2.25} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3 flex min-h-0 flex-col gap-2 overflow-y-auto px-4 pb-3 sm:mt-4 sm:px-5 sm:pb-4 min-[1025px]:mt-5 min-[1025px]:px-8 min-[1025px]:pb-6">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted">Đang tải...</p>
          ) : people.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              {(MONTH_TITLE[monthOffset] ?? 'Tháng này') + ' chưa có ai sinh nhật.'}
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 min-[1025px]:grid-cols-3">
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
