/**
 * Import 97 nhân viên thật từ file Excel HR export vào bảng `users`.
 *
 * KHÔNG gửi email, KHÔNG xuất mật khẩu ra bất kỳ đâu — mỗi user được tạo với
 * 1 mật khẩu ngẫu nhiên rồi hash, plaintext bị huỷ ngay sau khi hash xong.
 * Tài khoản coi như "khoá" cho tới khi BGĐ tự đặt lại mật khẩu qua trang admin
 * (/dashboard/admin) cho từng người khi cần cấp phát.
 *
 *   npx tsx --env-file=.env.local scripts/import-employees.ts --dry-run   (mặc định)
 *   npx tsx --env-file=.env.local scripts/import-employees.ts --import
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import * as XLSX from 'xlsx';
import { sql } from '../lib/db';
import { hashPassword, generatePassword } from '../lib/password';
import type { Department, Tier } from '../lib/roles';

const EXCEL_PATH = join(homedir(), 'Downloads', 'nhan-vien.report.11.39.12.08.26.xlsx');
const SHEET_NAME = 'Exported file';

interface ExcelRow {
  'Nhân sự': string;
  Mã: string;
  'Tài khoản': string | undefined;
  'Trạng thái': string | undefined;
  'Chức danh': string | undefined;
  'Ngày bắt đầu': string | undefined;
  'Ngày chính thức': string | undefined;
  'Văn phòng': string | undefined;
  'Khu vực / Chuyên môn': string;
  'Nhóm chính thức': string | undefined;
  'Phân loại nhân sự': string | undefined;
  'Giới tính': string | undefined;
  'Vị trí công việc': string | undefined;
  'Loại vị trí': string | undefined;
  'Chính sách lương': string | undefined;
  'Điện thoại': string | undefined;
  'Địa chỉ email': string | undefined;
  'Ngày sinh': string | undefined;
  'Lịch làm việc': string | undefined;
}

interface MappedUser {
  employeeCode: string;
  username: string | null;
  fullName: string;
  department: Department;
  tier: Tier;
  teamLabel: string | null;
  personalEmail: string | null;
  phone: string | null;
  jobTitle: string | null;
  gender: string | null;
  birthDate: string | null;
  office: string | null;
  startDate: string | null;
  workSchedule: string | null;
  positionTitle: string | null;
  employmentStatus: string | null;
  employmentType: string | null;
  salaryPolicy: string | null;
  confirmationDate: string | null;
}

/** Excel ghi ngày dạng "DD/MM/YYYY" — chuyển sang "YYYY-MM-DD" cho cột DATE. */
function parseVnDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function mapDepartment(khuVuc: string, nhom: string | undefined): Department {
  if (khuVuc === 'Embroidery Production Department') return 'sx-theu';
  if (khuVuc === 'Print Production Department') return 'sx-in';
  if (khuVuc === 'Sales Division') return 'kinh-doanh';
  if (khuVuc === 'R&D Division') return nhom === 'Development Team' ? 'it' : 'rnd';
  if (khuVuc === 'Ethan Ecom') return nhom === 'Fulfillment Team' ? 'fulfillment' : 'bgd';
  throw new Error(`Không nhận diện được Khu vực/Chuyên môn: "${khuVuc}"`);
}

function mapTier(department: Department, loaiViTri: string | undefined): Tier {
  // department quyết định trước — bgd luôn full, bất kể "Loại vị trí" ghi gì.
  if (department === 'bgd') return 'full';
  if (loaiViTri === 'Leader' || loaiViTri === 'Manager') return 'leader';
  return 'staff'; // Staff, "Nhân Viên", hoặc trống → mặc định staff
}

function mapRow(row: ExcelRow): MappedUser {
  const department = mapDepartment(row['Khu vực / Chuyên môn'], row['Nhóm chính thức']);
  const tier = mapTier(department, row['Loại vị trí']);
  const rawUsername = row['Tài khoản']?.trim();
  return {
    employeeCode: row['Mã'],
    username: rawUsername ? rawUsername.toLowerCase() : null,
    fullName: row['Nhân sự'],
    department,
    tier,
    teamLabel: row['Nhóm chính thức'] ?? null,
    personalEmail: row['Địa chỉ email'] ?? null,
    phone: row['Điện thoại'] ?? null,
    jobTitle: row['Chức danh'] ?? null,
    gender: row['Giới tính'] ?? null,
    birthDate: parseVnDate(row['Ngày sinh']),
    office: row['Văn phòng'] ?? null,
    startDate: parseVnDate(row['Ngày bắt đầu']),
    workSchedule: row['Lịch làm việc'] ?? null,
    positionTitle: row['Vị trí công việc'] ?? null,
    employmentStatus: row['Trạng thái'] ?? null,
    employmentType: row['Phân loại nhân sự'] ?? null,
    salaryPolicy: row['Chính sách lương'] ?? null,
    confirmationDate: parseVnDate(row['Ngày chính thức']),
  };
}

