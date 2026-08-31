'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, X } from 'lucide-react';
import type { Department, Tier } from '@/lib/roles';
import { departmentLabel, tierLabel } from '@/lib/roles';
import { updateOwnAvatarAction } from '@/app/dashboard/actions';
import LogoutButton from '@/components/logout-button';
import ThemeToggle from '@/components/theme-toggle';
import avatarPlaceholder from '@/public/images/avatar-placeholder.jpg';

export interface UserMenuInfo {
  fullName: string;
  username: string;
  department: Department;
  tier: Tier;
  employeeCode: string | null;
  jobTitle: string | null;
  positionTitle: string | null;
  teamLabel: string | null;
  personalEmail: string | null;
  phone: string | null;
  office: string | null;
  avatarUrl: string | null;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}

function Avatar({ url, alt, size }: { url: string | null; alt: string; size: number }) {
  return (
    <Image
      // TODO: ảnh tạm — thay bằng avatar thật khi import ảnh nhân sự.
      src={url || avatarPlaceholder}
      alt={alt}
      width={size}
      height={size}
      className="shrink-0 rounded-full border border-white/20 bg-white/10 object-cover"
      style={{ height: size, width: size }}
    />
  );
}

export default function UserMenu({ user }: { user: UserMenuInfo }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const avatarModalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.bottom + 12, right: window.innerWidth - rect.right });
    setOpen(true);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    updateOwnAvatarAction(formData)
      .then((result) => {
        setAvatarUrl(result.avatarUrl);
        router.refresh();
      })
      .catch((err) => setAvatarError(err instanceof Error ? err.message : 'Có lỗi xảy ra.'))
      .finally(() => {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
  }

  function openAvatarModal() {
    setAvatarError(null);
    setOpen(false);
    setAvatarModalOpen(true);
  }

  // Panel portals to document.body — header dùng overflow-hidden để chứa
  // glow-orb, nên panel absolute nằm trong header sẽ bị cắt cụt nếu không portal ra ngoài.
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function handleScroll() {
      setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (!avatarModalOpen) return;

    avatarModalRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !uploading) setAvatarModalOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [avatarModalOpen, uploading]);

  return (
    <div className="hidden sm:block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-3 transition hover:opacity-80"
      >
        <div className="text-right">
          <p className="font-semibold">{departmentLabel(user.department)}</p>
          <p className="flex items-center justify-end gap-1.5 text-white/60">
            {user.fullName}
            <span className={`text-[10px] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
              ▾
            </span>
          </p>
        </div>
        <Avatar url={avatarUrl} alt={user.fullName} size={40} />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {open &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            style={{ top: coords.top, right: coords.right }}
            className="fixed z-50 w-72 border border-navy/10 bg-white p-5 text-left text-ink shadow-[0_24px_48px_-20px_rgba(16,26,48,0.35)]"
          >
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Avatar url={avatarUrl} alt={user.fullName} size={56} />
                <button
                  type="button"
                  onClick={openAvatarModal}
                  disabled={uploading}
                  aria-label="Xem và chỉnh sửa ảnh đại diện"
                  className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border border-white bg-navy text-white transition hover:bg-blue disabled:opacity-50"
                >
                  <Camera size={13} strokeWidth={2.25} aria-hidden="true" />
                </button>
              </div>
              <div className="min-w-0">
                <p className="font-heading text-base font-medium text-navy">{user.fullName}</p>
                <p className="mt-0.5 text-xs text-muted">{user.username}</p>
                {uploading && <p className="mt-1 text-xs text-blue">Đang tải ảnh…</p>}
              </div>
            </div>
            {avatarError && <p className="mt-2 text-xs text-red-600">{avatarError}</p>}
            <div className="gradient-divider my-4" aria-hidden="true" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoRow label="Mã nhân viên" value={user.employeeCode ?? '—'} />
              <InfoRow label="Team" value={user.teamLabel ?? '—'} />
              <InfoRow label="Chức danh" value={user.jobTitle ?? '—'} />
              <InfoRow label="Vị trí" value={user.positionTitle ?? '—'} />
              <InfoRow label="Khối" value={departmentLabel(user.department)} />
              <InfoRow label="Quyền" value={tierLabel(user.tier)} />
              <InfoRow label="Văn phòng" value={user.office ?? '—'} />
              <InfoRow label="Điện thoại" value={user.phone ?? '—'} />
            </div>
            <div className="mt-3">
              <InfoRow label="Email cá nhân" value={user.personalEmail ?? '—'} />
            </div>
            <div className="gradient-divider my-4" aria-hidden="true" />
            <div className="mb-3 flex min-h-12 items-center justify-between gap-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Giao diện</span>
              <ThemeToggle />
            </div>
            <LogoutButton className="w-full border border-navy/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-navy transition hover:border-navy hover:bg-navy hover:text-white" />
          </div>,
          document.body
        )}

      {avatarModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] grid place-items-center bg-navy-deep/65 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !uploading) setAvatarModalOpen(false);
            }}
          >
            <div
              ref={avatarModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="avatar-modal-title"
              tabIndex={-1}
              className="relative w-full max-w-md border border-navy/10 bg-white p-6 text-ink shadow-[0_28px_70px_-24px_rgba(16,26,48,0.55)] focus:outline-none"
            >
              <button
                type="button"
                onClick={() => setAvatarModalOpen(false)}
                disabled={uploading}
                aria-label="Đóng cửa sổ ảnh đại diện"
                className="absolute right-3 top-3 grid h-11 w-11 cursor-pointer place-items-center text-muted transition-colors hover:bg-surface-2 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={20} aria-hidden="true" />
              </button>

              <div className="pr-12">
                <h2 id="avatar-modal-title" className="font-heading text-xl font-medium text-navy">
                  Ảnh đại diện
                </h2>
                <p className="mt-1 text-sm text-muted">Xem trước ảnh vuông trước khi chỉnh sửa hoặc thay đổi.</p>
              </div>

              <div className="relative mt-5 aspect-square w-full overflow-hidden bg-surface-2">
                <Image
                  src={avatarUrl || avatarPlaceholder}
                  alt={`Ảnh đại diện của ${user.fullName}`}
                  fill
                  sizes="(max-width: 640px) calc(100vw - 80px), 384px"
                  className="object-cover"
                />
              </div>

              {avatarError && <p className="mt-3 text-sm text-red-600" role="alert">{avatarError}</p>}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-5 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 bg-navy px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              >
                <Camera size={17} strokeWidth={2.25} aria-hidden="true" />
                {uploading ? 'Đang tải ảnh…' : 'Chỉnh sửa / Thay đổi ảnh'}
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
