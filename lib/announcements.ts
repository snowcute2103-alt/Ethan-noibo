import 'server-only';
import { sql } from './db';
import type { Announcement } from './content/announcements';
import type { Department, Tier } from './roles';

export interface AnnouncementInput {
  title: string;
  body: string;
  date: string;
  departments: Department[] | 'all';
  minTier?: Tier;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Announcement {
  return {
    id: String(row.id),
    title: row.title,
    body: row.body,
    date: row.date_label,
    visibility: {
      departments: row.visibility_departments ?? 'all',
      minTier: row.visibility_min_tier ?? undefined,
    },
  };
}

export async function listAnnouncements(): Promise<Announcement[]> {
  const rows = await sql.query('SELECT * FROM announcements ORDER BY created_at ASC');
  return rows.map(mapRow);
}

export async function findAnnouncement(id: number): Promise<Announcement | null> {
  const rows = await sql.query('SELECT * FROM announcements WHERE id = $1', [id]);
  return rows.length > 0 ? mapRow(rows[0]) : null;
}

export async function createAnnouncement(input: AnnouncementInput, createdBy: number): Promise<Announcement> {
  const rows = await sql.query(
    `INSERT INTO announcements (title, body, date_label, visibility_departments, visibility_min_tier, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.title,
      input.body,
      input.date,
      input.departments === 'all' ? null : input.departments,
      input.minTier ?? null,
      createdBy,
    ]
  );
  return mapRow(rows[0]);
}

export async function updateAnnouncement(id: number, input: AnnouncementInput): Promise<Announcement> {
  const rows = await sql.query(
    `UPDATE announcements SET
       title = $2, body = $3, date_label = $4, visibility_departments = $5, visibility_min_tier = $6,
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      input.title,
      input.body,
      input.date,
      input.departments === 'all' ? null : input.departments,
      input.minTier ?? null,
    ]
  );
  if (rows.length === 0) throw new Error('Không tìm thấy thông báo.');
  return mapRow(rows[0]);
}

export async function deleteAnnouncement(id: number): Promise<void> {
  await sql.query('DELETE FROM announcements WHERE id = $1', [id]);
}