function loadRows(): MappedUser[] {
  const buf = readFileSync(EXCEL_PATH);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheet = wb.Sheets[SHEET_NAME];
  if (!sheet) throw new Error(`Không tìm thấy sheet "${SHEET_NAME}" trong file Excel.`);
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);
  return rows.map(mapRow);
}

function printSummary(users: MappedUser[]) {
  const byDept = new Map<string, number>();
  for (const u of users) byDept.set(u.department, (byDept.get(u.department) ?? 0) + 1);

  console.log(`\nTổng số dòng đọc được: ${users.length}\n`);
  console.log('Phân bố theo khối:');
  for (const [dept, count] of byDept) console.log(`  ${dept}: ${count}`);

  const missingUsername = users.filter((u) => !u.username);
  console.log(`\nDòng thiếu username (${missingUsername.length}):`);
  for (const u of missingUsername) console.log(`  Mã ${u.employeeCode} — ${u.fullName}`);

  const usernames = users.filter((u) => u.username).map((u) => u.username as string);
  const dupes = usernames.filter((u, i) => usernames.indexOf(u) !== i);
  console.log(`\nUsername trùng nhau sau khi lowercase (${dupes.length}):`);
  for (const d of new Set(dupes)) console.log(`  ${d}`);

  const invalidEmailDomain = users.filter((u) => {
    if (!u.personalEmail) return false;
    const domain = u.personalEmail.split('@')[1]?.toLowerCase();
    return domain !== 'gmail.com' && domain !== 'yahoo.com';
  });
  console.log(`\nEmail domain lạ, cần xác nhận tay (${invalidEmailDomain.length}):`);
  for (const u of invalidEmailDomain) console.log(`  Mã ${u.employeeCode} — ${u.personalEmail}`);
}

async function importUsers(users: MappedUser[]) {
  const importable = users.filter((u) => u.username);
  console.log(`\nBắt đầu import ${importable.length}/${users.length} user (bỏ qua ${users.length - importable.length} dòng thiếu username)...\n`);

  let ok = 0;
  let failed = 0;
  for (const u of importable) {
    try {
      const lockedPassword = generatePassword(20); // không lưu, không log — chỉ để tạo hash khoá
      const passwordHash = await hashPassword(lockedPassword);
      await sql.query(
        `INSERT INTO users (
           employee_code, username, full_name, department, tier, team_label, personal_email, phone, password_hash,
           job_title, gender, birth_date, office, start_date, work_schedule, position_title,
           employment_status, employment_type, salary_policy, confirmation_date
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
         ON CONFLICT (employee_code) DO UPDATE SET
           username = EXCLUDED.username, full_name = EXCLUDED.full_name,
           department = EXCLUDED.department, tier = EXCLUDED.tier,
           team_label = EXCLUDED.team_label, personal_email = EXCLUDED.personal_email,
           phone = EXCLUDED.phone, job_title = EXCLUDED.job_title, gender = EXCLUDED.gender,
           birth_date = EXCLUDED.birth_date, office = EXCLUDED.office, start_date = EXCLUDED.start_date,
           work_schedule = EXCLUDED.work_schedule, position_title = EXCLUDED.position_title,
           employment_status = EXCLUDED.employment_status, employment_type = EXCLUDED.employment_type,
           salary_policy = EXCLUDED.salary_policy, confirmation_date = EXCLUDED.confirmation_date,
           updated_at = now()`,
        [
          u.employeeCode,
          u.username,
          u.fullName,
          u.department,
          u.tier,
          u.teamLabel,
          u.personalEmail,
          u.phone,
          passwordHash,
          u.jobTitle,
          u.gender,
          u.birthDate,
          u.office,
          u.startDate,
          u.workSchedule,
          u.positionTitle,
          u.employmentStatus,
          u.employmentType,
          u.salaryPolicy,
          u.confirmationDate,
        ]
      );
      ok += 1;
    } catch (err) {
      failed += 1;
      console.error(`  LỖI Mã ${u.employeeCode} (${u.username}): ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log(`\nHoàn tất: ${ok} thành công, ${failed} lỗi.`);
}

async function main() {
  const isImport = process.argv.includes('--import');
  const users = loadRows();
  printSummary(users);

  if (!isImport) {
    console.log('\n[DRY-RUN] Không ghi gì vào DB. Chạy lại kèm --import để ghi thật.');
    return;
  }
  await importUsers(users);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
