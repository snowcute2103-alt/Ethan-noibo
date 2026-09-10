import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { todayIso } from '@/lib/date';
import { findTeamIdByUserId } from '@/lib/teams';
import { findUserById, listTeammatesByLabel } from '@/lib/users';
import TaskBoard from '@/components/dashboard/task-board';
import PersonalTaskBoard from '@/components/dashboard/personal-task-board';
import { loadPersonalBoardCore, loadTeamBoardCore, loadTeamsOverview } from './team-board-data';

export default async function GiaoTaskPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const isBgd = session.tier === 'full';
  const today = todayIso();
  const teamId = await findTeamIdByUserId(session.userId);

  if (!teamId) {
    if (!isBgd) {
      // Có đồng đội cùng team_label (vd 3 người IT) — vào thẳng dashboard
      // tổng quan nhóm theo URL phòng ban (vd /dashboard/giao-task/it, xem
      // nhánh non-BGĐ ở [code]/page.tsx) thay vì Kanban cá nhân.
      const [self, mates] = await Promise.all([findUserById(session.userId), listTeammatesByLabel(session.userId)]);
      if (self && mates.length > 0) redirect(`/dashboard/giao-task/${self.department}`);

      // Không thuộc đội KD nào, không có đồng đội, không phải BGĐ — tự quản
      // lý Kanban cá nhân của chính mình (thay cho redirect('/dashboard') trước đây).
      const initialBoard = await loadPersonalBoardCore(session.userId, today);
      return (
        <PersonalTaskBoard
          today={today}
          ownerUserId={session.userId}
          viewerUserId={session.userId}
          viewerIsBgd={false}
          initialBoard={initialBoard}
        />
      );
    }

    const overview = await loadTeamsOverview(today);
    return <TaskBoard key="overview" isBgd today={today} overview={overview} board={null} />;
  }

  const core = await loadTeamBoardCore(teamId, today);
  if (!core) redirect('/dashboard');

  return (
    <TaskBoard
      key={`team-${core.team.id}`}
      isBgd={isBgd}
      today={today}
      overview={null}
      board={{
        ...core,
        isManager: core.team.members.some((member) => member.userId === session.userId && member.role === 'manager'),
      }}
    />
  );
}
