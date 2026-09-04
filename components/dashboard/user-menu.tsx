'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle, Camera, ChevronDown } from 'lucide-react';
import type { Department, Tier } from '@/lib/roles';
import { departmentLabel, tierLabel } from '@/lib/roles';
import { updateOwnAvatarAction } from '@/app/dashboard/actions';
import LogoutButton from '@/components/logout-button';
import ThemeToggle from '@/components/theme-toggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
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

function initials(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</span>
      <span className="break-words text-sm text-ink">{value}</span>
    </div>
  );
}

function ProfileAvatar({ url, alt, size }: { url: string | null; alt: string; size: number }) {
  return (
    <Avatar className="border border-white/20 bg-white/10" style={{ height: size, width: size }}>
      <AvatarImage src={url || avatarPlaceholder.src} alt={alt} />
      <AvatarFallback>{initials(alt)}</AvatarFallback>
    </Avatar>
  );
}

export default function UserMenu({ user }: { user: UserMenuInfo }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
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
      .catch((error) => setAvatarError(error instanceof Error ? error.message : 'Có lỗi xảy ra.'))
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

  const unavailable = 'Chưa cập nhật';

  return (
    <div className="hidden sm:block">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAvatarChange}
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex min-h-11 items-center gap-3 rounded-[var(--ui-radius-control)] text-left outline-none transition-[transform,opacity] duration-150 ease-[var(--theme-ease)] hover:-translate-y-0.5 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-navy active:translate-y-px motion-reduce:transform-none motion-reduce:transition-none"
            aria-label={`Mở menu của ${user.fullName}`}
          >
            <div className="text-right">
              <p className="font-semibold text-white">{departmentLabel(user.department)}</p>
              <p className="flex items-center justify-end gap-1.5 text-white/70">
                {user.fullName}
                <ChevronDown
                  className={`size-4 transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </p>
            </div>
            <ProfileAvatar url={avatarUrl} alt={user.fullName} size={40} />
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-80 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <ProfileAvatar url={avatarUrl} alt={user.fullName} size={52} />
            <div className="min-w-0">
              <p className="truncate font-heading text-base font-semibold text-navy">{user.fullName}</p>
              <p className="truncate text-xs text-muted">@{user.username}</p>
              {uploading && <p className="mt-1 text-xs font-medium text-blue">Đang tải ảnh</p>}
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            disabled={uploading}
            onClick={() => {
              setOpen(false);
              openAvatarModal();
            }}
            className="w-full justify-start"
          >
            <Camera aria-hidden="true" />
            Xem và thay ảnh đại diện
          </Button>

          <Separator className="my-2" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-2 py-3">
            <InfoRow label="Mã nhân viên" value={user.employeeCode ?? unavailable} />
            <InfoRow label="Team" value={user.teamLabel ?? unavailable} />
            <InfoRow label="Chức danh" value={user.jobTitle ?? unavailable} />
            <InfoRow label="Vị trí" value={user.positionTitle ?? unavailable} />
            <InfoRow label="Khối" value={departmentLabel(user.department)} />
            <InfoRow label="Quyền" value={tierLabel(user.tier)} />
            <InfoRow label="Văn phòng" value={user.office ?? unavailable} />
            <InfoRow label="Điện thoại" value={user.phone ?? unavailable} />
            <div className="col-span-2">
              <InfoRow label="Email cá nhân" value={user.personalEmail ?? unavailable} />
            </div>
          </div>

          <Separator className="my-2" />
          <div className="flex min-h-14 items-center justify-between gap-4 px-2 py-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Giao diện</span>
            <ThemeToggle />
          </div>
          <Separator className="my-2" />
          <div className="pt-2">
            <LogoutButton className="min-h-11 w-full border border-[var(--theme-border)] px-4 py-2 text-sm font-semibold text-navy transition-[transform,background-color,color,border-color] duration-150 ease-[var(--theme-ease)] hover:-translate-y-0.5 hover:border-navy hover:bg-navy hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 active:translate-y-px motion-reduce:transform-none motion-reduce:transition-none" />
          </div>
        </PopoverContent>
      </Popover>

      <Dialog
        open={avatarModalOpen}
        onOpenChange={(nextOpen) => {
          if (!uploading) setAvatarModalOpen(nextOpen);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ảnh đại diện</DialogTitle>
            <DialogDescription>Xem trước ảnh vuông trước khi thay đổi.</DialogDescription>
          </DialogHeader>

          <div className="relative aspect-square w-full overflow-hidden bg-surface-2">
            <Image
              src={avatarUrl || avatarPlaceholder}
              alt={`Ảnh đại diện của ${user.fullName}`}
              fill
              sizes="(max-width: 640px) calc(100vw - 80px), 384px"
              className="object-cover"
            />
          </div>

          {avatarError && (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertDescription>{avatarError}</AlertDescription>
            </Alert>
          )}

          <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Camera aria-hidden="true" />
            {uploading ? 'Đang tải ảnh' : 'Chọn ảnh mới'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
