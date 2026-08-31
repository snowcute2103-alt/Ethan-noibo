'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { DepartmentGroup } from '@/lib/teams';
import { getDepartmentsOverviewAction } from '@/app/dashboard/giao-task/actions';

interface DepartmentOverviewProps {
  today: string;
  onSelectMember: (userId: number, fullName: string) => void;
}

/** Khối "Bộ phận khác" — luôn hiện ngay dưới bảng 6 đội KD trên cùng trang
 *  Tổng quan (không phải màn riêng phải chọn dropdown mới thấy), theo đúng
 *  yêu cầu gộp chung 1 trang. Chỉ là danh sách chọn người — bấm 1 người gọi
 *  onSelectMember để component cha (TaskBoard) thay hẳn nội dung trang bằng
 *  Kanban cá nhân của họ, giống cách chọn 1 đội KD. */
export default function DepartmentOverview({ today, onSelectMember }: DepartmentOverviewProps) {
  const [groups, setGroups] = useState<DepartmentGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDepartmentsOverviewAction(today.slice(0, 7))
      .then(setGroups)
      .catch((err) => setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách bộ phận.'));
  }, [today]);

  if (!error && groups.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="h-1 w-full rounded-full bg-blue" />
      <p className="mt-4 font-heading text-5xl font-light uppercase tracking-wide text-navy">Bộ phận khác</p>
      <p className="mt-0.5 text-xs text-muted">
        Nhân sự không thuộc 6 đội kinh doanh — mỗi người tự quản lý task cá nhân của mình.
      </p>

      {error && (
        <div className="mt-3 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
      )}

      <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <div key={group.department} className="rounded-[16px] border border-[#e8edf5] bg-white p-4">
            <p className="font-heading text-base font-bold text-navy">{group.departmentLabel}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {group.members.map((member) => {
                const pct = member.monthProgress.total > 0 ? Math.round((member.monthProgress.done / member.monthProgress.total) * 100) : 0;
                return (
                  <li key={member.userId}>
                    <button
                      type="button"
                      onClick={() => onSelectMember(member.userId, member.fullName)}
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
                    </button>
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
