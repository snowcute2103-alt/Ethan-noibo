---
title: "Giao Task 6 Doi Kinh Doanh"
description: "Bang giao task dung chung cho 6 doi kinh doanh (KD1..KD6): moi doi co the co nhieu quan ly, thanh vien va quan ly cung sua 1 bang task, xem theo ngay/tuan/thang, nhan ban hang loat task lap lai, du lieu luu database."
status: pending
priority: P1
effort: "~26h"
tags: ["giao-task", "kinh-doanh", "teams", "database"]
created: 2026-08-28
---

# Giao Task 6 Doi Kinh Doanh

## Overview

Xây trang "Giao Task" mới trong dashboard nội bộ: 6 đội kinh doanh độc lập
(KD1..KD6), mỗi đội có 1 hoặc nhiều quản lý tự thêm/gỡ thành viên của đội
mình, và cả đội (quản lý lẫn thành viên) cùng thao tác trên **một bảng task
dùng chung**, xem theo ngày (mặc định vào là thấy "hôm nay"), lùi/tiến theo
ngày/tuần/tháng, nhóm task theo tab tự đặt tên riêng cho từng đội (ví dụ
Media, Support Etsy, Support TikTok), và có thể nhân bản task lặp lại (copy
tay từng cái hoặc quản lý nhân bản hàng loạt ra nhiều ngày cùng lúc). Dữ
liệu lưu Postgres (Neon) qua các bảng mới `teams`, `team_members`,
`team_task_categories`, `tasks`, không đổi cấu trúc bảng `users` hiện có.

Plan này đã qua 2 vòng chốt quyết định với người dùng (xem mục Bối cảnh bên
dưới) — **không hỏi lại** các điểm đã chốt trong lúc triển khai.

## Bối cảnh đã chốt (brainstorm, 2 vòng)

### Vòng 1 — cấu trúc đội và phân quyền cơ bản

Bản vẽ luồng đầy đủ đã publish dạng artifact (sơ đồ vai trò, mô hình dữ
liệu, phân quyền, wireframe), duyệt qua `AskUserQuestion`:

1. **Ánh xạ quản lý theo đội** (đã chốt, có bổ sung ở vòng 2 — xem bảng bên
   dưới).
2. **Mức mở của bảng task**: mở hoàn toàn — bất kỳ thành viên nào trong đội
   (kể cả không phải quản lý) đều thêm/sửa/xoá được **mọi** task trong đội
   mình, không giới hạn theo người tạo.
3. **Một người, một đội**: một user chỉ thuộc đúng 1 trong 6 đội tại một
   thời điểm (`team_members.user_id` là UNIQUE).
4. **Vai trò quản lý tách khỏi bậc hồ sơ nhân sự**: không đổi `users.tier`
   của Thảo/Tiến/Hân (vẫn `staff` trong hồ sơ) — vai trò "quản lý đội task"
   là khái niệm riêng của tính năng này.

### Vòng 2 — bổ sung sau khi xem thêm ảnh Trello mẫu

5. **Nhiều quản lý trên 1 đội**: KD1 có **2 quản lý** — Tuyền và Huyền (chức
   danh hồ sơ của Huyền thấp hơn Tuyền, nhưng quyền thao tác trên bảng task
   như nhau). Hệ thống hỗ trợ **N quản lý mỗi đội** nói chung (không giới
   hạn cứng 1 người), 5 đội còn lại vẫn seed đúng 1 quản lý như vòng 1, chỉ
   KD1 seed 2 người.
6. **Nhóm/tab task do từng đội tự đặt** (không dùng danh sách cố định
   Media/Support chung cho cả 6 đội) — quản lý đội tự tạo/sửa tên/xoá nhóm
   của đội mình (ví dụ Media, Support Etsy, Support TikTok chỉ là ví dụ
   thực tế đang dùng ở KD3, đội khác có thể đặt tên khác).
