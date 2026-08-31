/**
 * Import báo cáo công việc hoàn thành ngày 27/08/2026 của Tuyết (IT,
 * username tuyetpham03) vào Task cá nhân trên Giao Task — mỗi hạng mục lớn
 * trong báo cáo thành 1 task, trạng thái "done" (báo cáo ghi "đã hoàn thành"),
 * chi tiết từng gạch đầu dòng gộp vào note.
 *
 * Idempotent: bỏ qua nếu đã có task cùng ngày/tiêu đề cho Tuyết (tránh trùng
 * khi chạy lại nhiều lần).
 *
 * npx tsx --env-file=.env.local scripts/import-tuyet-report-2026-08-27.ts
 */
import { sql } from '../lib/db';

const TASK_DATE = '2026-08-27';
const OWNER_USERNAME = 'tuyetpham03';

const TASKS: { title: string; note: string }[] = [
  {
    title: 'Website ADS - CMS: Thêm module Ads (SSO tạm thời qua iframe)',
    note: [
      'Thêm module Ads vào tiktok-cms với cầu nối SSO tạm thời: nhúng app Ads riêng qua iframe, dùng token ký ngắn hạn (2 phút) để tự đăng nhập, bỏ qua bước nhập mật khẩu theo đội của app Ads.',
      'Đã push lên GitLab (chưa vào main).',
      'Tính năng mới: trang chứa iframe Ads, logic dựng URL SSO, module export chuẩn.',
      'Nối vào app chính: thêm route /ads, mục nav "Ads" trên sidebar, chế độ sáng-tối như trên CMS.',
      'Cấu hình: thêm 2 biến môi trường (URL backend Ads, secret ký token SSO).',
      'Bổ sung tài liệu mô tả cấu trúc UI (docs/ui-structure.md).',
    ].join('\n'),
  },
  {
    title: 'Website Ethan Nội Bộ: Cập nhật giao diện mobile & tablet',
    note: 'Cập nhật giao diện phiên bản mobile và tablet.',
  },
  {
    title: 'Website Ethan Nội Bộ: Tạo trang Báo cáo (Lighthouse, Search Console, Analytics)',
    note: [
      'Mỗi tuần tự tổng hợp dữ liệu từ Google Lighthouse, Google Search Console và Google Analytics để theo dõi và điều chỉnh web ethanecom.',
      'Route mới có kiểm tra phiên đăng nhập, tự chuyển về /login nếu chưa đăng nhập, bố cục responsive.',
      'Giao diện dashboard báo cáo: bộ chọn ngày, tooltip giải thích chỉ số, hiển thị xu hướng tăng/giảm/không đổi.',
      'Đã tạo dữ liệu báo cáo snapshot ngày 27/08: Lighthouse, Search Console, Analytics, Traffic overview.',
      'Cấu trúc cho phép thêm report mới mà vẫn giữ lịch sử cũ.',
    ].join('\n'),
  },
];

async function main() {
  const ownerRows = await sql.query('SELECT id FROM users WHERE username = $1', [OWNER_USERNAME]);
  if (!ownerRows[0]) throw new Error(`Không tìm thấy user ${OWNER_USERNAME}.`);
  const ownerUserId = ownerRows[0].id as number;

  let created = 0;
  let skipped = 0;
  for (const task of TASKS) {
    const rows = await sql.query(
      `INSERT INTO tasks (owner_user_id, task_date, title, note, status, created_by)
       SELECT $1, $2, $3, $4, 'done', $1
       WHERE NOT EXISTS (
         SELECT 1 FROM tasks WHERE owner_user_id = $1 AND task_date = $2 AND title = $3
       )
       RETURNING id`,
      [ownerUserId, TASK_DATE, task.title, task.note]
    );
    if (rows.length > 0) created += 1;
    else skipped += 1;
  }

  console.log(`Tuyết ${TASK_DATE}: tạo ${created} task cá nhân, bỏ qua ${skipped} task đã tồn tại.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
