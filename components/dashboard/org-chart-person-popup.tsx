'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { OrgChartPerson } from '@/lib/content/org-chart-people';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1]?.charAt(0).toUpperCase() ?? '?';
}

/** Popup ảnh/tên/vị trí khi bấm vào một người trong sơ đồ tổ chức ở trang chủ. */
export default function OrgChartPersonPopup({
  person,
  onClose,
}: {
  person: OrgChartPerson | null;
  onClose: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [person]);

  useEffect(() => {
    if (!person) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [person, onClose]);

  if (!person) return null;

  const showPhoto = Boolean(person.photoUrl) && !imgError;

  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 p-3 backdrop-blur-[2px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={person.name}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col items-center gap-4 rounded-[20px] bg-white p-8 text-center shadow-[0_24px_48px_-20px_rgba(16,26,48,0.45)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="self-end -m-2 -mt-2 grid h-9 w-9 place-items-center text-navy/50 transition hover:text-navy"
        >
          <X size={18} strokeWidth={2.25} aria-hidden="true" />
        </button>

        <div
          className="-mt-4 flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-surface-2 text-4xl font-semibold text-navy"
          style={{ height: 200, width: 200 }}
        >
          {showPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photoUrl!}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            initials(person.name)
          )}
        </div>

        <div>
          <p className="text-xl font-semibold text-ink">{person.name}</p>
          <p className="mt-1 text-base text-muted">{person.role}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
