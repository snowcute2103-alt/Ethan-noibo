import 'server-only';
import { sql } from './db';

export interface StickyNote {
  id: number;
  x: number;
  y: number;
  color: string;
  text: string;
  authorUserId: number;
  authorName: string;
  authorTitle: string | null;
  updatedAt: string;
}

export interface StickyNoteInput {
  x: number;
  y: number;
  color: string;
  text: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): StickyNote {
  return {
    id: row.id,
    x: Number(row.x),
    y: Number(row.y),
    color: row.color,
    text: row.text,
    authorUserId: row.author_user_id,
    authorName: row.author_name,
    authorTitle: row.author_title ?? null,
    updatedAt: row.updated_at,
  };
}

const SELECT_JOIN = `
  SELECT sn.id, sn.x, sn.y, sn.color, sn.text, sn.author_user_id, sn.updated_at,
         u.full_name AS author_name, u.job_title AS author_title
  FROM sticky_notes sn
  JOIN users u ON u.id = sn.author_user_id
`;

export async function listStickyNotes(): Promise<StickyNote[]> {
  const rows = await sql.query(`${SELECT_JOIN} ORDER BY sn.id ASC`);
  return rows.map(mapRow);
}

export async function createStickyNote(input: StickyNoteInput, authorUserId: number): Promise<StickyNote> {
  const rows = await sql.query(
    `INSERT INTO sticky_notes (x, y, color, text, author_user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [input.x, input.y, input.color, input.text, authorUserId]
  );
  const full = await sql.query(`${SELECT_JOIN} WHERE sn.id = $1`, [rows[0].id]);
  return mapRow(full[0]);
}

/** Chỉ tác giả mới sửa được nội dung — trả false nếu id không tồn tại hoặc không phải tác giả. */
export async function updateStickyNoteText(id: number, text: string, requestingUserId: number): Promise<boolean> {
  const rows = await sql.query(
    `UPDATE sticky_notes SET text = $1, updated_at = now() WHERE id = $2 AND author_user_id = $3 RETURNING id`,
    [text, id, requestingUserId]
  );
  return rows.length > 0;
}

/** Tác giả xoá note của chính mình, hoặc BGĐ (canModerate) xoá bất kỳ note nào để kiểm duyệt. */
export async function deleteStickyNote(id: number, requestingUserId: number, canModerate: boolean): Promise<boolean> {
  const rows = canModerate
    ? await sql.query(`DELETE FROM sticky_notes WHERE id = $1 RETURNING id`, [id])
    : await sql.query(`DELETE FROM sticky_notes WHERE id = $1 AND author_user_id = $2 RETURNING id`, [id, requestingUserId]);
  return rows.length > 0;
}