7. **Task lặp lại / nhân bản**: khi nhân bản (1 task hoặc hàng loạt), hệ
   thống tạo ra **các dòng task độc lập, thật, riêng cho từng ngày** — sửa
   hoặc xoá 1 ngày không ảnh hưởng các ngày khác (không dùng mô hình "mẫu
   lặp trung tâm" kiểu recurring event). Bất kỳ thành viên nào cũng nhân
   bản được 1 task sang 1 ngày khác; quản lý nhân bản được hàng loạt (chọn
   1 task nguồn, chọn kiểu lặp hàng ngày/hàng tuần/hàng tháng + số lần hoặc
   ngày kết thúc, hệ thống tạo sẵn từng dòng tương ứng).
8. **Điều hướng theo ngày là màn hình chính**: vào trang mặc định thấy task
   của **hôm nay**, có nút lùi/tiến theo ngày, và chuyển được sang xem theo
   tuần hoặc theo tháng. Vẫn giữ layout dạng **bảng** (không làm Kanban
   nhiều cột kiểu Trello) — ảnh Trello chỉ dùng để tham khảo cách trang trí
   thẻ (nhãn màu, avatar, badge trạng thái), không phải để dựng bảng nhiều
   cột kéo thả.
9. **Nguyệt, Duy xem được toàn đội**: cả hai đã là tài khoản `tier = 'full'`
   (BGĐ) có sẵn trong hệ thống (`minhnguyet`, `duynguyen`) — khớp thẳng với
   quyền "BGĐ xem gộp cả 6 đội" đã thiết kế từ vòng 1, không cần thêm cơ chế
   riêng cho 2 người này.

### Bảng ánh xạ quản lý theo đội (bản cuối)

| Đội | Quản lý | user id | username |
|-----|---------|---------|----------|
| KD1 | Tuyền (Hoàng Thị Thanh Tuyền) **+** Huyền (Lê Thị Mỹ Huyền) | 9, 22 | `thanhtuyen`, `myhuyen97` |
| KD2 | Thư (Trịnh Anh Thư) | 23 | `anhthu2001` |
| KD3 | Duyên (Trần Ngọc Mỹ Duyên) | 16 | `myduyen` |
| KD4 | Thảo (Vũ Hoàng Nhật Thảo) | 24 | `thaovu1221` |
| KD5 | Tiến (Phạm Đức Tiến) | 31 | `ductien97` |
| KD6 | Hân (Đặng Đoàn Bảo Hân) | 25 | `baohan201` |

Các username khác đang có `team_label` KD1..KD6 trong bảng `users` là thành
viên khởi điểm (role `member`) của đội tương ứng, dùng để seed
`team_members` (xem Phase 1). Không sửa/xoá cột `users.team_label` hiện có
(đang hiển thị ở `user-menu.tsx`, admin `user-table.tsx`/`user-form.tsx`) —
coi là legacy, tính năng mới dùng bảng riêng.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | 4 bảng mới (`teams`, `team_members`, `team_task_categories`, `tasks`) migrate an toàn, seed đúng 6 đội + quản lý (KD1 có 2) + thành viên khởi điểm | P1 |
| 2 | Data access layer + server actions: quản lý thêm/gỡ thành viên, quản lý CRUD nhóm task riêng của đội, mọi người CRUD task, nhân bản 1 task hoặc hàng loạt | P1 |
| 3 | Trang `/dashboard/giao-task`: mặc định xem task hôm nay, lùi/tiến ngày, chuyển tuần/tháng, tab nhóm task tự đặt tên theo đội, tiến độ tháng, biểu đồ task theo ngày/người, roster đội | P1 |
| 4 | Phân quyền đúng theo các quyết định đã chốt, BGĐ xem gộp được cả 6 đội | P1 |
| 5 | Nav mới chỉ hiện đúng người liên quan (khối kinh doanh + BGĐ) | P2 |

## Non-goals (ngoài phạm vi lần này)

- Không áp dụng model đội này cho các khối khác (sx-theu, sx-in, rnd, it,
  fulfillment) — chỉ khối kinh doanh, 6 đội KD1..KD6.
- Không làm Kanban board nhiều cột kéo thả kiểu Trello — quyết định #8, chỉ
  giữ dạng bảng + điều hướng ngày, mượn cách trang trí thẻ từ Trello thôi.
- Không làm "mẫu lặp trung tâm" kiểu recurring event (sửa 1 chỗ ảnh hưởng
  mọi lần lặp) — quyết định #7, nhân bản luôn tạo dòng thật độc lập.
- Không thêm bảng "sản phẩm"/"kênh" (`product`, `channel`) dạng lookup có
  quản trị riêng — vẫn là text tự do.
- Không làm real-time qua WebSocket — dùng polling nhẹ như
  `sticky-board.tsx` đã có tiền lệ trong repo.
- Không thêm thư viện chart ngoài — tự vẽ bằng CSS/SVG như
  `report-dashboard.tsx` đã làm.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Schema, migration, seed](./phase-01-start.md) | Done |
