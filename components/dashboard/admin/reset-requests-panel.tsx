'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { PendingResetRequest } from '@/lib/reset-requests';
import { departmentLabel } from '@/lib/roles';
import { approveResetRequestAction, dismissResetRequestAction } from '@/app/dashboard/admin/actions';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

export default function ResetRequestsPanel({ requests }: { requests: PendingResetRequest[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{ username: string; password: string } | null>(null);

  function handleApprove(requestId: number) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await approveResetRequestAction(requestId);
        setGenerated(result);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  function handleDismiss(requestId: number) {
    setError(null);
    startTransition(async () => {
      try {
        await dismissResetRequestAction(requestId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  if (requests.length === 0) return null;

  return (
    <div className="mb-8 border-2 border-gold/60 bg-[#fffaf0] p-6">
      <p className="font-heading text-lg font-medium text-navy">
        Yêu cầu đặt lại mật khẩu <span className="text-gold-2">({requests.length})</span>
      </p>
      <p className="mt-1 text-sm text-muted">
        Hệ thống không gửi được email tự động cho các yêu cầu này (kiểm tra RESEND_API_KEY/domain) — xác nhận đúng
        người rồi duyệt tay bên dưới.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {generated && (
        <div className="mt-4 border-2 border-navy bg-white p-5">
          <p className="text-sm text-muted">
            Đây là lần DUY NHẤT mật khẩu hiện ra — copy ngay và gửi cho nhân viên qua kênh an toàn.
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Username</span>
              <code className="mt-1 block border border-[#e0e7f3] bg-[#fafbff] px-4 py-2 text-sm">{generated.username}</code>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Mật khẩu mới</span>
              <code className="mt-1 block select-all border border-[#e0e7f3] bg-[#fafbff] px-4 py-2 text-sm">
                {generated.password}
              </code>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setGenerated(null)}
            className="mt-4 bg-navy px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-gold hover:text-navy"
          >
            Đóng
          </button>
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {requests.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 border border-navy/10 bg-white px-4 py-3"
          >
            <div>
              <span className="font-semibold text-ink">{r.fullName}</span>
              <span className="ml-2 text-sm text-muted">
                @{r.username} · {departmentLabel(r.department)} · {formatDateTime(r.createdAt)}
              </span>
            </div>
            <div className="flex gap-3 text-xs font-semibold uppercase tracking-wide">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleApprove(r.id)}
                className="text-blue hover:underline disabled:opacity-50"
              >
                Duyệt (sinh mật khẩu mới)
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDismiss(r.id)}
                className="text-red-600 hover:underline disabled:opacity-50"
              >
                Từ chối
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
