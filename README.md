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

1. Import repo này vào Vercel (New Project → chọn repo).
2. Trong Vercel → Project → Settings → Environment Variables: khai báo **toàn bộ** biến trong `.env.example` (SESSION_SECRET + 13 mật khẩu tài khoản) cho môi trường Production. Đổi mật khẩu khác với bản dev/local trước khi phát cho nhân viên.
3. Deploy.
4. Vercel → Project → Settings → Domains → thêm `noibo.ethanecom.com`. Vercel sẽ cho 1 giá trị CNAME (thường là `cname.vercel-dns.com`).
5. Ở nơi quản lý DNS của `ethanecom.com` (hiện site chính chạy Caddy — DNS thường quản lý riêng ở registrar/nhà cung cấp DNS, không phải trong Caddyfile), thêm record:
   ```
   CNAME   noibo   cname.vercel-dns.com
   ```
6. Đợi DNS propagate (vài phút → vài giờ), Vercel tự cấp SSL.
7. Trên site chính (Ethan-main), nút "NỘI BỘ" đã trỏ sẵn tới `https://noibo.ethanecom.com` (xem `assets/js/contact-popup.js` và `assets/js/shared.js`, tìm `INTERNAL_PORTAL_URL` / `noibo.ethanecom.com`) — không cần sửa gì thêm nếu dùng đúng subdomain này.

## Bảo mật / vận hành

- Không có database — không lưu thông tin cá nhân nhân viên (không PII). Tài khoản là theo khối, không phải theo người.
- Đổi mật khẩu định kỳ qua Environment Variables trên Vercel (redeploy để áp dụng).
- `robots: noindex` đã set sẵn trong `app/layout.tsx` — nhưng vẫn nên coi subdomain là "unlisted" chứ không phải bảo mật tuyệt đối; đừng đăng nội dung tối mật (lương, hợp đồng) nếu chưa nâng cấp lên tài khoản cá nhân + audit log.
- Muốn phân quyền chi tiết hơn (tài khoản cá nhân, đổi mật khẩu tự phục vụ, lịch sử đăng nhập) → cần thêm database (vd Supabase/Postgres), đây là bước mở rộng sau, chưa làm ở bản này.
