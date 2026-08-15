# Ethan Ecom — Nội Bộ

Cổng thông tin nội bộ, đăng nhập theo khối/vị trí công việc, mỗi khối chỉ thấy nội dung của mình. Next.js 16 (App Router) + TypeScript + Tailwind. Deploy Vercel, gắn subdomain `noibo.ethanecom.com`.

## Vai trò đăng nhập

Tài khoản dùng **chung theo khối** (không phải tài khoản cá nhân), 2 cấp mỗi khối (`staff` / `leader`), riêng BGĐ có 1 tài khoản toàn quyền xem hết mọi nội dung. Danh sách đầy đủ + biến môi trường mật khẩu: [`lib/users.ts`](lib/users.ts). Định nghĩa khối/nhãn hiển thị: [`lib/roles.ts`](lib/roles.ts).

| Khối | Username staff | Username leader |
|---|---|---|
| Ban Giám Đốc | — | `bgd` (full access) |
| Kinh Doanh | `kd-staff` | `kd-leader` |
| Sản Xuất — Thêu | `sxtheu-staff` | `sxtheu-leader` |
| Sản Xuất — In/POD | `sxin-staff` | `sxin-leader` |
| R&D | `rnd-staff` | `rnd-leader` |
| IT / Development | `it-staff` | `it-leader` |
| Fulfillment | `fulfillment-staff` | `fulfillment-leader` |

## Nội dung

Nội dung hiện là **dữ liệu mẫu (placeholder)** trong [`lib/content.ts`](lib/content.ts) — mỗi mục gắn `visibility` (khối nào, cấp tối thiểu nào được xem). Thay bằng nội dung thật khi vận hành: sửa trực tiếp file này (không cần database cho quy mô hiện tại).

## Chạy local

```bash
npm install
cp .env.example .env.local   # rồi điền SESSION_SECRET + mật khẩu từng tài khoản
npm run dev
```

`.env.local` không được commit (đã gitignore). `SESSION_SECRET` là chuỗi ngẫu nhiên ≥32 ký tự dùng để ký session JWT.

## Deploy lên Vercel + subdomain

**Đã làm xong (2026-08-15):**
- Project `snow5/ethan-noibo` đã tạo trên Vercel, connect GitHub repo này (auto-deploy mỗi lần push `main`).
- 14 biến môi trường Production (SESSION_SECRET + 13 mật khẩu, giá trị **khác** với bản dev local) đã set qua Vercel CLI — xem `vercel env ls production`. Giá trị gốc lưu ở `.env.production.local` (gitignored, chỉ trên máy này) — đổi mật khẩu qua Vercel dashboard nếu cần luân chuyển sau này.
- Deploy production đầu tiên: **https://ethan-noibo.vercel.app** — đã test login/logout/phân quyền, chạy đúng.
- Domain `noibo.ethanecom.com` đã add vào project.

**Còn thiếu — cần làm ở nơi quản lý DNS của `ethanecom.com`** (không phải trong Caddyfile của site chính, DNS quản lý riêng ở registrar):
```
A   noibo   76.76.21.21
```
Kiểm tra lại bằng `vercel domains inspect noibo.ethanecom.com` — khi nào hết cảnh báo "not configured properly" là xong, Vercel tự cấp SSL. Trên site chính (Ethan-main), nút "NỘI BỘ" đã trỏ sẵn tới `https://noibo.ethanecom.com` (xem `INTERNAL_PORTAL_URL` trong `assets/js/contact-popup.js` và `assets/js/shared.js`) — không cần sửa gì thêm.

## Bảo mật / vận hành

- Không có database — không lưu thông tin cá nhân nhân viên (không PII). Tài khoản là theo khối, không phải theo người.
- Đổi mật khẩu định kỳ qua Environment Variables trên Vercel (redeploy để áp dụng).
- `robots: noindex` đã set sẵn trong `app/layout.tsx` — nhưng vẫn nên coi subdomain là "unlisted" chứ không phải bảo mật tuyệt đối; đừng đăng nội dung tối mật (lương, hợp đồng) nếu chưa nâng cấp lên tài khoản cá nhân + audit log.
- Muốn phân quyền chi tiết hơn (tài khoản cá nhân, đổi mật khẩu tự phục vụ, lịch sử đăng nhập) → cần thêm database (vd Supabase/Postgres), đây là bước mở rộng sau, chưa làm ở bản này.
