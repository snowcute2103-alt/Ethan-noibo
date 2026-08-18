# Ethan Ecom — Nội Bộ

Cổng thông tin nội bộ, đăng nhập theo khối/vị trí công việc, mỗi khối chỉ thấy nội dung của mình. Next.js 16 (App Router) + TypeScript + Tailwind. Deploy Vercel, gắn subdomain `noibo.ethanecom.com`.

## Vai trò đăng nhập

Tài khoản **cá nhân** (mỗi người 1 tài khoản, lưu trong Postgres — xem mục Database), không còn tài khoản dùng chung theo khối. Mỗi người thuộc 1 khối + 1 cấp (`staff` / `leader`), riêng BGĐ có cấp `full` xem hết mọi nội dung. Định nghĩa khối/nhãn hiển thị: [`lib/roles.ts`](lib/roles.ts). BGĐ tạo/sửa/khoá tài khoản, đặt lại mật khẩu, gán quyền tài liệu qua trang quản trị `/dashboard/admin` — không sửa trực tiếp trong code hay env vars.

| Khối | Cấp |
|---|---|
| Ban Giám Đốc | `full` (toàn quyền) |
| Kinh Doanh | `staff` / `leader` |
| Sản Xuất — Thêu | `staff` / `leader` |
| Sản Xuất — In/POD | `staff` / `leader` |
| R&D | `staff` / `leader` |
| IT / Development | `staff` / `leader` |
| Fulfillment | `staff` / `leader` |

## Nội dung

Nội dung hiện là **dữ liệu mẫu (placeholder)** trong [`lib/content.ts`](lib/content.ts) — mỗi mục gắn `visibility` (khối nào, cấp tối thiểu nào được xem). Thay bằng nội dung thật khi vận hành: sửa trực tiếp file này (không cần database cho quy mô hiện tại).

## Chạy local

```bash
npm install
cp .env.example .env.local   # rồi điền SESSION_SECRET + DATABASE_URL (xem mục Database)
npm run dev
```

`.env.local` không được commit (đã gitignore). `SESSION_SECRET` là chuỗi ngẫu nhiên ≥32 ký tự dùng để ký session JWT.

## Database

Postgres qua tích hợp Neon (Vercel Storage/Marketplace), project `ethan-noibo`, chỉ gắn môi trường **Production** (không gắn Preview — tránh code chưa review đụng dữ liệu nhân sự thật). Biến kết nối chính: `DATABASE_URL` (Vercel còn tạo thêm biến có prefix `STORAGE_URL_...` do lịch sử tích hợp — `lib/db.ts` đọc `DATABASE_URL` trước, `STORAGE_URL_DATABASE_URL`/`POSTGRES_URL` là dự phòng).

```bash
npx vercel env pull .env.local --yes --environment=production   # lấy DATABASE_URL thật (biến này đánh dấu Sensitive nên chỉ pull được, không xem lại được qua dashboard/CLI — cần giá trị mới thì lấy ở trang Neon: Storage → database → nút "Show secret")
npm run db:migrate                                                # tạo/cập nhật schema, chạy lại an toàn (idempotent)
```

Schema: `db/schema.sql` (4 bảng — `users`, `rule_permissions`, `admin_audit_log`, `login_attempts`). `login_attempts` không tự dọn — định kỳ (vd hàng tháng) chạy tay `DELETE FROM login_attempts WHERE created_at < now() - interval '30 days'`.

**Blob storage:** ảnh đại diện lưu qua Vercel Blob (store `ethan-noibo-avatars`, access `public` — URL không đoán được nhưng không cần signed request để hiển thị `<img>`). Biến `BLOB_READ_WRITE_TOKEN` tự inject khi link store, pull như trên. Upload/thay ảnh qua `/dashboard/admin/users/[id]` (chỉ BGĐ) — ảnh cũ tự xoá khỏi Blob khi thay ảnh mới.

## Deploy lên Vercel + subdomain

**Đã làm xong (2026-08-15):**
- Project `snow5/ethan-noibo` đã tạo trên Vercel, connect GitHub repo này (auto-deploy mỗi lần push `main`).
- Deploy production đầu tiên: **https://ethan-noibo.vercel.app** — đã test login/logout/phân quyền, chạy đúng.
- Domain `noibo.ethanecom.com` đã add vào project.

**Cutover sang tài khoản cá nhân (2026-08-18):**
- `SESSION_SECRET` đã rotate (thu hồi toàn bộ session cũ), 13 biến `AUTH_PASSWORD_*` (hệ thống tài khoản theo khối cũ) đã xoá khỏi Vercel Production — code không còn đọc các biến này từ commit `8cb5f03`.
- Env Production hiện chỉ còn `SESSION_SECRET` + các biến kết nối DB (`DATABASE_URL` và các biến `STORAGE_URL_*` do tích hợp Neon tạo).
 
**Còn thiếu — cần làm ở nơi quản lý DNS của `ethanecom.com`** (không phải trong Caddyfile của site chính, DNS quản lý riêng ở registrar):
```
A   noibo   76.76.21.21
```
Kiểm tra lại bằng `vercel domains inspect noibo.ethanecom.com` — khi nào hết cảnh báo "not configured properly" là xong, Vercel tự cấp SSL. Trên site chính (Ethan-main), nút "NỘI BỘ" đã trỏ sẵn tới `https://noibo.ethanecom.com` (xem `INTERNAL_PORTAL_URL` trong `assets/js/contact-popup.js` và `assets/js/shared.js`) — không cần sửa gì thêm.

## Bảo mật / vận hành

- Tài khoản cá nhân theo từng người (bảng `users` trong Postgres), không còn tài khoản dùng chung theo khối. Có lưu PII nhân sự thật: họ tên, mã nhân viên, email cá nhân, số điện thoại, ngày sinh, ngày vào làm, chức danh, văn phòng — xem `db/schema.sql`.
- Mật khẩu hash bằng scrypt, không lưu plaintext. Tài khoản import từ Excel HR ở trạng thái "khoá" (mật khẩu ngẫu nhiên, không gửi ai) — BGĐ tự đặt lại qua trang admin (`/dashboard/admin`) khi cấp phát cho từng người.
- Session có thể thu hồi ngay lập tức qua `session_version` (đổi mật khẩu hoặc BGĐ khoá tài khoản → session cũ hết hạn ngay). Rate-limit đăng nhập theo username+IP (`login_attempts`), BGĐ có thể mở khoá thủ công qua trang admin.
- Phân quyền tài liệu SOP theo từng người (`rule_permissions`), không còn theo khối. Mọi thao tác quản trị (tạo/sửa/xoá user, đặt lại mật khẩu, gán quyền, mở khoá rate-limit) được ghi vào `admin_audit_log`.
- `robots: noindex` đã set sẵn trong `app/layout.tsx` — nhưng vẫn nên coi subdomain là "unlisted" chứ không phải bảo mật tuyệt đối.
