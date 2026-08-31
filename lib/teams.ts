import 'server-only';
import { sql } from './db';
import { DEPARTMENTS, departmentLabel, type Department } from './roles';
import { nameSlug } from './name-slug';
import { monthRange } from './date';

export type TeamMemberRole = 'manager' | 'member';

export interface TeamRow {
  id: number;
  code: string;
  name: string;
  createdAt: string;
}

export interface TeamMember {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  role: TeamMemberRole;
  categoryId: number | null;
}

export interface TeamWithRoster extends TeamRow {
  members: TeamMember[];
}

export interface TeamSummary extends TeamRow {
  memberCount: number;
  managerNames: string[];
}

export interface TeamTaskCategory {
  id: number;
  teamId: number;
  name: string;
  visibleColumns: string[];
  sortOrder: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTeamRow(row: any): TeamRow {
  return { id: row.id, code: row.code, name: row.name, createdAt: row.created_at };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCategoryRow(row: any): TeamTaskCategory {
  return {
    id: row.id,
    teamId: row.team_id,
    name: row.name,
    visibleColumns: row.visible_columns ?? [],
    sortOrder: row.sort_order,
  };
}

/** Một người chỉ thuộc đúng 1 đội (team_members.user_id là UNIQUE) — BGĐ
 *  thường không thuộc đội nào, trả về null trong trường hợp đó. */
export async function findTeamIdByUserId(userId: number): Promise<number | null> {
  const rows = await sql.query('SELECT team_id FROM team_members WHERE user_id = $1', [userId]);
  return rows[0] ? (rows[0].team_id as number) : null;
}

/** Có thể có nhiều dòng role='manager' cho cùng 1 đội (vd KD1 có 2 quản lý). */
export async function isTeamManager(teamId: number, userId: number): Promise<boolean> {
  const rows = await sql.query(
    `SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = 'manager'`,
    [teamId, userId]
  );
  return rows.length > 0;
}

export async function getTeamById(teamId: number): Promise<TeamRow | null> {
  const rows = await sql.query('SELECT id, code, name, created_at FROM teams WHERE id = $1', [teamId]);
  return rows[0] ? mapTeamRow(rows[0]) : null;
}

/** Tra đội theo `code` (vd "kd2") — dùng cho route /dashboard/giao-task/[code]. */
export async function getTeamByCode(code: string): Promise<TeamRow | null> {
  const rows = await sql.query('SELECT id, code, name, created_at FROM teams WHERE code = $1', [code.toLowerCase()]);
  return rows[0] ? mapTeamRow(rows[0]) : null;
}

/** 1 query JOIN đội + roster thay vì getTeamById rồi query roster riêng —
 *  giảm 1 round-trip HTTP tới Neon (hàm này nằm ở đầu chuỗi tải trang Giao
 *  Task, chặn các query song song khác chạy sau nó). LEFT JOIN để đội chưa
 *  có ai vẫn trả về (members rỗng) thay vì mất dòng đội. */
export async function getTeamWithRoster(teamId: number): Promise<TeamWithRoster | null> {
  const rows = await sql.query(
    `SELECT t.id, t.code, t.name, t.created_at,
            u.id AS user_id, u.full_name AS member_full_name, u.avatar_url AS member_avatar_url,
            tm.role, tm.category_id
     FROM teams t
     LEFT JOIN team_members tm ON tm.team_id = t.id
     LEFT JOIN users u ON u.id = tm.user_id
     WHERE t.id = $1
     ORDER BY tm.role ASC, u.full_name ASC`,
    [teamId]
  );
  if (rows.length === 0) return null;

  const team = mapTeamRow(rows[0]);
  const members: TeamMember[] =
    rows[0].user_id === null
      ? []
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows.map((row: any) => ({
          userId: row.user_id,
          fullName: row.member_full_name,
          avatarUrl: row.member_avatar_url,
          role: row.role as TeamMemberRole,
          categoryId: row.category_id,
        }));

  return { ...team, members };
}

/** 1 query JOIN cho cả 6 đội — dùng cho view gộp BGĐ, tránh N+1. */
export async function listAllTeamsSummary(): Promise<TeamSummary[]> {
  const rows = await sql.query(
    `SELECT t.id, t.code, t.name, t.created_at,
            count(tm.user_id)::int AS member_count,
            coalesce(array_agg(u.full_name) FILTER (WHERE tm.role = 'manager'), '{}') AS manager_names
     FROM teams t
     LEFT JOIN team_members tm ON tm.team_id = t.id
     LEFT JOIN users u ON u.id = tm.user_id AND tm.role = 'manager'
     GROUP BY t.id
     ORDER BY t.code ASC`
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({
    ...mapTeamRow(row),
    memberCount: row.member_count,
    managerNames: row.manager_names ?? [],
  }));
}

/** Nguồn cho UI "thêm thành viên" của quản lý — chỉ người active, chưa thuộc đội nào. */
export async function listActiveUsersNotInAnyTeam(): Promise<{ id: number; fullName: string; username: string }[]> {
  const rows = await sql.query(
    `SELECT u.id, u.full_name, u.username FROM users u
     WHERE u.is_active = true AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.user_id = u.id)
     ORDER BY u.full_name ASC`
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((row: any) => ({ id: row.id, fullName: row.full_name, username: row.username }));
}

export interface DepartmentGroupMember {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  monthProgress: { done: number; total: number };
}

export interface DepartmentGroup {
  department: Department;
  departmentLabel: string;
  members: DepartmentGroupMember[];
}

/** User active KHÔNG thuộc đội KD nào (cùng predicate NOT EXISTS với
 *  listActiveUsersNotInAnyTeam ở trên) và không phải BGĐ — nhóm theo
 *  department cho màn drill-down của BGĐ. 1 JOIN duy nhất, tránh N+1 khi
 *  liệt kê tiến độ từng người. */
export async function listUsersOutsideTeamsByDepartment(yearMonth: string): Promise<DepartmentGroup[]> {
  const { from, to } = monthRange(yearMonth);
  const rows = await sql.query(
    `SELECT u.id AS user_id, u.full_name, u.avatar_url, u.department,
            count(t.*) FILTER (WHERE t.status = 'done' AND t.task_date >= $1 AND t.task_date < $2)::int AS done,
            count(t.*) FILTER (WHERE t.task_date >= $1 AND t.task_date < $2)::int AS total
     FROM users u
     LEFT JOIN tasks t ON t.owner_user_id = u.id
     WHERE u.is_active = true AND u.department != 'bgd'
       AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.user_id = u.id)
     GROUP BY u.id, u.department
     ORDER BY u.department ASC, u.full_name ASC`,
    [from, to]
  );

  const membersByDept = new Map<Department, DepartmentGroupMember[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of rows as any[]) {
    const dept = row.department as Department;
    const member: DepartmentGroupMember = {
      userId: row.user_id,
      fullName: row.full_name,
      avatarUrl: row.avatar_url,
      monthProgress: { done: row.done, total: row.total },
    };
    const list = membersByDept.get(dept);
    if (list) list.push(member);
    else membersByDept.set(dept, [member]);
  }

  return DEPARTMENTS.filter((d) => d.id !== 'bgd')
    .map((d) => ({ department: d.id, departmentLabel: departmentLabel(d.id), members: membersByDept.get(d.id) ?? [] }))
    .filter((group) => group.members.length > 0);
}

/** Tra ngược slug tên -> user, cho route /dashboard/giao-task/[code] khi mã
 *  không khớp đội nào (xem getTeamByCode) — cùng phạm vi người với
 *  listUsersOutsideTeamsByDepartment (ngoài 6 đội KD, không phải BGĐ), nhưng
 *  không cần JOIN tiến độ task nên tách hàm riêng, nhẹ hơn. So khớp slug ở
 *  JS vì `nameSlug` không dịch được sang SQL gọn (bỏ dấu + nối chữ). */
export async function findOutsideTeamUserBySlug(slug: string): Promise<{ userId: number; fullName: string } | null> {
  const rows = await sql.query(
    `SELECT u.id AS user_id, u.full_name FROM users u
     WHERE u.is_active = true AND u.department != 'bgd'
       AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.user_id = u.id)`
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match = (rows as any[]).find((row) => nameSlug(row.full_name) === slug);
  return match ? { userId: match.user_id, fullName: match.full_name } : null;
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}

export async function addTeamMember(
  teamId: number,
  userId: number,
  role: TeamMemberRole,
  addedBy: number | null
): Promise<void> {
  try {
    await sql.query('INSERT INTO team_members (team_id, user_id, role, added_by) VALUES ($1, $2, $3, $4)', [
      teamId,
      userId,
      role,
      addedBy,
    ]);
  } catch (error) {
    if (isUniqueViolation(error)) throw new Error('Người này đã thuộc một đội khác.');
    throw error;
  }
}

export async function removeTeamMember(teamId: number, userId: number): Promise<void> {
  await sql.query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [teamId, userId]);
}

/** Đổi 1 thành viên trong đội thành/thôi quản lý — thay cho khái niệm "đổi
 *  quản lý duy nhất": giờ là thêm/bớt người trong tập quản lý của đội. */
export async function setMemberRole(teamId: number, userId: number, role: TeamMemberRole): Promise<void> {
  await sql.query('UPDATE team_members SET role = $1 WHERE team_id = $2 AND user_id = $3', [role, teamId, userId]);
}

/** Xếp 1 thành viên vào nhóm task (Media/Support...) — categoryId=null nghĩa
 *  là bỏ khỏi nhóm hiện tại, không xếp vào đâu. */
export async function setMemberCategory(teamId: number, userId: number, categoryId: number | null): Promise<void> {
  await sql.query('UPDATE team_members SET category_id = $1 WHERE team_id = $2 AND user_id = $3', [categoryId, teamId, userId]);
}

export async function listTeamCategories(teamId: number): Promise<TeamTaskCategory[]> {
  const rows = await sql.query(
    'SELECT id, team_id, name, visible_columns, sort_order FROM team_task_categories WHERE team_id = $1 ORDER BY sort_order ASC, id ASC',
    [teamId]
  );
  return rows.map(mapCategoryRow);
}

export async function createTeamCategory(
  teamId: number,
  name: string,
  visibleColumns: string[],
  createdBy: number | null
): Promise<TeamTaskCategory> {
  const maxSort = await sql.query('SELECT coalesce(max(sort_order), -1) AS n FROM team_task_categories WHERE team_id = $1', [
    teamId,
  ]);
  const nextSort = (maxSort[0].n as number) + 1;
  try {
    const rows = await sql.query(
      `INSERT INTO team_task_categories (team_id, name, visible_columns, sort_order, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, team_id, name, visible_columns, sort_order`,
      [teamId, name, visibleColumns, nextSort, createdBy]
    );
    return mapCategoryRow(rows[0]);
  } catch (error) {
    if (isUniqueViolation(error)) throw new Error('Đội này đã có nhóm task trùng tên.');
    throw error;
  }
}

export async function updateTeamCategory(
  categoryId: number,
  teamId: number,
  patch: { name?: string; visibleColumns?: string[]; sortOrder?: number }
): Promise<TeamTaskCategory> {
  const current = await sql.query(
    'SELECT id, team_id, name, visible_columns, sort_order FROM team_task_categories WHERE id = $1 AND team_id = $2',
    [categoryId, teamId]
  );
  if (!current[0]) throw new Error('Không tìm thấy nhóm task.');
  const existing = mapCategoryRow(current[0]);

  const next = {
    name: patch.name ?? existing.name,
    visibleColumns: patch.visibleColumns ?? existing.visibleColumns,
    sortOrder: patch.sortOrder ?? existing.sortOrder,
  };

  const rows = await sql.query(
    `UPDATE team_task_categories SET name = $1, visible_columns = $2, sort_order = $3
     WHERE id = $4 AND team_id = $5
     RETURNING id, team_id, name, visible_columns, sort_order`,
    [next.name, next.visibleColumns, next.sortOrder, categoryId, teamId]
  );
  return mapCategoryRow(rows[0]);
}

export async function deleteTeamCategory(categoryId: number, teamId: number): Promise<void> {
  // Task đang gắn category này tự về category_id = NULL nhờ ON DELETE SET NULL đã khai báo ở schema.
  await sql.query('DELETE FROM team_task_categories WHERE id = $1 AND team_id = $2', [categoryId, teamId]);
}
