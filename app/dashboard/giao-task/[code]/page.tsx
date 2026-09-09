import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { todayIso } from '@/lib/date';
import { findOutsideTeamUserBySlug, findOutsideTeamUsersByDepartment, findTeamIdByUserId, getTeamByCode } from '@/lib/teams';
import { findUserById } from '@/lib/users';
import { getGroupDailyMemberCounts, getPersonalMonthProgress, listTasksForOwners } from '@/lib/tasks';
import { DEPARTMENTS, departmentLabel } from '@/lib/roles';
import { nameSlug } from '@/lib/name-slug';
import TaskBoard from '@/components/dashboard/task-board';
import PersonalTaskBoard from '@/components/dashboard/personal-task-board';
import { type GroupMemberStat } from '@/components/dashboard/team-group-dashboard';
import TeamTimelineChart from '@/components/dashboard/team-timeline-chart';
import TeamWorkspace from '@/components/dashboard/team-workspace';
import { loadPersonalBoardCore, loadTeamBoardCore } from '../team-board-data';
import { buildTeamTimeline } from '../nhom/timeline-data';
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

  // BGĐ mở dashboard gộp của cả 1 phòng ban ngoài 6 đội KD (vd
  // /dashboard/giao-task/it từ thẻ "IT / Development" ở khối "Bộ phận khác")
  // — chỉ BGĐ mới đi được nhánh này, đồng đội thường vào /dashboard/giao-task/nhom.
  // Cùng bộ component (TeamGroupDashboard + TeamTimelineChart + TeamMergedTaskBoard)
  // với /nhom để BGĐ thấy đúng dashboard nhóm đầy đủ như nhân sự phòng ban tự xem,
  // không phải chỉ 1 board Kanban gộp đơn giản. Không ai isSelf vì BGĐ không thuộc
  // phòng ban này — TeamGroupDashboard tự rơi về nút "quay lại" trỏ /dashboard/giao-task.
  if (isBgd) {
    const department = DEPARTMENTS.find((d) => d.id === code && d.id !== 'bgd');
    if (department) {
      const members = await findOutsideTeamUsersByDepartment(department.id);
      if (members.length === 0) redirect('/dashboard/giao-task');

      const yearMonth = today.slice(0, 7);
      const memberUserIds = members.map((member) => member.userId);
      const [stats, timeline, tasks, dayCounts] = await Promise.all([
        Promise.all(
          members.map(async (member): Promise<GroupMemberStat> => {
            const monthProgress = await getPersonalMonthProgress(member.userId, yearMonth);
            return {
              userId: member.userId,
              fullName: member.fullName,
              avatarUrl: member.avatarUrl,
              href: `/dashboard/giao-task/${nameSlug(member.fullName)}`,
              isSelf: false,
              monthProgress,
            };
          })
        ),
        buildTeamTimeline(
          members.map((member) => ({ userId: member.userId, fullName: member.fullName, isSelf: false })),
          today
        ),
        listTasksForOwners(memberUserIds, { fromDate: today, toDate: today }),
        getGroupDailyMemberCounts(memberUserIds, yearMonth),
      ]);
      const avatarByUserId = Object.fromEntries(members.map((member) => [member.userId, member.avatarUrl]));

      return (
        <>
          <TeamWorkspace
            groupLabel={departmentLabel(department.id)}
            stats={stats}
            today={today}
            members={members}
            defaultAssigneeUserId={members[0].userId}
            initialTasks={tasks}
            initialDayCounts={dayCounts}
            department={department.id}
          />
          <div className="px-4 pb-6 sm:px-6 sm:pb-8 min-[1025px]:px-10 min-[1025px]:pb-10">
            <TeamTimelineChart data={timeline} avatarByUserId={avatarByUserId} />
          </div>
        </>
      );
    }
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

  // Đồng đội cùng team_label/department được xem VÀ giao task hộ nhau (cả
  // nhóm ngang quyền) — khớp isSameTeammateGroup/requirePersonalTaskContext
  // ở actions.ts, chặn ở cả đây lẫn server action.
  const [viewer, owner] = await Promise.all([findUserById(session.userId), findUserById(person.userId)]);
  const isTeammate =
    viewer !== null &&
    owner !== null &&
    viewer.teamLabel !== null &&
    viewer.teamLabel === owner.teamLabel &&
    viewer.department === owner.department;
  if (isTeammate) {
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
