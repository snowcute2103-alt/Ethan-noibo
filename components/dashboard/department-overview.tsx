import Image from 'next/image';
import Link from 'next/link';
import type { DepartmentGroup } from '@/lib/teams';

interface DepartmentOverviewProps {
  groups: DepartmentGroup[];
}

/** Khối "Bộ phận khác" — luôn hiện ngay dưới bảng 6 đội KD trên cùng trang
 *  Tổng quan (không phải màn riêng phải chọn dropdown mới thấy), theo đúng
 *  yêu cầu gộp chung 1 trang. Cả tiêu đề phòng ban lẫn từng người trong danh
 *  sách đều trỏ về cùng 1 URL board gộp của phòng ban đó (vd IT/Development
 *  3 người dùng chung 1 board) thay vì tách mỗi người 1 trang Kanban cá nhân
 *  riêng — giữ được bookmark/back-forward thay vì đổi state ở component cha.
 *  Dùng chung thanh chọn tháng với bảng 6 đội phía trên (yearMonth do cha
 *  truyền xuống qua `groups`). */
export default function DepartmentOverview({ groups }: DepartmentOverviewProps) {
  if (groups.length === 0) return null;

  return (
    <div className="mt-6 border-t-2 border-[#dbe4f2] pt-6 min-[1025px]:mt-10 min-[1025px]:pt-10">
      <p className="font-heading text-2xl font-light uppercase tracking-wide text-navy sm:text-3xl min-[1025px]:text-5xl">Bộ phận khác</p>
      <p className="mt-0.5 text-xs text-muted">
        Nhân sự không thuộc 6 đội kinh doanh. Mỗi phòng ban dùng chung 1 board task.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 min-[1025px]:mt-4 min-[1025px]:gap-5 xl:grid-cols-3">
        {groups.map((group) => (
          <div key={group.department} className="stat-panel rounded-[16px] bg-white p-3 min-[1025px]:p-4">
            <Link
              href={`/dashboard/giao-task/${group.department}`}
              className="font-heading text-base font-bold text-navy underline decoration-transparent underline-offset-2 hover:decoration-navy/40"
            >
              {group.departmentLabel}
            </Link>
            <ul className="mt-3 flex flex-col gap-2">
              {group.members.map((member) => {
                const pct = member.monthProgress.total > 0 ? Math.round((member.monthProgress.done / member.monthProgress.total) * 100) : 0;
                return (
                  <li key={member.userId}>
                    <Link
                      href={`/dashboard/giao-task/${group.department}`}
                      className="flex w-full items-center gap-2 rounded-[10px] px-2 py-2 text-left transition-colors duration-150 hover:bg-surface-2"
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
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-muted">
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
