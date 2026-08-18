---
phase: 4
title: "Phase 4: Multi-document rule content model + per-user permissions"
status: todo
priority: P1
effort: "1.5d"
dependencies: [1, 3]
---

# Phase 4: Multi-document rule content model + per-user permissions

## Overview

Mở rộng `SOP_DOCUMENTS` (hiện có đúng 1 tài liệu, visibility theo department/tier) thành registry nhiều tài liệu, mỗi tài liệu kiểm quyền đọc theo **danh sách người cụ thể** (từ bảng `rule_permissions` — Phase 1) thay vì department/tier. **[RED-TEAM FIX] Bao gồm cả bước backfill quyền cho tài liệu hiện có** (chuyển từ Phase 6 về đây — xem lý do ở mục cuối) để tránh khoảng trống thời gian tài liệu "biến mất" với người đang cần dùng.

## Quyết định kiến trúc: nội dung ở code, quyền ở DB

**Không** đưa nội dung tài liệu (title, sections, tables...) vào DB — vẫn khai báo trong TS như hiện tại. **Chỉ** bảng `rule_permissions` (user_id × doc_id) nằm trong DB, do BGĐ chỉnh qua trang admin (Phase 5). Lý do: tránh xây CMS ngoài yêu cầu, giữ nguyên cách vận hành hiện tại (xem README).

## Requirements

- Functional:
  - [x] `RULE_DOCUMENTS` registry hỗ trợ N tài liệu (ban đầu vẫn 1 tài liệu thật `sop-all-print-product`).
  - [x] Route đọc tài liệu: `/dashboard/rule` — **[IMPLEMENTATION NOTE] không tách route `[docId]` riêng như plan gốc dự tính.** Trang hiện tại đã hiển thị mọi tài liệu user được xem xếp chồng trên cùng 1 trang (kèm mục lục sticky nhảy neo `#section-id`) — với 1 tài liệu hiện có, cấu trúc này đã đúng và đơn giản hơn thêm route `[docId]`. Chỉ đổi nguồn lọc quyền (`docIdsVisibleTo` thay `canView`), giữ nguyên toàn bộ layout/UI. Nếu số tài liệu tăng nhiều (gần 10 như dự tính) và trang trở nên quá dài, cân nhắc tách route lúc đó — chưa cần bây giờ (YAGNI).
  - [x] Quyền đọc: user thấy tài liệu khi có dòng `rule_permissions(user_id, doc_id)`, HOẶC `tier === 'full'` (BGĐ luôn thấy hết).
  - [x] Không còn field `visibility` trên `RuleDocument` — đây là thay đổi hành vi mặc định (không ai thấy tới khi được cấp quyền tường minh), **được bù đắp bằng backfill script bắt buộc trước khi tắt rule cũ** (xem Implementation Steps).
- Non-functional:
  - [x] Query quyền đọc gộp 1 lần cho cả danh sách tài liệu (tránh N+1).
  - [x] **[RED-TEAM FIX] Query quyền đọc dùng chung giữa `/dashboard/rule` và `/dashboard/page.tsx` (trang chủ)** — cả 2 nơi đều cần biết user thấy bao nhiêu/tài liệu nào, không viết 2 lần logic khác nhau.

## [RED-TEAM FIX — Critical, phát hiện bởi cả 4 reviewer] File bị bỏ sót trong bản trước

Bản kế hoạch gốc nói `components/dashboard/sop-document.tsx` "tái dùng nguyên" và không liệt kê `app/dashboard/page.tsx` — đã verify trực tiếp cả 2 claim đều SAI:
- `components/dashboard/sop-document.tsx:88` — `<VisibilityBadge visibility={doc.visibility} />` — dùng field sắp bị xoá, PHẢI sửa.
- `app/dashboard/page.tsx:39` — `const sopCount = SOP_DOCUMENTS.filter((s) => canView(session, s.visibility)).length;` — dùng field sắp bị xoá, PHẢI sửa. File này còn dùng `canView` cho 5 loại nội dung khác (`app/dashboard/page.tsx:33,41,42,44,45`) — CHỈ sửa phần `sopCount`, không đụng phần còn lại.

Cả 2 file này thêm vào danh sách sửa bên dưới.

## Architecture

`lib/content/sop.ts`:
- Bỏ field `visibility` khỏi `SopDocument` interface.
- `SOP_DOCUMENTS` → `RULE_DOCUMENTS`, `SopDocument` → `RuleDocument` — rename có kiểm soát.

`lib/rule-permissions.ts` (mới):
```ts
export async function docIdsVisibleTo(userId: number, tier: Tier): Promise<Set<string> | 'all'>
// tier === 'full' → return 'all' — LƯU Ý: đây KHÔNG khớp với canView() hiện tại trong lib/roles.ts
// (canView bypass theo department==='bgd', không phải tier==='full'). Hai điều kiện này đang được
// coi là tương đương chỉ vì CHECK constraint (department='bgd')=(tier='full') ở Phase 1 ép chúng luôn
// đi cùng nhau — miễn CHECK đó còn tồn tại thì an toàn, không tự ý nới lỏng CHECK này sau này
// mà không rà lại chỗ này.
// ngược lại → SELECT doc_id FROM rule_permissions WHERE user_id = $1
```

`components/dashboard/sop-document.tsx`: bỏ dòng `<VisibilityBadge visibility={doc.visibility} />` — thay bằng không hiển thị badge nữa (quyền giờ là per-user, không còn khái niệm "khối nào xem được" để hiện badge theo kiểu cũ), hoặc badge tĩnh "Tài liệu giới hạn quyền đọc" không cần dữ liệu động. Chọn phương án đơn giản nhất: bỏ badge.

