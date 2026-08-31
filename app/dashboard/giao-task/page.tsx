import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { todayIso } from '@/lib/date';
import { findTeamIdByUserId, isTeamManager } from '@/lib/teams';
import TaskBoard from '@/components/dashboard/task-board';
import PersonalTaskBoard from '@/components/dashboard/personal-task-board';
import { loadTeamBoardCore, loadTeamsOverview } from './team-board-data';

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
      return <PersonalTaskBoard today={today} ownerUserId={session.userId} viewerIsBgd={false} />;
    }

    const overview = await loadTeamsOverview(today);
    return <TaskBoard key="overview" isBgd today={today} overview={overview} board={null} />;
  }

  // isManager và overview không phụ thuộc kết quả của core — chạy song song
  // thay vì await nối tiếp để không cộng dồn round-trip vào thời gian tải
  // trang.
  const [core, isManager, overview] = await Promise.all([
    loadTeamBoardCore(teamId, today),
    isTeamManager(teamId, session.userId),
    isBgd ? loadTeamsOverview(today) : Promise.resolve(null),
  ]);
  if (!core) redirect('/dashboard');

  return (
    <TaskBoard
      key={`team-${core.team.id}`}
      isBgd={isBgd}
      today={today}
      overview={overview}
      board={{ ...core, isManager }}
    />
  );
}
