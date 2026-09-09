import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { todayIso } from '@/lib/date';
import { findOutsideTeamUserBySlug, findOutsideTeamUsersByDepartment, findTeamIdByUserId, getTeamByCode } from '@/lib/teams';
import { findUserById, listTeammatesByLabel } from '@/lib/users';
import { getGroupDailyMemberCounts, getPersonalMonthProgress, listTasksForOwners } from '@/lib/tasks';
import { DEPARTMENTS, departmentLabel, type Department } from '@/lib/roles';
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

interface GroupWorkspaceMember {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
}

/** Dùng chung cho cả 2 audience của 1 phòng ban ngoài 6 đội KD (vd "IT /
 *  Development"): BGĐ xem hộ cả phòng ban (department có giá trị, không ai
 *  isSelf) và chính nhân sự phòng ban đó tự xem nhóm mình (selfUserId là
 *  session.userId, department để trống nên TeamMergedTaskBoard gọi đúng
 *  getMergedTeamBoardAction thay vì action chỉ BGĐ mới gọi được). Gộp 1 chỗ
 *  để tránh lặp lại đúng khối Promise.all này 2 lần trong cùng file. */
async function renderGroupWorkspace(
  today: string,
  members: GroupWorkspaceMember[],
  groupLabel: string,
  defaultAssigneeUserId: number,
  selfUserId: number | null,
  department?: Department
) {
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
          isSelf: member.userId === selfUserId,
          monthProgress,
        };
      })
    ),
    buildTeamTimeline(
      members.map((member) => ({ userId: member.userId, fullName: member.fullName, isSelf: member.userId === selfUserId })),
      today
    ),
    listTasksForOwners(memberUserIds, { fromDate: today, toDate: today }),
    getGroupDailyMemberCounts(memberUserIds, yearMonth),
  ]);
  const avatarByUserId = Object.fromEntries(members.map((member) => [member.userId, member.avatarUrl]));

  return (
    <>
      <TeamWorkspace
        groupLabel={groupLabel}
        stats={stats}
        today={today}
        members={members}
        defaultAssigneeUserId={defaultAssigneeUserId}
        initialTasks={tasks}
        initialDayCounts={dayCounts}
        department={department}
      />
      <div className="px-4 pb-6 sm:px-6 sm:pb-8 min-[1025px]:px-10 min-[1025px]:pb-10">
        <TeamTimelineChart data={timeline} avatarByUserId={avatarByUserId} />
      </div>
    </>
  );
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

  // Dashboard gộp của cả 1 phòng ban ngoài 6 đội KD (vd "IT / Development",
  // /dashboard/giao-task/it) — dùng chung URL cho cả 2 audience: BGĐ xem hộ
  // cả phòng ban (department có giá trị, phạm vi người theo
  // findOutsideTeamUsersByDepartment), và chính nhân sự phòng ban đó vào
  // thẳng nhóm mình (phạm vi người theo team_label như /dashboard/giao-task
  // gốc đã redirect tới đây). Người ngoài 2 diện này gõ đúng URL vẫn rơi
  // xuống nhánh khớp người/slug bên dưới rồi bị chặn ở đó.
  const department = DEPARTMENTS.find((d) => d.id === code && d.id !== 'bgd');
  if (department) {
    if (isBgd) {
      const members = await findOutsideTeamUsersByDepartment(department.id);
      if (members.length === 0) redirect('/dashboard/giao-task');
      return renderGroupWorkspace(today, members, departmentLabel(department.id), members[0].userId, null, department.id);
    }

    const [self, mates] = await Promise.all([findUserById(session.userId), listTeammatesByLabel(session.userId)]);
    if (self && self.department === department.id && mates.length > 0) {
      const members = [{ userId: self.id, fullName: self.fullName, avatarUrl: self.avatarUrl }, ...mates];
      return renderGroupWorkspace(today, members, self.teamLabel ?? departmentLabel(department.id), self.id, self.id);
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