`app/dashboard/page.tsx`: đổi dòng tính `sopCount` — gọi `docIdsVisibleTo(session.userId, session.tier)` (1 query, dùng lại kết quả nếu trang cũng cần cho phần khác), `sopCount = result === 'all' ? RULE_DOCUMENTS.length : result.size`. Các dòng `canView` khác (thông báo, chính sách, khen thưởng, văn hoá) giữ nguyên, không đổi.

`app/dashboard/rule/page.tsx`: đổi filter sang `docIdsVisibleTo`.

## Related Code Files

- Modify: `lib/content/sop.ts` — bỏ `visibility`, rename `SOP_DOCUMENTS` → `RULE_DOCUMENTS`, `SopDocument` → `RuleDocument`.
- Modify: `lib/content/types.ts` — xác nhận `Visibility` type vẫn giữ nguyên (còn dùng bởi 5 module nội dung khác: announcements, culture, notices, policies, recognition — KHÔNG đụng các module này).
- Create: `lib/rule-permissions.ts` — `docIdsVisibleTo`.
- Modify: `app/dashboard/rule/page.tsx` — đổi cách filter sang `docIdsVisibleTo`, giữ nguyên UI xếp chồng nhiều tài liệu đã có sẵn (không tách route `[docId]` — xem [IMPLEMENTATION NOTE] ở Requirements).
- **[RED-TEAM FIX] Modify: `components/dashboard/sop-document.tsx`** — bỏ `VisibilityBadge`, sửa import type theo tên mới.
- **[RED-TEAM FIX] Modify: `app/dashboard/page.tsx`** — chỉ sửa dòng tính `sopCount`, giữ nguyên phần còn lại của trang.
- **[RED-TEAM FIX] Create: `scripts/backfill-rule-permissions.ts`** — script one-off, granted_by = NULL, action ghi `permission.backfill` trong audit log, cấp quyền `sop-all-print-product` cho toàn bộ user có `department IN ('sx-in', 'kinh-doanh')` (đúng quy tắc cũ đang áp dụng, xem `lib/content/sop.ts:258` hiện tại). Chạy script này LÀ MỘT BƯỚC BẮT BUỘC của phase này, không phải việc để dành cho Phase 6.

## Implementation Steps

1. Viết `lib/rule-permissions.ts`.
2. Đổi `lib/content/sop.ts`: bỏ `visibility`, rename.
3. Sửa `components/dashboard/sop-document.tsx` (bỏ VisibilityBadge, sửa import).
4. Sửa `app/dashboard/page.tsx` (chỉ dòng `sopCount`).
5. Tách route: `/dashboard/rule` (danh sách) + `/dashboard/rule/[docId]` (chi tiết).
6. **[RED-TEAM FIX] Viết `scripts/backfill-rule-permissions.ts`, chạy NGAY sau khi migrate DB + import user xong (Phase 1+2 đã hoàn tất) và TRƯỚC KHI deploy code Phase 4 lên Production** — tức là: chạy script trực tiếp trên Production DB (không qua UI, vì admin panel Phase 5 chưa deploy), sau đó mới deploy code Phase 4. Thứ tự đúng: (a) migrate+import xong ở Production DB, (b) chạy backfill script trên Production DB, (c) deploy code Phase 3+4, (d) lúc này mọi user liên quan đã có `rule_permissions` sẵn từ bước (b), không có khoảng trống mất quyền.
7. Test: user không có quyền nào → `/dashboard/rule` hiện thông báo trống. User được cấp quyền qua backfill → thấy đúng tài liệu.

## Success Criteria

- [x] Tài liệu SOP hiện có hiển thị đúng nguyên nội dung sau khi đổi kiến trúc quyền.
- [x] User không có `rule_permissions` nào → KHÔNG thấy tài liệu.
- [x] User tier `full` luôn thấy mọi tài liệu.
- [x] **[RED-TEAM FIX]** Ngay sau khi deploy Phase 4 lên Production, TOÀN BỘ user thuộc `sx-in`/`kinh-doanh` (50 người) vẫn thấy `sop-all-print-product` — verify bằng cách đếm số dòng `rule_permissions` cho `doc_id='sop-all-print-product'` PHẢI = số user `department IN ('sx-in','kinh-doanh')` TRƯỚC khi deploy code lên Production.
- [x] `app/dashboard/page.tsx` build pass, `sopCount` hiển thị đúng số tài liệu user thực sự thấy được (không còn dùng field `visibility` đã xoá).
- [x] Grep `SOP_DOCUMENTS`, `SopDocument` (bare, không phải `SopDocumentView`), field `visibility` trên `RuleDocument` không còn xuất hiện.
- [x] `npm run build` pass. **[IMPLEMENTATION NOTE]** verify được qua `tsc --noEmit` (sạch) + test thật trên dev server (đăng nhập, xem tài liệu, sopCount đúng) — lệnh `npm run build` bị 1 hook chặn không cho agent chạy trực tiếp trong phiên này, cần user tự chạy để xác nhận lần cuối trước khi merge.

## Risk Assessment

- **[RED-TEAM FIX] Rủi ro đã được giải quyết trong phase này (trước đây bị đẩy sang Phase 6 và tạo vòng lặp không thể thực hiện):** backfill giờ chạy TRƯỚC deploy (bước 6), không phụ thuộc trang admin Phase 5 (dùng script trực tiếp), nên không còn tình huống "cần trang admin để cấp quyền nhưng trang admin chỉ có sau khi deploy".
- **Rủi ro còn lại:** nếu BGĐ muốn mở rộng quyền cho tài liệu này (khác với 50 người theo quy tắc cũ) thì vẫn phải chờ Phase 5 (trang admin) — chấp nhận được, backfill chỉ đảm bảo KHÔNG MẤT quyền đang có, không phải nơi mở rộng quyền mới.
