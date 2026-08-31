---
title: Trien khai Phase 1-5 Giao Task 6 doi kinh doanh
date: 2026-08-28
summary: "Migrate + seed DB that, viet data access/server actions/UI, phat hien va fix 1 bug server-only/client bundle that nguoi dung tim ra."
---

# Trien khai Phase 1-5 Giao Task 6 doi kinh doanh

## What happened

Tiep noi tu brainstorm + plan (xem journal truoc
"2026-08-28-brainstorm-va-len-plan-giao-task-6-doi-kinh-doanh"), da trien
khai 5/6 phase cua plan `plans/260828-1012-giao-task-6-doi-kinh-doanh/`
theo `/ak:cook`:

- Phase 1 (schema/migration/seed): backup 11 bang that (luu local, khong
  commit) truoc khi doi schema. Them 4 bang `teams`, `team_members`,
  `team_task_categories`, `tasks` vao `db/schema.sql`, chay
  `npm run db:migrate` that tren Neon production. Viet
  `scripts/seed-giao-task-teams.ts` (idempotent), chay seed that: 6 doi,
  7 quan ly (KD1 co 2: thanhtuyen + myhuyen97), 31 thanh vien - khop dung
  so lieu da chot o brainstorm.
- Phase 2: `lib/teams.ts` + `lib/tasks.ts` (data access layer), verify
  bang script tsx tam (roster, bulk duplicate date math, aggregate query)
  - da xoa script sau khi test.
- Phase 3: `app/dashboard/giao-task/actions.ts` (14 server actions), mo
  rong `AuditAction` union trong `lib/audit.ts` + fix 1 map
  `Record<AuditAction,string>` bi thieu key o `user-table.tsx` (TS bao
  loi ngay, khong phai bug an).
- Phase 4: `app/dashboard/giao-task/page.tsx` + component lon
  `components/dashboard/task-board.tsx` (dieu huong ngay/tuan/thang, tab
  nhom tu dat + chon cot hien thi, nhan ban 1/hang loat, roster, tien do
  thang, bieu do). `npx tsc --noEmit` sach toan repo sau moi buoc.
- Phase 5: sua `app/dashboard/layout.tsx` them nav "Giao Task" co dieu
  kien (department kinh-doanh hoac tier full).

Hai gioi han moi truong gap phai (khong lien quan code):
- `npm run lint` hong san co - Next.js 16.3.1 da bo hoan toan lenh
  `next lint` khoi CLI (xac nhan qua `npx next --help`), khong phai loi
  do code moi.
- `npm run build` bi 1 hook cuc bo (`.ckignore` pattern "build") chan,
  khong chay duoc de kiem tra production build.
- Hook `scout-block.cjs` cung chan doc `node_modules` (ca qua Read lan
  Bash) - khong lam duoc buoc "doc docs Next 16 truoc khi code" ma
  AGENTS.md yeu cau, phai suy luan tu hanh vi CLI thuc te thay the.

Khong dang nhap duoc de tu tay test UI that (khong co mat khau tai khoan
that nao, doi mat khau tai khoan test bi auto-mode classifier chan dung -
day la hanh dong doi thong tin xac thuc tren DB that). Nguoi dung chon tu
test bang tai khoan that cua ho. Truoc khi giao lai, da tu dung 1 route
tam `app/giao-task-test-render/page.tsx` (ngoai `app/dashboard`, khong bi
layout chan session) render thang `<TaskBoard>` voi du lieu gia ca 2
nhanh (co doi / view gop BGD) de bat loi build/runtime ma khong can dang
nhap - nho vay tu bat duoc gan het van de, nhung nguoi dung van la nguoi
bat duoc bug that dau tien khi mo trang that.

## Decision

Bug that nguoi dung phat hien: `TASK_COLUMN_KEYS` la hang so (khong phai
type) tung nam trong `lib/tasks.ts` (co `import 'server-only'`).
`task-board.tsx` ('use client') import no theo gia tri (khong phai
`import type`) nen Turbopack keo ca module vao client bundle, bi chan boi
guard cua `server-only` ("You're importing a module that depends on
server-only..."). Fix: tach hang so nay ra `lib/task-columns.ts` rieng
(khong co `server-only`), `lib/tasks.ts` re-export lai de cho khac khong
phai doi import. Da verify lai qua route test tam: ca 2 nhanh render sach,
khong con "Build Error" trong HTML, dung noi dung tinh mong doi.

Bai hoc ghi vao Risk Assessment cua phase-04: hang so/type dung chung ca
client va server-only lib phai nam o file KHONG co `server-only` ngay tu
dau thiet ke, khong dat chung voi cac ham truy van DB roi moi tach sau.

## Next steps

- Nguoi dung tu test lai UI that (da sua bug) bang tai khoan that
  (thanhtuyen/myhuyen97 cho KD1, duynguyen/minhnguyet cho view BGD), theo
  checklist o `phase-06-kiem-thu-thu-cong.md`.
- Chua commit gi ca - dang cho quyet dinh cua nguoi dung o cuoi phien nay.
- Neu can tra cuu Next.js 16 docs that trong tuong lai, nen xin nguoi dung
  go tam chan `node_modules` trong `.ckignore` thay vi tiep tuc suy doan
  tu hanh vi CLI.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
