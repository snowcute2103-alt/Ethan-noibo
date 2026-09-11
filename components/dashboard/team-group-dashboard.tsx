'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export interface GroupMemberStat {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  isSelf: boolean;
  monthProgress: { done: number; total: number };
}

interface TeamGroupDashboardProps {
  groupLabel: string;
  members: GroupMemberStat[];
  /** Người đang được lọc riêng ở board gộp bên dưới (null = đang xem tất cả). */
  selectedUserId: number | null;
  /** Bấm 1 thẻ: chọn lọc đúng người đó; bấm lại thẻ đang chọn: bỏ lọc, xem lại tất cả. */
  onToggleMember: (userId: number) => void;
  /** BGĐ xem hộ phòng ban (không phải chính nhân sự phòng ban tự xem nhóm mình)
   *  mới cần nút quay lại — chính nhân sự vào thẳng nhóm mình, /dashboard/giao-task
   *  của họ chỉ redirect ngược lại đúng trang này. */
  isBgd?: boolean;
}

function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] ?? '?').toUpperCase();
}

/** Tổng quan tiến độ của cả nhóm đồng đội (cùng team_label, vd 3 người IT
 *  "Development Team") — bấm 1 thẻ để lọc board gộp bên dưới (TeamMergedTaskBoard)
 *  chỉ còn task của đúng người đó, bấm lại lần nữa để xem lại tất cả. */
export default function TeamGroupDashboard({ groupLabel, members, selectedUserId, onToggleMember, isBgd }: TeamGroupDashboardProps) {
  return (
    <div className="team-group-dashboard-page px-4 py-6 sm:px-6 sm:py-8 min-[1025px]:px-10 min-[1025px]:py-10">
      <div className="mb-6">
        {isBgd && (
          <Link
            href="/dashboard/giao-task"
            className="mb-3 flex items-center gap-1 font-heading text-xs font-bold uppercase tracking-[0.2em] text-blue hover:text-blue-cta"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Tổng quan 6 đội
          </Link>
        )}
        <h1 className="font-heading text-2xl font-semibold text-navy sm:text-3xl">Nhóm {groupLabel}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 min-[1025px]:grid-cols-3">
        {members.map((member) => {
          const isSelected = selectedUserId === member.userId;
          return (
            <button
              key={member.userId}
              type="button"
              onClick={() => onToggleMember(member.userId)}
              aria-pressed={isSelected}
              title={isSelected ? 'Bấm để xem lại task của cả nhóm' : `Bấm để chỉ xem task của ${member.fullName}`}
              className={`flex items-center justify-between gap-3 rounded-[16px] border p-4 text-left shadow-[0_10px_24px_-18px_rgba(16,26,48,0.35)] transition-colors ${
                isSelected ? 'border-blue bg-blue' : 'border-[#e8edf5] bg-white hover:bg-surface-2'
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                {member.avatarUrl ? (
                  <Image
                    src={member.avatarUrl}
                    alt=""
                    width={44}
                    height={44}
                    className={`h-11 w-11 shrink-0 rounded-full object-cover ${
                      isSelected ? 'ring-2 ring-white/60' : member.isSelf ? 'ring-2 ring-blue/40' : ''
                    }`}
                  />
                ) : (
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-heading text-base font-bold text-white ${
                      isSelected ? 'bg-white/20 ring-2 ring-white/60' : member.isSelf ? 'bg-blue ring-2 ring-blue/40' : 'bg-[#4FA3F7]'
                    }`}
                    aria-hidden="true"
                  >
                    {initialsOf(member.fullName)}
                  </span>
                )}
                <div className="min-w-0">
                  <p
                    className={`truncate font-heading text-base font-semibold uppercase ${isSelected ? 'text-white' : 'text-navy'}`}
                  >
                    {member.fullName}
                  </p>
                  {member.isSelf && (
                    <span
                      className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-blue text-white'
                      }`}
                    >
                      Bạn
                    </span>
                  )}
                </div>
              </div>

              <span
                className={`theme-light-surface shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#F1F3F7] text-navy'
                }`}
              >
                {member.monthProgress.done}/{member.monthProgress.total} hoàn thành
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
