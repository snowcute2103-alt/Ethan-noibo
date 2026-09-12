/**
 * Cấp lại tài khoản Nội bộ cho toàn bộ nhân viên thật: username = personal_email,
 * mật khẩu chung "Ethan@2026!" (theo yêu cầu task quản trị — xem context lúc chạy).
 *
 * Trước khi chạy: xoá bản trùng id 291 (Trần Vũ Quốc Bảo tạo tay 04/09, không có
 * employee_code) — giữ id 15 (NV15) làm bản chính rồi mới đổi username id 15 thành email.
 *
 * Bỏ qua 3 tài khoản test/dev (employee_code IS NULL): Test BGĐ, Test Leader, Browser Test.
 *
 *   npx tsx --env-file=.env.local scripts/reset-internal-accounts-2026-09.ts --dry-run   (mặc định)
 *   npx tsx --env-file=.env.local scripts/reset-internal-accounts-2026-09.ts --apply
 */
import { sql } from '../lib/db';
import { hashPassword } from '../lib/password';

const SHARED_PASSWORD = 'Ethan@2026!';
const DUPLICATE_ID_TO_DELETE = 291;

interface Row {
  id: number;
  employee_code: string;
  username: string;
  full_name: string;
  personal_email: string;
}

async function main() {
  const isApply = process.argv.includes('--apply');

  const dup = await sql.query('SELECT id, username, full_name FROM users WHERE id = $1', [DUPLICATE_ID_TO_DELETE]);
  if (dup.length) {
    console.log(`Bản trùng cần xoá: id ${dup[0].id} — ${dup[0].full_name} (${dup[0].username})`);
    if (isApply) {
      await sql.query('DELETE FROM users WHERE id = $1', [DUPLICATE_ID_TO_DELETE]);
      console.log('  -> đã xoá.');
    }
  } else {
    console.log(`Không tìm thấy id ${DUPLICATE_ID_TO_DELETE} (có thể đã xoá trước đó) — bỏ qua bước này.`);
  }

  const rows = (await sql.query(
    `SELECT id, employee_code, username, full_name, personal_email
     FROM users
     WHERE employee_code IS NOT NULL
     ORDER BY department, full_name`
  )) as Row[];

  console.log(`\nSố tài khoản thật sẽ cập nhật: ${rows.length}\n`);

  let renamed = 0;
  let ok = 0;
  let failed = 0;

  for (const r of rows) {
    if (!r.personal_email) {
      console.error(`  BỎ QUA (thiếu personal_email): id ${r.id} — ${r.full_name}`);
      failed += 1;
      continue;
    }
    const newUsername = r.personal_email.toLowerCase();
    const willRename = newUsername !== r.username;
    if (willRename) renamed += 1;

    if (!isApply) {
      if (willRename) console.log(`  [DRY-RUN] id ${r.id} — ${r.full_name}: username "${r.username}" -> "${newUsername}"`);
      continue;
    }

    try {
      const passwordHash = await hashPassword(SHARED_PASSWORD);
      await sql.query(
        `UPDATE users SET username = $1, password_hash = $2, updated_at = now() WHERE id = $3`,
        [newUsername, passwordHash, r.id]
      );
      ok += 1;
    } catch (err) {
      failed += 1;
      console.error(`  LỖI id ${r.id} (${r.full_name}): ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\nSố username sẽ đổi (khác email hiện tại): ${renamed}`);
  if (!isApply) {
    console.log('\n[DRY-RUN] Không ghi gì vào DB. Chạy lại kèm --apply để ghi thật.');
    return;
  }
  console.log(`\nHoàn tất: ${ok} thành công, ${failed} lỗi.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
