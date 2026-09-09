import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { todayIso } from '@/lib/date';
import { findTeamIdByUserId } from '@/lib/teams';
import { findUserById, listTeammatesByLabel } from '@/lib/users';
import { getGroupDailyMemberCounts, getPersonalMonthProgress, listTasksForOwners } from '@/lib/tasks';
import { nameSlug } from '@/lib/name-slug';
import { type GroupMemberStat } from '@/components/dashboard/team-group-dashboard';
import TeamTimelineChart from '@/components/dashboard/team-timeline-chart';
import TeamWorkspace from '@/components/dashboard/team-workspace';
import { buildTeamTimeline } from './timeline-data';

/** Dashboard gộp task của nhóm đồng đội (cùng team_label + department, vd 3
 *  người IT "Development Team") — chỉ có ý nghĩa cho người ngoài 6 đội KD,
 *  không phải BGĐ, và thực sự có đồng đội; các trường hợp khác quay về
 *  /dashboard/giao-task như cũ. Bấm vào 1 thẻ vẫn điều hướng sang board
 *  Kanban cá nhân đã có (page.tsx / [code]/page.tsx), không đổi UI chi tiết. */
export default async function GiaoTaskNhomPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.tier === 'full') redirect('/dashboard/giao-task');

  const [ownTeamId, self, mates] = await Promise.all([
    findTeamIdByUserId(session.userId),
    findUserById(session.userId),
    listTeammatesByLabel(session.userId),
  ]);
  if (ownTeamId !== null || !self || self.department === 'bgd' || mates.length === 0) {
    redirect('/dashboard/giao-task');
  }

  const today = todayIso();
  const yearMonth = today.slice(0, 7);
  const members = [{ userId: self.id, fullName: self.fullName, avatarUrl: self.avatarUrl }, ...mates];

  const stats = await Promise.all(
    members.map(async (member): Promise<GroupMemberStat> => {
      const monthProgress = await getPersonalMonthProgress(member.userId, yearMonth);
      return {
        userId: member.userId,
        fullName: member.fullName,
        avatarUrl: member.avatarUrl,
        href: `/dashboard/giao-task/${nameSlug(member.fullName)}`,
        isSelf: member.userId === self.id,
        monthProgress,
      };
    })
  );

  const timeline = await buildTeamTimeline(
    members.map((member) => ({ userId: member.userId, fullName: member.fullName, isSelf: member.userId === self.id })),
    today
  );
  const avatarByUserId = Object.fromEntries(members.map((member) => [member.userId, member.avatarUrl]));
  const memberUserIds = members.map((member) => member.userId);
  const [mergedTasks, dayCounts] = await Promise.all([
    listTasksForOwners(memberUserIds, { fromDate: today, toDate: today }),
    getGroupDailyMemberCounts(memberUserIds, yearMonth),
  ]);

  return (
    <>
      <TeamWorkspace
        groupLabel={self.teamLabel ?? 'của tôi'}
        stats={stats}
        today={today}
        members={members}
        defaultAssigneeUserId={self.id}
        initialTasks={mergedTasks}
        initialDayCounts={dayCounts}
      />
      <div className="px-4 pb-6 sm:px-6 sm:pb-8 min-[1025px]:px-10 min-[1025px]:pb-10">
        <TeamTimelineChart data={timeline} avatarByUserId={avatarByUserId} />
      </div>
    </>
  );
}
