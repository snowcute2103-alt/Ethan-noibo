import 'server-only';

const VN_DATE_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

function todayInHanoi(): { y: number; m: number; d: number } {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .split('-')
    .map(Number);
  return { y, m, d };
}

/** "Hôm nay" theo giờ VN, dạng YYYY-MM-DD — dùng làm mốc mặc định cho trang
 *  Giao Task (server chạy trên hạ tầng UTC, không được lấy `new Date()` trần). */
export function todayIso(): string {
  const { y, m, d } = todayInHanoi();
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * Số ngày đã trôi qua kể từ một mốc "DD/MM/YYYY" tới hôm nay (giờ VN).
 * Âm = ngày trong tương lai. Trả về null nếu chuỗi không đúng định dạng.
 */
export function daysSince(dateStr: string): number | null {
  const match = dateStr.match(VN_DATE_RE);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const target = Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd));
  const { y, m, d } = todayInHanoi();
  const today = Date.UTC(y, m - 1, d);
  return Math.round((today - target) / 86_400_000);
}

/** [from, to) nửa mở cho 1 tháng (yearMonth dạng "YYYY-MM") — dùng thay
 *  `to_char(task_date, 'YYYY-MM') = ...` trong câu SQL: bọc hàm lên cột index
 *  làm Postgres mất khả năng dùng index (team_id, task_date)/(owner_user_id,
 *  task_date) sẵn có, phải quét toàn bảng. So sánh khoảng trực tiếp trên cột
 *  DATE thì tận dụng được index, nhanh hơn nhiều khi bảng tasks lớn dần. */
export function monthRange(yearMonth: string): { from: string; to: string } {
  const [year, month] = yearMonth.split('-').map(Number);
  const from = `${yearMonth}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const to = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  return { from, to };
}
