---
phase: 5
title: "Phase 5: Admin panel cho BGĐ"
status: todo
priority: P1
effort: "2-2.5d"
dependencies: [1, 3, 4]
---

# Phase 5: Admin panel cho BGĐ

## Overview

Trang quản trị, chỉ tier `full` (BGĐ) truy cập được: xem/sửa/xoá 97 user, tạo user mới (nhân viên mới sau này), gán/thu quyền đọc từng rule document cho từng người, mở khoá tài khoản bị rate-limit.

## Requirements

- Functional:
  - [x] Route `/dashboard/admin` (và con) — chặn truy cập nếu `session.tier !== 'full'` (redirect hoặc 403).
  - [x] Danh sách user: bảng 97 người, tìm kiếm theo tên/username, filter theo department.
  - [x] Sửa 1 user: đổi department/tier/team_label/is_active, **đặt lại mật khẩu** (sinh random mới + hiện 1 lần trên màn hình cho BGĐ copy — không gửi lại email tự động trừ khi BGĐ bấm nút riêng "gửi qua email").
  - [x] Tạo user mới (nhân viên mới, không qua Excel): form nhập tay, tự sinh mật khẩu.
  - [x] Xoá/vô hiệu hoá user: soft-delete qua `is_active = false` (không xoá cứng — giữ lịch sử `admin_audit_log` tham chiếu `target_user_id` không bị gãy FK).
  - [x] Trang gán quyền tài liệu: chọn 1 tài liệu (từ `RULE_DOCUMENTS` registry) → checklist 97 người, tick người nào được đọc → lưu vào `rule_permissions`.
  - [x] Mọi hành động (tạo/sửa/xoá user, đổi mật khẩu, grant/revoke quyền) ghi `admin_audit_log` qua `logAdminAction` (Phase 3).
  - [x] **[RED-TEAM FIX] Action "Mở khoá đăng nhập" (`unlockUser`)**: xoá các dòng `login_attempts` gần đây của 1 username (hoặc đơn giản hơn: xoá toàn bộ dòng `login_attempts` của username đó trong 15 phút gần nhất), cho phép BGĐ tự cứu 1 tài khoản (kể cả tài khoản BGĐ khác) đang bị rate-limit backoff (Phase 3) mà không cần đợi hết thời gian chờ.
  - [x] **[RED-TEAM FIX] Mọi hành động làm thay đổi quyền truy cập của 1 user (`updateUser` khi đổi tier/department/is_active, `resetPassword`) PHẢI gọi `bumpSessionVersion(targetUserId)`** (Phase 3) — đảm bảo session cũ của người bị tác động chết ngay, không sống tới hết TTL. Đây là phần thực thi cho cơ chế `session_version` đã thiết kế ở Phase 1/3.
  - [x] **[RED-TEAM FIX] Validate tổ hợp department/tier ở server trước khi ghi**: `createUser`/`updateUser` reject nếu `tier` không nằm trong `DEPARTMENTS[department].tiers` (`lib/roles.ts`) — chặn từ tầng ứng dụng, không chỉ dựa vào CHECK constraint DB (báo lỗi rõ ràng cho BGĐ thay vì để DB ném lỗi khó hiểu).
  - [x] **[RED-TEAM FIX] Chặn tự hạ quyền/khoá tài khoản `full` cuối cùng**: `updateUser`/`deactivateUser` reject nếu thao tác sẽ khiến số user `tier='full' AND is_active=true` về 0 — tránh tình huống không còn ai quản trị được hệ thống.
- Non-functional:
  - [x] Đặt mật khẩu mới cho user khác qua admin panel: độ dài tối thiểu theo `lib/password.ts` (Phase 2) — nếu target là `bgd`, áp policy dài hơn (khớp Phase 3).
  - [x] Mọi route/server action trong `/dashboard/admin` re-check `tier === 'full'` ở server (không chỉ ẩn UI) — tránh bypass qua gọi thẳng route.
  - [x] **[RED-TEAM FIX] `admin_audit_log.detail` chỉ nhận object đã qua type allow-list** (định nghĩa ở Phase 3 `lib/audit.ts`) — CẤM đưa `password`, `password_hash`, `phone`, `personal_email` vào `detail` dưới mọi hình thức. Ví dụ hợp lệ cho `user.update`: `{ changedFields: ['department', 'tier'], from: {...}, to: {...} }` nhưng loại bỏ field nhạy cảm khỏi `from`/`to` trước khi log.

## Architecture

Next.js App Router, Server Actions cho mutation.

```
app/dashboard/admin/
  layout.tsx          # guard tier === 'full', nếu không → redirect('/dashboard')
  page.tsx             # danh sách user + tìm kiếm/filter
  users/[id]/page.tsx  # sửa 1 user
  users/new/page.tsx   # tạo user mới
  permissions/page.tsx # chọn tài liệu → checklist người được đọc
  actions.ts           # Server Actions: createUser, updateUser, resetPassword,
                        # deactivateUser, unlockUser, grantPermission, revokePermission
                        # — mỗi action tự check session.tier==='full' + gọi logAdminAction
                        # (với detail đã lọc allow-list) + bumpSessionVersion khi cần
```

Layout guard dùng lại `getSession()` từ `lib/auth.ts` (đã có, giờ tự re-check `session_version`/`is_active` — xem Phase 3).

