'use client';

import { useState } from 'react';
import type { Task, DailyAssigneeCount } from '@/lib/tasks';
import type { Department } from '@/lib/roles';
import TeamGroupDashboard, { type GroupMemberStat } from '@/components/dashboard/team-group-dashboard';
import TeamMergedTaskBoard from '@/components/dashboard/team-merged-task-board';
import type { TeamBoardMember } from '@/components/dashboard/personal-task-board';

interface TeamWorkspaceProps {
  groupLabel: string;
  stats: GroupMemberStat[];
  today: string;
  /** Id người đang đăng nhập xem workspace này — truyền xuống
   *  TeamMergedTaskBoard/PersonalTaskDetailDrawer để quyết định quyền xoá task. */
  viewerUserId: number;
  members: TeamBoardMember[];
  defaultAssigneeUserId: number;
  initialTasks: Task[];
  initialDayCounts: DailyAssigneeCount[];
  department?: Department;
  isBgd?: boolean;
}

/** Nối TeamGroupDashboard (thẻ tổng quan từng người) với TeamMergedTaskBoard
 *  (board gộp) — 2 client component độc lập cần 1 nơi chung giữ state lọc:
 *  bấm 1 thẻ ở trên sẽ lọc board bên dưới chỉ còn task của đúng người đó,
 *  bấm lại thẻ đang chọn để xem lại tất cả. */
export default function TeamWorkspace({
  groupLabel,
  stats,
  today,
  viewerUserId,
  members,
  defaultAssigneeUserId,
  initialTasks,
  initialDayCounts,
  department,
  isBgd,
}: TeamWorkspaceProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  return (
    <>
      <TeamGroupDashboard
        groupLabel={groupLabel}
        members={stats}
        selectedUserId={selectedUserId}
        onToggleMember={(userId) => setSelectedUserId((current) => (current === userId ? null : userId))}
        isBgd={isBgd}
      />
      <TeamMergedTaskBoard
        today={today}
        viewerUserId={viewerUserId}
        members={members}
        defaultAssigneeUserId={defaultAssigneeUserId}
        initialTasks={initialTasks}
        initialDayCounts={initialDayCounts}
        department={department}
        filterUserId={selectedUserId}
      />
    </>
  );
}
