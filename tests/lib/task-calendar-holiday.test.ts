import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const taskCalendarSource = readFileSync(
  new URL('../../components/dashboard/task-calendar.tsx', import.meta.url),
  'utf8'
);

test('lịch chỉ hiển thị cờ Việt Nam dưới ngày Quốc khánh 2 tháng 9', () => {
  assert.match(
    taskCalendarSource,
    /const VIETNAM_FLAG_DATES = new Set\(\['2026-09-02'\]\)/,
    'Chỉ được đánh dấu ngày Quốc khánh 2 tháng 9 năm 2026'
  );
  assert.doesNotMatch(taskCalendarSource, /2026-09-01/, 'Ngày 1 tháng 9 không được hiển thị cờ');
  assert.match(
    taskCalendarSource,
    /<span className="text-xs font-bold">[\s\S]*?<VietnamFlag \/>/,
    'Lá cờ phải nằm sau số ngày trong ô lịch'
  );
  assert.match(taskCalendarSource, /aria-label="Lá cờ Việt Nam"/, 'Lá cờ phải có nhãn hỗ trợ đọc màn hình');
  assert.match(taskCalendarSource, /className="mt-1\.5 h-3 w-\[18px\] shrink-0"/, 'Lá cờ phải cách số ngày thêm một khoảng nhỏ');
  assert.doesNotMatch(taskCalendarSource, /🇻🇳/, 'Dùng hình cờ SVG thay vì emoji phụ thuộc hệ điều hành');
});
