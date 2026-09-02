import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { todayIso } from '@/lib/date';
import { findTeamIdByUserId } from '@/lib/teams';
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
      // Không thuộc đội KD nào và không phải BGĐ — tự quản lý Kanban cá
      // nhân của chính mình (thay cho redirect('/dashboard') trước đây).
      const initialBoard = await loadPersonalBoardCore(session.userId, today);
      return <PersonalTaskBoard today={today} ownerUserId={session.userId} viewerIsBgd={false} initialBoard={initialBoard} />;
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