| 2 | [Phase 2: Data access layer teams va tasks](./phase-02-data-access-layer-teams-va-tasks.md) | Done |
| 3 | [Phase 3: Server actions](./phase-03-server-actions.md) | Done |
| 4 | [Phase 4: UI trang Giao Task](./phase-04-ui-trang-giao-task.md) | Code done, live verification pending |
| 5 | [Phase 5: Nav va quyen hien thi](./phase-05-nav-va-quyen-hien-thi.md) | Done |
| 6 | [Phase 6: Kiem thu thu cong](./phase-06-kiem-thu-thu-cong.md) | Blocked — cần đăng nhập thật, chờ quyết định của người dùng |

## Success Criteria

- [ ] `npm run db:migrate` chạy sạch, 4 bảng mới tồn tại đúng constraint, 6
      đội + đúng quản lý (KD1 có 2 người) + thành viên khởi điểm đã seed
      khớp bảng ánh xạ ở trên.
- [ ] Đăng nhập bằng tài khoản thành viên KD3 chỉ thấy đúng bảng task của
      KD3, mặc định thấy task hôm nay, thêm/sửa/xoá/nhân bản task được.
- [ ] Đăng nhập `thanhtuyen` hoặc `myhuyen97` đều thao tác quản lý KD1 như
      nhau (thêm/gỡ thành viên, sửa nhóm task).
- [ ] Đăng nhập BGĐ (`tier = 'full'`) xem được dữ liệu gộp cả 6 đội kèm
      biểu đồ so sánh, xem chi tiết được từng đội.
- [ ] Đăng nhập một tài khoản không thuộc khối kinh doanh và không phải BGĐ
      thì không thấy mục nav "Giao Task".
- [ ] `npm run build` và `npm run lint` sạch sau khi hoàn tất.

## Risk Assessment tổng quan

- **Rủi ro cao nhất**: seed sai người/sai vai trò quản lý vào sai đội (dữ
  liệu nhân sự có thể đã đổi giữa lúc brainstorm và lúc chạy migration
  thật). Giảm thiểu: script seed đọc lại `team_label` + username trực tiếp
  từ DB tại thời điểm chạy, không hard-code id, có bước backup trước khi
  chạy (xem Phase 1).
- **Rủi ro**: nhầm "nhân bản hàng loạt" thành mô hình recurring event phức
  tạp — quyết định #7 đã chốt rõ là tạo dòng thật, Phase 2/3/4 phải bám
  đúng, không tự ý làm phức tạp hơn.
- **Next.js 16 khác Next quen thuộc** — đọc `node_modules/next/dist/docs/`
  liên quan (route/server actions/dynamic APIs) trước khi viết Phase 3, 4,
  theo đúng yêu cầu ở `AGENTS.md`.

<!-- slug: giao-task-6-doi-kinh-doanh -->
