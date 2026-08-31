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
  pinCount: number;
  pinnedByCurrentUser: boolean;
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
    pinCount: Number(row.pin_count ?? 0),
    pinnedByCurrentUser: Boolean(row.pinned_by_current_user),
    updatedAt: row.updated_at,
  };
}

const SELECT_JOIN = `
  SELECT sn.id, sn.x, sn.y, sn.color, sn.text, sn.author_user_id, sn.updated_at,
         u.full_name AS author_name, u.job_title AS author_title,
         (SELECT COUNT(*) FROM sticky_note_pins p WHERE p.note_id = sn.id) AS pin_count,
         EXISTS(
           SELECT 1 FROM sticky_note_pins p
           WHERE p.note_id = sn.id AND p.user_id = $1
         ) AS pinned_by_current_user
  FROM sticky_notes sn
  JOIN users u ON u.id = sn.author_user_id
`;

export async function listStickyNotes(requestingUserId: number): Promise<StickyNote[]> {
  const rows = await sql.query(`${SELECT_JOIN} ORDER BY sn.id ASC`, [requestingUserId]);
  return rows.map(mapRow);
}

export async function createStickyNote(input: StickyNoteInput, authorUserId: number): Promise<StickyNote> {
  const rows = await sql.query(
    `INSERT INTO sticky_notes (x, y, color, text, author_user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [input.x, input.y, input.color, input.text, authorUserId]
  );
  const full = await sql.query(`${SELECT_JOIN} WHERE sn.id = $2`, [authorUserId, rows[0].id]);
  return mapRow(full[0]);
}

/** Ghim/bỏ ghim theo tài khoản. CTE đảm bảo hai thao tác là một câu lệnh nguyên tử và
 *  khoá chính kép ngăn một người tạo nhiều lượt ghim cho cùng note. */
export async function toggleStickyNotePin(
  noteId: number,
  userId: number
): Promise<{ pinned: boolean; pinCount: number } | null> {
  const rows = await sql.query(
    `/* write */ WITH target AS (
       SELECT id FROM sticky_notes WHERE id = $1
     ), deleted AS (
       DELETE FROM sticky_note_pins WHERE note_id = $1 AND user_id = $2 RETURNING 1
     ), inserted AS (
       INSERT INTO sticky_note_pins (note_id, user_id)
       SELECT id, $2 FROM target WHERE NOT EXISTS (SELECT 1 FROM deleted)
       ON CONFLICT DO NOTHING
       RETURNING 1
     )
     SELECT EXISTS(SELECT 1 FROM inserted) AS pinned,
            (SELECT COUNT(*) FROM sticky_note_pins WHERE note_id = $1)
              + (SELECT COUNT(*) FROM inserted)
              - (SELECT COUNT(*) FROM deleted) AS pin_count,
            EXISTS(SELECT 1 FROM target) AS note_exists`,
    [noteId, userId]
  );
  if (!rows[0]?.note_exists) return null;
  return { pinned: Boolean(rows[0].pinned), pinCount: Number(rows[0].pin_count) };
}

/** Vị trí là "giống bảng vật lý thật" — ai cũng kéo/di chuyển được note của bất kỳ ai,
 *  nên không kiểm tra tác giả ở đây (khác với sửa nội dung/xoá bên dưới). */
export async function moveStickyNote(id: number, x: number, y: number): Promise<void> {
  await sql.query(`UPDATE sticky_notes SET x = $1, y = $2, updated_at = now() WHERE id = $3`, [x, y, id]);
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
