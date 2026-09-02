'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { DepartmentGroup } from '@/lib/teams';
import { nameSlug } from '@/lib/name-slug';

interface DepartmentOverviewProps {
  groups: DepartmentGroup[];
}

/** Khối "Bộ phận khác" — luôn hiện ngay dưới bảng 6 đội KD trên cùng trang
 *  Tổng quan (không phải màn riêng phải chọn dropdown mới thấy), theo đúng
 *  yêu cầu gộp chung 1 trang. Chỉ là danh sách chọn người — bấm 1 người điều
 *  hướng thẳng tới URL Kanban cá nhân của họ (giống cách chọn 1 đội KD), giữ
 *  được bookmark/back-forward thay vì đổi state ở component cha. Dùng chung
 *  thanh chọn tháng với bảng 6 đội phía trên (yearMonth do cha truyền xuống
 *  qua `groups`). */
export default function DepartmentOverview({ groups }: DepartmentOverviewProps) {
  const router = useRouter();
  if (groups.length === 0) return null;

  // Danh sách có thể dài (mọi nhân sự ngoài 6 đội) — prefetch theo intent
  // (hover/focus/touch) thay vì để Next tự prefetch mọi route khi cuộn vào
  // viewport, tránh tải trước hàng loạt board cá nhân không ai mở tới.
  const prefetchMember = (fullName: string) => router.prefetch(`/dashboard/giao-task/${nameSlug(fullName)}`);

  return (
    <div className="mt-8">
      <div className="h-1 w-full rounded-full bg-blue" />
      <p className="mt-4 font-heading text-5xl font-light uppercase tracking-wide text-navy">Bộ phận khác</p>
      <p className="mt-0.5 text-xs text-muted">
        Nhân sự không thuộc 6 đội kinh doanh — mỗi người tự quản lý task cá nhân của mình.
      </p>

      <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <div key={group.department} className="rounded-[16px] border border-[#e8edf5] bg-white p-4">
            <p className="font-heading text-base font-bold text-navy">{group.departmentLabel}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {group.members.map((member) => {
                const pct = member.monthProgress.total > 0 ? Math.round((member.monthProgress.done / member.monthProgress.total) * 100) : 0;
                return (
                  <li key={member.userId}>
                    <Link
                      href={`/dashboard/giao-task/${nameSlug(member.fullName)}`}
                      prefetch={false}
                      onMouseEnter={() => prefetchMember(member.fullName)}
                      onFocus={() => prefetchMember(member.fullName)}
                      onTouchStart={() => prefetchMember(member.fullName)}
                      className="flex w-full items-center gap-2 rounded-[10px] px-2 py-2 text-left hover:bg-surface-2"
                    >
                      {member.avatarUrl ? (
                        <Image
                          src={member.avatarUrl}
                          alt={member.fullName}
                          width={28}
                          height={28}
                          className="h-7 w-7 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#4FA3F7] text-[10px] font-bold text-white">
                          {member.fullName.trim().split(/\s+/).slice(-1)[0]?.[0]?.toUpperCase() ?? '?'}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold uppercase text-navy">{member.fullName}</span>
                        <span className="block h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                          <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-muted">
                        {member.monthProgress.done}/{member.monthProgress.total}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
