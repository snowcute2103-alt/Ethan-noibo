import 'server-only';
import {
  getTeamWithRoster,
  listAllTeamsSummary,
  listTeamCategories,
  listUsersOutsideTeamsByDepartment,
  type DepartmentGroup,
  type TeamTaskCategory,
  type TeamWithRoster,
  type TeamSummary,
} from '@/lib/teams';
import {
  getDailyAssigneeBreakdown,
  listTasksForTeam,
  listTasksForOwner,
  getMonthProgress,
  getAllTeamsMonthProgress,
  getDistinctProductsForTeam,
  getMonthTaskCategoryCounts,
  getPersonalMonthProgress,
  getPersonalMonthDayCounts,
  rolloverOverduePersonalTasks,
  type Task,
  type DailyAssigneeCount,
  type MonthDayCategoryCount,
  type TeamMonthProgress,
} from '@/lib/tasks';

interface DateRange {
  fromDate: string;
  toDate: string;
}

export interface TeamBoardCore {
  team: TeamWithRoster;
  categories: TeamTaskCategory[];
  tasks: Task[];
  monthProgress: { done: number; total: number };
  chart: DailyAssigneeCount[];
  products: string[];
  dayCategoryCounts: MonthDayCategoryCount[];
  range: DateRange;
}

export interface TeamsOverview {
  teams: TeamSummary[];
  monthProgress: TeamMonthProgress[];
  departments: DepartmentGroup[];
}

export interface PersonalBoardCore {
  tasks: Task[];
  monthProgress: { done: number; total: number };
  monthDayCounts: MonthDayCategoryCount[];
  range: DateRange;
}

/** Dữ liệu board của 1 đội trong ngày `today`, dùng chung cho trang đội của
 *  chính mình (page.tsx) và trang xem đội theo mã (/[code]/page.tsx) — trả về
 *  null nếu không tìm thấy đội, KHÔNG kèm `isManager` vì ý nghĩa khác nhau
 *  giữa 2 nơi gọi (chính chủ vs BGĐ xem hộ). */
export async function loadTeamBoardCore(teamId: number, today: string): Promise<TeamBoardCore | null> {
  const yearMonth = today.slice(0, 7);
  const range: DateRange = { fromDate: today, toDate: today };

  const [team, categories, tasks, monthProgress, chart, products, dayCategoryCounts] = await Promise.all([
    getTeamWithRoster(teamId),
    listTeamCategories(teamId),
    listTasksForTeam(teamId, range),
    getMonthProgress(teamId, yearMonth),
    getDailyAssigneeBreakdown(teamId, yearMonth),
    getDistinctProductsForTeam(teamId),
    getMonthTaskCategoryCounts(teamId, yearMonth),
  ]);

  if (!team) return null;
  return {
    team,
    categories,
    tasks,
    monthProgress,
    chart,
    products,
    dayCategoryCounts,
    range,
  };
}

export async function loadTeamsOverview(today: string): Promise<TeamsOverview> {
  const yearMonth = today.slice(0, 7);
  const [teams, monthProgress, departments] = await Promise.all([
    listAllTeamsSummary(),
    getAllTeamsMonthProgress(yearMonth, today),
    listUsersOutsideTeamsByDepartment(yearMonth),
  ]);
  return { teams, monthProgress, departments };
}

export async function loadPersonalBoardCore(ownerUserId: number, today: string): Promise<PersonalBoardCore> {
  const range = { fromDate: today, toDate: today };
  const yearMonth = today.slice(0, 7);
  await rolloverOverduePersonalTasks(ownerUserId, today);
  const [tasks, monthProgress, monthDayCounts] = await Promise.all([
    listTasksForOwner(ownerUserId, range),
    getPersonalMonthProgress(ownerUserId, yearMonth),
    getPersonalMonthDayCounts(ownerUserId, yearMonth),
  ]);
  return { tasks, monthProgress, monthDayCounts, range };
}
