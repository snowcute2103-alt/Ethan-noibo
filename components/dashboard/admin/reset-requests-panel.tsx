'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, KeyRound, XCircle } from 'lucide-react';
import type { PendingResetRequest } from '@/lib/reset-requests';
import { departmentLabel } from '@/lib/roles';
import { approveResetRequestAction, dismissResetRequestAction } from '@/app/dashboard/admin/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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
    <Alert variant="warning" className="mb-8 p-6">
      <KeyRound aria-hidden="true" />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <AlertTitle>Yêu cầu đặt lại mật khẩu</AlertTitle>
          <Badge variant="warning">{requests.length} đang chờ</Badge>
        </div>
        <AlertDescription>
          Email tự động chưa gửi được. Hãy xác nhận đúng người trước khi duyệt thủ công.
        </AlertDescription>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {generated && (
        <Alert variant="success" className="mt-4 bg-surface">
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle>Mật khẩu mới đã được tạo</AlertTitle>
          <AlertDescription>Mật khẩu chỉ xuất hiện một lần. Hãy sao chép và gửi qua kênh an toàn.</AlertDescription>
          <div className="mt-3 flex flex-wrap gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Username</span>
              <code className="mt-1 block border border-[var(--theme-border)] bg-surface-2 px-4 py-2 text-sm text-ink">{generated.username}</code>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Mật khẩu mới</span>
              <code className="mt-1 block select-all border border-[var(--theme-border)] bg-surface-2 px-4 py-2 text-sm text-ink">
                {generated.password}
              </code>
            </div>
          </div>
          <Button type="button" size="sm" onClick={() => setGenerated(null)} className="mt-4">
            Đóng
          </Button>
        </Alert>
      )}

      <Separator className="my-4 bg-gold/30" />
      <ul className="grid gap-1">
        {requests.map((r) => (
          <li
            key={r.id}
            className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <span className="font-semibold text-ink">{r.fullName}</span>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                <span>@{r.username}</span>
                <Badge variant="outline">{departmentLabel(r.department)}</Badge>
                <span className="tabular-nums">{formatDateTime(r.createdAt)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => handleApprove(r.id)}
              >
                <CheckCircle2 aria-hidden="true" />
                Duyệt
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleDismiss(r.id)}
              >
                <XCircle aria-hidden="true" />
                Từ chối
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Alert>
  );
}
