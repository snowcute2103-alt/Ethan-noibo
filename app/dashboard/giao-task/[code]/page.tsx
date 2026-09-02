import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { todayIso } from '@/lib/date';
import { findOutsideTeamUserBySlug, findTeamIdByUserId, getTeamByCode } from '@/lib/teams';
import TaskBoard from '@/components/dashboard/task-board';
import PersonalTaskBoard from '@/components/dashboard/personal-task-board';
import { loadPersonalBoardCore, loadTeamBoardCore } from '../team-board-data';
import PersonalBoardRoute from './personal-board-route';

interface PageProps {
  params: Promise<{ code: string }>;
}

/** URL thật cho 1 đội (vd /dashboard/giao-task/kd2) hoặc 1 người ngoài 6 đội
 *  (vd /dashboard/giao-task/phamthanhanhtuyet, slug từ họ tên — xem
 *  lib/name-slug.ts) — bấm được/bookmark được/back-forward được, thay vì chỉ
 *  đổi state React như trước. Thử khớp mã đội trước, không khớp thì thử khớp
 *  người; sai quyền hoặc không khớp gì thì quay về /dashboard/giao-task. */
export default async function GiaoTaskCodePage({ params }: PageProps) {
  const { code } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const isBgd = session.tier === 'full';
  const today = todayIso();

  // getTeamByCode và findTeamIdByUserId không phụ thuộc nhau — chạy song
  // song ngay từ đầu thay vì nối tiếp.
  const [teamRow, ownTeamId] = await Promise.all([
    getTeamByCode(code),
    isBgd ? Promise.resolve(null) : findTeamIdByUserId(session.userId),
  ]);
  if (teamRow) {
    if (!isBgd && ownTeamId !== teamRow.id) redirect('/dashboard/giao-task');

    // BGĐ xem hộ đội khác luôn có quyền thao tác như quản lý (khớp
    // getTeamBoardAsBgdAction); chính thành viên/quản lý thì theo đúng vai
    // trò thật của họ trong đội. core/isManager/overview độc lập nhau nên
    // gộp chung 1 Promise.all thay vì await tuần tự.
    const core = await loadTeamBoardCore(teamRow.id, today);
    if (!core) redirect('/dashboard/giao-task');
    const isManager =
      isBgd || core.team.members.some((member) => member.userId === session.userId && member.role === 'manager');

    return (
      <TaskBoard key={`team-${core.team.id}`} isBgd={isBgd} today={today} overview={null} board={{ ...core, isManager }} />
    );
  }

  const person = await findOutsideTeamUserBySlug(code);
  if (!person) redirect('/dashboard/giao-task');

  // Task cá nhân: chỉ chính chủ hoặc BGĐ (khớp requirePersonalTaskContext ở
  // actions.ts) — người khác gõ đúng URL vẫn bị chặn ở đây, không chỉ ẩn UI.
  if (session.userId === person.userId) {
    const initialBoard = await loadPersonalBoardCore(person.userId, today);
    return (
      <PersonalTaskBoard
        today={today}
        ownerUserId={person.userId}
        viewerIsBgd={false}
        ownerAvatarUrl={person.avatarUrl}
        initialBoard={initialBoard}
      />
    );
  }
  if (isBgd) {
    const initialBoard = await loadPersonalBoardCore(person.userId, today);
    return (
      <PersonalBoardRoute
        today={today}
        ownerUserId={person.userId}
        ownerName={person.fullName}
        ownerAvatarUrl={person.avatarUrl}
        initialBoard={initialBoard}
      />
    );
  }
  redirect('/dashboard/giao-task');
}