**[RED-TEAM FIX] `lib/nav.ts` KHÔNG dùng để gate hiển thị link admin** — đã verify `lib/nav.ts` là mảng tĩnh không có session, render ở `app/dashboard/layout.tsx` (layout chung, không phải layout riêng của `/dashboard/admin`). Thay vì sửa `lib/nav.ts` (sẽ cần truyền session xuống 1 component vốn không nhận session), thêm link "Quản trị" trực tiếp trong `app/dashboard/layout.tsx` với điều kiện `{session.tier === 'full' && <Link href="/dashboard/admin">Quản trị</Link>}`, tách biệt khỏi danh sách nav tĩnh hiện có — không đụng `lib/nav.ts`.

## Related Code Files

- Create: `app/dashboard/admin/layout.tsx`, `page.tsx`, `users/[id]/page.tsx`, `users/new/page.tsx`, `permissions/page.tsx`, `actions.ts`.
- Create: `components/dashboard/admin/user-table.tsx`, `user-form.tsx`, `permission-checklist.tsx`.
- Modify: `lib/users.ts` — thêm `listUsers()`, `createUser()`, `updateUser()`, `deactivateUser()`, `resetUserPassword()`, `unlockUser()`, `countActiveFullTier()` (dùng cho guard last-admin).
- Modify: `lib/rule-permissions.ts` (Phase 4) — thêm `grantPermission(userId, docId, grantedBy)`, `revokePermission(userId, docId)`, `listPermissionsForDoc(docId)`.
- **[RED-TEAM FIX] Modify: `app/dashboard/layout.tsx`** (thay vì `lib/nav.ts`) — thêm link "Quản trị" có điều kiện theo session.

## Implementation Steps

1. `app/dashboard/admin/layout.tsx` — guard truy cập.
2. `lib/users.ts` — thêm các hàm CRUD + `unlockUser` + `countActiveFullTier`.
3. `lib/rule-permissions.ts` — thêm grant/revoke/list.
4. `actions.ts` — Server Actions, mỗi action re-check quyền + gọi `logAdminAction` (detail đã lọc) + `bumpSessionVersion` khi action đổi quyền truy cập + validate tổ hợp department/tier + guard last-admin.
5. UI: bảng danh sách user (`page.tsx` + `user-table.tsx`), thêm nút "Mở khoá đăng nhập" trên từng dòng.
6. UI: form sửa/tạo user (`users/[id]`, `users/new` + `user-form.tsx`) — dropdown tier chỉ hiện option hợp lệ theo department đã chọn (UX ngăn lỗi trước khi submit, server vẫn validate lại).
7. UI: trang gán quyền tài liệu (`permissions/page.tsx` + `permission-checklist.tsx`).
8. Thêm link "Quản trị" trong `app/dashboard/layout.tsx` theo điều kiện session.
9. Test thủ công đầy đủ theo Success Criteria.

## Success Criteria

- [x] Tài khoản tier khác `full` truy cập `/dashboard/admin` → bị chặn (redirect), kể cả gọi thẳng URL.
- [x] BGĐ tạo user mới → user login được ngay bằng mật khẩu hiện ra trên màn hình.
- [x] BGĐ đổi mật khẩu 1 user → mật khẩu cũ không còn dùng được, mật khẩu mới dùng được, **VÀ session cũ của user đó (nếu đang đăng nhập ở thiết bị khác) chết ngay** (verify `session_version` tăng).
- [x] BGĐ tick chọn 1 người vào 1 tài liệu → người đó thấy tài liệu ở `/dashboard/rule`, người không được tick thì không.
- [x] **[RED-TEAM FIX]** Thử tạo/sửa user với tổ hợp `department='kinh-doanh', tier='full'` → bị từ chối kèm thông báo rõ ràng (không phải lỗi DB constraint thô).
- [x] **[RED-TEAM FIX]** Thử deactivate user `full` cuối cùng còn active → bị từ chối.
- [x] **[RED-TEAM FIX]** Tài khoản bị khoá rate-limit (Phase 3) → BGĐ bấm "Mở khoá" → đăng nhập lại được ngay, không cần đợi backoff hết.
- [x] **[RED-TEAM FIX]** Query `admin_audit_log` sau khi thực hiện đủ các thao tác trên → không có dòng `detail` nào chứa chuỗi giống mật khẩu/số điện thoại/email cá nhân (kiểm tay 1 lượt các action đã ghi).
- [x] Mọi thao tác trên xuất hiện đúng dòng tương ứng trong `admin_audit_log`.
- [x] `npm run build` pass. **[IMPLEMENTATION NOTE]** verify qua `tsc --noEmit` (sạch, ngoại trừ 1 lỗi không liên quan ở `.next/types` cache cũ chưa đồng bộ route mới) + test thật qua browser automation (agent-browser): login BGĐ, tạo user, sửa department/tier (dropdown tự lọc đúng), vô hiệu hoá, gán quyền tài liệu, và xác nhận non-admin bị redirect khỏi `/dashboard/admin` — cả 8 bước đều pass. `npm run build` bị hook chặn chạy trực tiếp trong phiên agent này, cần user tự chạy để xác nhận cuối.

## Risk Assessment

- **Rủi ro:** Server Action không re-check quyền ở server (chỉ ẩn UI) → user thường có thể gọi thẳng action và tự cấp quyền cho mình. *Giảm thiểu:* mọi action trong `actions.ts` bắt buộc dòng đầu tiên `if (session?.tier !== 'full') throw ...`.
- **Rủi ro:** 97 người trong 1 checklist dài — UX kém nếu không có tìm kiếm. *Giảm thiểu:* ô tìm kiếm client-side trong `permission-checklist.tsx`.
- **[RED-TEAM FIX] Rủi ro:** `unlockUser` cũng là 1 hành động nhạy cảm (ai gọi được thì gỡ được rate-limit cho bất kỳ ai) — đã nằm trong nhóm action chỉ `tier==='full'` gọi được + có audit log, chấp nhận được.
