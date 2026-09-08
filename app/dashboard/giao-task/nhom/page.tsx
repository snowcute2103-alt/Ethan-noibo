import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { todayIso } from '@/lib/date';
import { findTeamIdByUserId } from '@/lib/teams';
import { findUserById, listTeammatesByLabel } from '@/lib/users';
import { getPersonalMonthProgress, listTasksForOwner } from '@/lib/tasks';
import { nameSlug } from '@/lib/name-slug';
import TeamGroupDashboard, { type GroupMemberStat } from '@/components/dashboard/team-group-dashboard';
import TeamTimelineChart from '@/components/dashboard/team-timeline-chart';
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
      const [monthProgress, todayTasks] = await Promise.all([
        getPersonalMonthProgress(member.userId, yearMonth),
        listTasksForOwner(member.userId, { fromDate: today, toDate: today }),
      ]);
      let bossCount = 0;
      let notStartedCount = 0;
      let inProgressCount = 0;
      let doneCount = 0;
      for (const task of todayTasks) {
        if (task.status === 'done') doneCount++;
        else if (task.status === 'in_progress') inProgressCount++;
        else if (task.createdBy !== null && task.createdBy !== member.userId) bossCount++;
        else notStartedCount++;
      }
      return {
        userId: member.userId,
        fullName: member.fullName,
        avatarUrl: member.avatarUrl,
        href: `/dashboard/giao-task/${nameSlug(member.fullName)}`,
        isSelf: member.userId === self.id,
        monthProgress,
        bossCount,
        notStartedCount,
        inProgressCount,
        doneCount,
      };
    })
  );

  const timeline = await buildTeamTimeline(
    members.map((member) => ({ userId: member.userId, fullName: member.fullName, isSelf: member.userId === self.id })),
    today
  );
  const avatarByUserId = Object.fromEntries(members.map((member) => [member.userId, member.avatarUrl]));

  return (
    <>
      <TeamGroupDashboard groupLabel={self.teamLabel ?? 'của tôi'} monthLabel={yearMonth.slice(5, 7)} members={stats} />
      <div className="px-4 pb-6 sm:px-6 sm:pb-8 min-[1025px]:px-10 min-[1025px]:pb-10">
        <TeamTimelineChart data={timeline} avatarByUserId={avatarByUserId} />
      </div>
    </>
  );
}
