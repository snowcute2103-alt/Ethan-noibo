---
phase: 4
title: "UI trang Giao Task cho nguoi ngoai 6 doi"
status: pending
priority: P1
effort: "6h"
dependencies: [3]
---

# Phase 4: UI trang Giao Task cho người ngoài 6 đội

## Overview

Thêm 2 component client mới (`PersonalTaskBoard` — Kanban cá nhân,
`DepartmentOverview` — danh sách người ngoài 6 đội gom theo bộ phận) và nối
vào `app/dashboard/giao-task/page.tsx` + `TaskBoard` hiện có, mở nav "Giao
Task" cho toàn bộ nhân viên (hiện đang gate theo `department`/`tier`, chặn
đúng nhóm người plan này nhắm tới).

Kiến trúc điều hướng cho BGĐ đã qua 2 lần chỉnh:

1. Sau red-team: bỏ ý tưởng 1 shell client bọc ngoài unmount/remount
   `TaskBoard` (thiết kế đó làm mất toàn bộ state đội KD đang xem mỗi lần
   BGĐ mở màn bộ phận — tự mâu thuẫn với tiêu chí "không mất state" ở
   Phase 5).
2. Sau phản hồi trực tiếp của người dùng khi xem UI thật ("Hiển thị cả 6 đội
   kinh doanh và các đội khác trên 1 trang này thôi"): bỏ luôn phương án
   "chọn dropdown mới thấy Bộ phận khác" — `DepartmentOverview` giờ LUÔN hiện
   sẵn ngay dưới bảng 6 đội KD trên cùng trang Tổng quan (`!board &&
   overview`), không cần chọn gì thêm. Bấm 1 người trong đó mới thay hẳn nội
   dung trang bằng Kanban cá nhân của họ (qua state `personalView` mới,
   tương tự cách chọn 1 đội KD thay hẳn nội dung bằng board đội qua
   `activeTeamId`) — `activeTeamId` quay lại đúng kiểu gốc `number | null`,
   không còn giá trị đặc biệt `'departments'`.

## Requirements

- [ ] Người dùng KHÔNG phải BGĐ, không thuộc đội KD nào: vào
      `/dashboard/giao-task` → thấy thẳng `PersonalTaskBoard` của chính mình
      (không cần chọn gì) — thay cho `redirect('/dashboard')` hiện tại ở
      [page.tsx:19](../../app/dashboard/giao-task/page.tsx#L19).
- [ ] `PersonalTaskBoard`: Kanban 2 cột (Chưa làm/Hoàn thành, cùng pattern
      `TaskKanban` đã có), điều hướng ngày/tuần/tháng, card thêm nhanh, kéo-
      thả đổi trạng thái, xoá, nhân bản 1 task sang ngày khác (dùng
      `<input type="date">`, KHÔNG dùng `window.prompt()` — chuỗi tự do từ
      `prompt` không validate được ở client, lỗi Postgres thô sẽ lộ ra banner
      nếu người dùng gõ ngày sai định dạng hoặc bấm Cancel).
      **Sửa được nội dung** (title/note): các Kanban card gốc
      (`KanbanCard`/`task-board.tsx:1048`) CHỈ hỗ trợ xoá + kéo-thả đổi trạng
      thái, không có đường sửa nội dung (comment gốc ghi rõ "sửa chi tiết
      chuyển qua Bảng") — nhưng task cá nhân KHÔNG có Bảng (non-goal). Nếu
      không thêm affordance sửa, "sửa được task của chính mình" (Success
      Criteria P1 của `plan.md`) không có đường nào để đạt. Giải pháp: card
      trong `PersonalTaskBoard` cho phép click vào tiêu đề để sửa inline
      (chuyển thành `<input>`/`<textarea>`, lưu khi blur hoặc Enter, gọi
      `updatePersonalTaskAction`) — không cần modal, không cần Bảng riêng.
      Card KHÔNG hiện avatar người phụ trách (chỉ 1 chủ, không cần).
- [ ] BGĐ vào `/dashboard/giao-task`: giữ nguyên trải nghiệm hiện tại (mặc
      định "Tổng quan cả 6 đội"), khối "Bộ phận khác" LUÔN hiện thêm ngay
      dưới bảng 6 đội trên cùng màn Tổng quan — không cần chọn dropdown hay
      bất kỳ điều hướng nào khác để thấy (quyết định đổi theo phản hồi trực
      tiếp của người dùng khi xem UI thật).
- [ ] `DepartmentOverview`: liệt kê các bộ phận (nhãn từ `DEPARTMENTS` trong
      `lib/roles.ts`), mỗi bộ phận xổ ra danh sách người kèm tiến độ tháng.
      Chỉ là danh sách chọn (không tự quản lý việc hiện Kanban) — bấm vào 1
      người gọi `onSelectMember(userId, fullName)`, `TaskBoard` (component
      cha) nhận callback đó, set state `personalView` rồi thay hẳn nội dung
      trang bằng `PersonalTaskBoard` ở chế độ "BGĐ xem hộ", có nút quay lại
      (`onBack`) đưa `personalView` về `null`.
- [ ] **Nav "Giao Task" mở cho mọi nhân viên đã đăng nhập** — hiện đang gate
      theo `session.department === 'kinh-doanh' || session.tier === 'full'`
      ([layout.tsx:53-55](../../app/dashboard/layout.tsx#L53)), nghĩa là
      TOÀN BỘ đối tượng của plan này (`sx-theu`, `sx-in`, `rnd`, `it`,
      `fulfillment`) không bao giờ thấy mục menu dù route/action đã cho phép
      họ vào. Bỏ điều kiện, đưa `{ href: '/dashboard/giao-task', label: 'Giao
      Task' }` vào `navItems` không điều kiện (comment hiện tại ở
      [layout.tsx:46-50](../../app/dashboard/layout.tsx#L46) đã ghi rõ "route/
      action vẫn tự chặn ở tầng server ... ẩn nav chỉ là UX" — route đã an
      toàn, chỉ cần mở nav).
- [ ] Mọi lời gọi action từ UI dùng đúng action đã tạo ở Phase 3 — không gọi
      thẳng data access layer từ client.

## Architecture

### `PersonalTaskBoard` — file mới, không import nội bộ từ `task-board.tsx`

`task-board.tsx` gắn chặt khái niệm đội (`TeamWithRoster`, `categories`,
`isManager`, roster card...) và `TaskKanban`/`KanbanCard`/`KanbanQuickAdd`
không export, nhận `assignableMembers: TeamMember[]` — khái niệm không tồn
tại ở task cá nhân. `components/dashboard/personal-task-board.tsx` (mới) là
~200 dòng UI độc lập: copy pattern trực quan (class Tailwind, DnD, quick-add)
từ `TaskKanban`/`KanbanCard` nhưng KHÔNG có `assignableMembers`/avatar, CÓ
thêm inline-edit tiêu đề (phần `KanbanCard` gốc không có). State ngày/tuần/
tháng tự quản lý (copy `rangeFor`/`shiftAnchor`/`formatVi` — hàm thuần, không
phụ thuộc React).

```tsx
interface PersonalTaskBoardProps {
  today: string;
  ownerUserId: number;
  viewerIsBgd: boolean; // true khi BGĐ xem hộ — đổi action gọi + hiện nút quay lại
  onBack?: () => void;  // chỉ có khi viewerIsBgd
}
```

### Nối vào `page.tsx` (server component)

```tsx
// app/dashboard/giao-task/page.tsx
const isBgd = session.tier === 'full';
const teamId = await findTeamIdByUserId(session.userId);

if (!teamId) {
  if (isBgd) {
    // giữ nguyên nhánh hiện có (Tổng quan 6 đội) — KHÔNG đổi
    const [teams, monthProgress] = await Promise.all([listAllTeamsSummary(), getAllTeamsMonthProgress(yearMonth, today)]);
    return <TaskBoard isBgd today={today} overview={{ teams, monthProgress }} board={null} />;
  }
  // MỚI: thay redirect('/dashboard') — user ngoài 6 đội, không phải BGĐ
  return <PersonalTaskBoard today={today} ownerUserId={session.userId} viewerIsBgd={false} />;
}
// ... nhánh có teamId: TaskBoard vẫn nhận isBgd như cũ (BGĐ có thể đang là thành viên
// 1 đội qua addTeamMemberAsAdminAction — nhánh này PHẢI render TaskBoard y hệt hiện
// tại, KHÔNG bỏ sót "Bộ phận khác" cho trường hợp này, xem dưới)
```

`PersonalTaskBoard` tự gọi `getMyPersonalBoardAction`/`getPersonalBoardAsBgdAction`
qua `useEffect` khi mount (giống pattern `refreshBoard` của `TaskBoard`) —
không cần `page.tsx` fetch trước và truyền `initialTasks`, đơn giản hơn và
tránh 2 điểm khởi tạo props không nhất quán như thiết kế cũ.

### "Bộ phận khác" — luôn hiện trên trang Tổng quan, không qua dropdown

`TaskBoard` giữ nguyên `activeTeamId: number | null` gốc (không thêm giá trị
đặc biệt nào — bản trước có `'departments'`, đã bỏ sau phản hồi người dùng).
Thêm 1 state mới `personalView: { userId: number; fullName: string } | null`.

Đặt 1 early return NGAY SAU khi mọi hook đã khai báo, TRƯỚC `return (...)`
chính (an toàn cho Rules of Hooks vì hook order không đổi giữa các lần
render):

```tsx
if (personalView) {
  return (
    <PersonalTaskBoard
      today={today}
      ownerUserId={personalView.userId}
      viewerIsBgd
      ownerName={personalView.fullName}
      onBack={() => setPersonalView(null)}
    />
  );
}
```

Nơi hiện có `{!board && overview && <OverviewPanel .../>}`, thêm
`DepartmentOverview` ngay sau, LUÔN hiện cùng lúc (không có điều kiện chọn
nào khác):

```tsx
{!board && overview && (
  <>
    <OverviewPanel overview={overview} onSelectTeam={setActiveTeamId} monthLabel={anchorDate.slice(0, 7)} />
    <DepartmentOverview today={today} onSelectMember={(userId, fullName) => setPersonalView({ userId, fullName })} />
  </>
)}
```

**[CẬP NHẬT 2026-08-29, sau 1 vòng phản hồi UI thêm]**: `<select>` dropdown
("Tổng quan cả 6 đội" / từng đội) đã bị XOÁ HẲN — người dùng báo "Không cần
Dropdown nữa" vì bảng 6 đội (`OverviewPanel`) đã có link "Xem chi tiết" mỗi
dòng gọi thẳng `onSelectTeam(team.id)` ([task-board.tsx:746-747](../../components/dashboard/task-board.tsx#L746)),
trùng chức năng với dropdown — dropdown là UI thừa. Chọn 1 đội giờ chỉ qua
"Xem chi tiết" trong bảng; quay lại "Tổng quan 6 đội" qua nút mũi tên đã có
sẵn ở header khi đang xem 1 đội. `refreshBoard`/`useEffect` liên quan tới
`activeTeamId` giữ nguyên 100% — không đổi gì (dropdown chỉ là 1 cách khác
để gọi `setActiveTeamId`, xoá nó không ảnh hưởng state machine).

Vì `personalView` là early-return TRƯỚC toàn bộ JSX chính (không phải 1
nhánh lồng bên trong), chọn 1 người ở "Bộ phận khác" rồi bấm quay lại KHÔNG
làm mất `viewMode`/`anchorDate`/`board`/`activeTeamId` đang có — component
không unmount, state cũ nguyên vẹn khi `personalView` về `null`.

### `DepartmentOverview` — file mới, chỉ là danh sách chọn

```tsx
interface DepartmentOverviewProps {
  today: string;
  onSelectMember: (userId: number, fullName: string) => void;
}
```

Gọi `getDepartmentsOverviewAction` khi mount, render danh sách bộ phận (mỗi
bộ phận 1 khối) → người (tên + progress bar done/total). KHÔNG tự quản lý
việc hiện `PersonalTaskBoard` (khác thiết kế trước red-team lần 2) — bấm 1
người chỉ gọi `onSelectMember`, để `TaskBoard` (component cha, sở hữu
`personalView`) quyết định thay nội dung trang. Tách trách nhiệm rõ: 1 nơi
duy nhất (`TaskBoard`) sở hữu "đang xem gì" của toàn trang.

## Related Code Files

- Create: `components/dashboard/personal-task-board.tsx`
- Create: `components/dashboard/department-overview.tsx`
- Modify: `app/dashboard/giao-task/page.tsx` (nhánh `!teamId && !isBgd` render
  `PersonalTaskBoard` thay `redirect`; nhánh `!teamId && isBgd` và nhánh có
  `teamId` giữ nguyên gọi `TaskBoard` như cũ)
- Modify: `components/dashboard/task-board.tsx` (thêm state `personalView` +
  early return render `PersonalTaskBoard`; thêm `DepartmentOverview` ngay
  sau `OverviewPanel` trong nhánh `!board && overview`; XOÁ hẳn `<select>`
  dropdown chọn đội — thừa vì bảng đã có "Xem chi tiết" mỗi dòng, theo phản
  hồi trực tiếp của người dùng — KHÔNG đổi kiểu `activeTeamId`, KHÔNG đổi
  logic đội KD còn lại)
- Modify: `app/dashboard/layout.tsx` (bỏ điều kiện gate nav "Giao Task",
  dòng 53-55)

## Implementation Steps

1. Đọc lại toàn bộ `components/dashboard/task-board.tsx` phần
   `TaskKanban`/`KanbanCard`/`KanbanQuickAdd`
   ([task-board.tsx:973-1250](../../components/dashboard/task-board.tsx#L973))
   để copy đúng pattern trực quan sang `personal-task-board.tsx`.
2. Viết `components/dashboard/personal-task-board.tsx`: state
   `viewMode`/`anchorDate`, gọi `getMyPersonalBoardAction`/
   `getPersonalBoardAsBgdAction` tuỳ `viewerIsBgd`, render Kanban 2 cột với
   inline-edit tiêu đề (click → `<input>` → blur/Enter gọi
   `updatePersonalTaskAction({ title })`), kéo-thả đổi trạng thái, xoá, nút
   "Nhân bản…" mở `<input type="date">` nhỏ thay vì `prompt()`.
3. Viết `components/dashboard/department-overview.tsx` theo Architecture
   (chỉ danh sách chọn, nhận `onSelectMember` từ cha).
4. Sửa `task-board.tsx`: thêm state `personalView`, thêm early return trước
   `return (...)` chính, thêm `<DepartmentOverview>` vào nhánh `!board &&
   overview` ngay sau `OverviewPanel`, xoá hẳn `<select>` dropdown chọn đội
   (thừa, đã có "Xem chi tiết" trong bảng). Không đụng `activeTeamId`/logic
   đội KD còn lại.
5. Sửa `app/dashboard/giao-task/page.tsx`: nhánh `!teamId && !isBgd` render
   `PersonalTaskBoard` thay vì `redirect('/dashboard')`. 2 nhánh còn lại giữ
   nguyên 100%.
6. Sửa `app/dashboard/layout.tsx:53-55`: bỏ điều kiện, luôn thêm mục "Giao
   Task" vào `navItems`.
7. `tsc --noEmit` sạch (không chạy được `npm run build`/`npm run lint` trong
   môi trường này — bị hook chặn / lỗi cấu hình pre-existing không liên quan
   code, xem ghi chú ở "Code Review" trong `plan.md`), tự test bằng mắt ở
   `npm run dev` trước khi sang Phase 5.

## Success Criteria

- [ ] Tài khoản không thuộc đội KD, không phải BGĐ: thấy mục nav "Giao Task"
      (trước đây không thấy), vào `/dashboard/giao-task` thấy Kanban cá nhân
      ngay.
- [ ] Tạo/sửa tiêu đề inline/kéo-thả đổi trạng thái/xoá/nhân bản 1 task cá
      nhân hoạt động đúng, chỉ thấy task của chính mình.
- [ ] Tài khoản BGĐ: màn Tổng quan hiện SẴN cả bảng 6 đội KD lẫn khối "Bộ
      phận khác" (không cần chọn dropdown), bấm 1 người thấy đúng Kanban của
      người đó, sửa được.
- [ ] BGĐ chọn 1 đội KD, đổi sang xem Tuần, bấm 1 người ở "Bộ phận khác" (từ
      màn Tổng quan lúc chưa chọn đội), rồi bấm quay lại → không có tình
      huống mất state vì `personalView` là early-return độc lập, không đụng
      `activeTeamId`/`board` đang có.
- [ ] Trang 6 đội KD ("Xem chi tiết" chọn đội, bảng/kanban/thẻ, roster, nhân
      bản hàng loạt...) hoạt động y hệt trước khi có thay đổi này. Không còn
      dropdown chọn đội (đã xoá theo phản hồi người dùng).
- [ ] `tsc --noEmit` sạch.

## Risk Assessment

- **Rủi ro**: early-return `if (personalView) return <PersonalTaskBoard
  .../>` đặt sai vị trí (trước khi 1 hook nào đó được gọi) sẽ vi phạm Rules
  of Hooks, gây lỗi "Rendered fewer hooks than expected" khi `personalView`
  đổi qua lại.
  **Tín hiệu vỡ**: React DevTools/console báo lỗi hook order, hoặc UI vỡ khi
  bấm quay lại từ Kanban cá nhân.
  **Mitigation**: early return CHỈ đặt ngay trước `return (` chính, sau toàn
  bộ `useState`/`useEffect`/`useMemo` — đã áp dụng đúng khi implement.
- **Rủi ro**: trùng lặp code Kanban giữa `task-board.tsx` và
  `personal-task-board.tsx` (chấp nhận có chủ đích, xem lý do ở Architecture)
  có thể lệch nhau theo thời gian.
  **Mitigation**: comment ở cả 2 file trỏ chéo sang nhau, mô tả invariant chứ
  không nhắc phase/plan ID. Rủi ro thấp vì phạm vi nhỏ (đổi trạng thái/xoá/
  thêm/sửa tiêu đề).
