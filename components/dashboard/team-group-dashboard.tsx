import Link from 'next/link';
import Image from 'next/image';

export interface GroupMemberStat {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  href: string;
  isSelf: boolean;
  monthProgress: { done: number; total: number };
  bossCount: number;
  notStartedCount: number;
  inProgressCount: number;
  doneCount: number;
}

interface TeamGroupDashboardProps {
  groupLabel: string;
  monthLabel: string;
  members: GroupMemberStat[];
}

function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] ?? '?').toUpperCase();
}

const STATUS_BADGES: { key: keyof Pick<GroupMemberStat, 'bossCount' | 'notStartedCount' | 'inProgressCount' | 'doneCount'>; label: string; dot: string }[] = [
  { key: 'bossCount', label: 'Sếp đưa', dot: 'bg-gold' },
  { key: 'notStartedCount', label: 'Chưa làm', dot: 'bg-[#8B95A8]' },
  { key: 'inProgressCount', label: 'Đang làm', dot: 'bg-blue' },
  { key: 'doneCount', label: 'Hoàn thành', dot: 'bg-emerald-500' },
];

/** Dashboard gộp task của cả nhóm đồng đội (cùng team_label, vd 3 người IT
 *  "Development Team") — bấm vào 1 thẻ vẫn điều hướng sang đúng board Kanban
 *  cá nhân đã có từ trước (/dashboard/giao-task hoặc /[slug-tên]), không đổi
 *  UI chi tiết. */
export default function TeamGroupDashboard({ groupLabel, monthLabel, members }: TeamGroupDashboardProps) {
  // /dashboard/giao-task giờ tự chuyển hướng về /nhom cho người có đồng đội
  // (xem page.tsx gốc), nên nút quay lại phải trỏ thẳng vào board cá nhân
  // của chính mình theo slug — trỏ về root sẽ tạo vòng lặp redirect.
  const selfHref = members.find((member) => member.isSelf)?.href ?? '/dashboard/giao-task';
  return (
    <div className="team-group-dashboard-page px-4 py-6 sm:px-6 sm:py-8 min-[1025px]:px-10 min-[1025px]:py-10">
      <div className="mb-6">
        <Link
          href={selfHref}
          className="flex items-center gap-1 font-heading text-xs font-bold uppercase tracking-[0.2em] text-blue hover:text-blue-cta"
        >
          ← Task của tôi
        </Link>
        <h1 className="mt-1 font-heading text-2xl font-semibold text-navy sm:text-3xl">Nhóm {groupLabel}</h1>
        <p className="mt-1 text-sm text-muted">Tổng quan task hôm nay và tiến độ tháng {monthLabel} của cả nhóm.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 min-[1025px]:grid-cols-3">
        {members.map((member) => (
          <Link
            key={member.userId}
            href={member.href}
            className={`flex flex-col gap-3 rounded-[16px] border p-4 shadow-[0_10px_24px_-18px_rgba(16,26,48,0.35)] transition-transform hover:-translate-y-0.5 ${
              member.isSelf ? 'border-blue bg-blue/5 ring-2 ring-blue/40' : 'border-[#e8edf5] bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              {member.avatarUrl ? (
                <Image
                  src={member.avatarUrl}
                  alt=""
                  width={44}
                  height={44}
                  className={`h-11 w-11 shrink-0 rounded-full object-cover ${member.isSelf ? 'ring-2 ring-blue/40' : ''}`}
                />
              ) : (
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-heading text-base font-bold text-white ${
                    member.isSelf ? 'bg-blue ring-2 ring-blue/40' : 'bg-[#4FA3F7]'
                  }`}
                  aria-hidden="true"
                >
                  {initialsOf(member.fullName)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-heading text-base font-semibold uppercase text-navy">{member.fullName}</p>
                {member.isSelf && (
                  <span className="mt-0.5 inline-block rounded-full bg-blue px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Bạn
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {STATUS_BADGES.map((badge) => (
                <span key={badge.key} className="flex items-center gap-1.5 text-xs font-medium text-navy">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${badge.dot}`} aria-hidden="true" />
                  {badge.label} <strong className="font-bold">{member[badge.key]}</strong>
                </span>
              ))}
            </div>

            <div className="theme-light-surface rounded-[10px] bg-[#F1F3F7] px-3 py-2 text-xs font-semibold text-navy">
              Tiến độ tháng: {member.monthProgress.done}/{member.monthProgress.total} hoàn thành
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
