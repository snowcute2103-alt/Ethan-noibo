import 'server-only';
import { getTeamWithRoster, listAllTeamsSummary, listTeamCategories, type TeamTaskCategory, type TeamWithRoster, type TeamSummary } from '@/lib/teams';
import { listTasksForTeam, getMonthProgress, getDailyAssigneeBreakdown, getAllTeamsMonthProgress, type Task, type DailyAssigneeCount, type TeamMonthProgress } from '@/lib/tasks';

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
  range: DateRange;
}

export interface TeamsOverview {
  teams: TeamSummary[];
  monthProgress: TeamMonthProgress[];
}

/** Dữ liệu board của 1 đội trong ngày `today`, dùng chung cho trang đội của
 *  chính mình (page.tsx) và trang xem đội theo mã (/[code]/page.tsx) — trả về
 *  null nếu không tìm thấy đội, KHÔNG kèm `isManager` vì ý nghĩa khác nhau
 *  giữa 2 nơi gọi (chính chủ vs BGĐ xem hộ). */
export async function loadTeamBoardCore(teamId: number, today: string): Promise<TeamBoardCore | null> {
  const yearMonth = today.slice(0, 7);
  const range: DateRange = { fromDate: today, toDate: today };

  const [team, categories, tasks, monthProgress, chart] = await Promise.all([
    getTeamWithRoster(teamId),
    listTeamCategories(teamId),
    listTasksForTeam(teamId, range),
    getMonthProgress(teamId, yearMonth),
    getDailyAssigneeBreakdown(teamId, today, today),
  ]);

  if (!team) return null;
  return { team, categories, tasks, monthProgress, chart, range };
}

export async function loadTeamsOverview(today: string): Promise<TeamsOverview> {
  const yearMonth = today.slice(0, 7);
  const [teams, monthProgress] = await Promise.all([listAllTeamsSummary(), getAllTeamsMonthProgress(yearMonth, today)]);
  return { teams, monthProgress };
}
