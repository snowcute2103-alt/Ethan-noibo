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
