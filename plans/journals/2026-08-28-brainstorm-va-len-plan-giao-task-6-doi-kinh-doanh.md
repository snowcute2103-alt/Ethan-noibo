---
title: Brainstorm va len plan Giao Task 6 doi kinh doanh
date: 2026-08-28
summary: "Ve luong, duyet quyet dinh voi user qua artifact + AskUserQuestion, len plan 6 phase, chua dung vao code that."
---

# Brainstorm va len plan Giao Task 6 doi kinh doanh

## What happened

User muon tao trang "Giao Task" (task assignment board) dung chung cho 6 doi
kinh doanh, moi doi co 1 quan ly tu them/go thanh vien, ca doi cung sua 1
bang task, luu database. Truoc khi code, doc lai bang `users` that trong Neon
DB (qua 1 script tsx tam, da xoa ngay sau khi dung) va phat hien khoi
kinh-doanh da co san 6 nhom `team_label` KD1..KD6, khop gan het voi 6 ten
quan ly nguoi dung neu:

- KD1 = Tuyen (thanhtuyen, id 9, tier leader)
- KD2 = Thu (anhthu2001, id 23, tier leader)
- KD3 = Duyen (myduyen, id 16, tier leader)
- KD4 = Thao (thaovu1221, id 24, tier staff)
- KD5 = Tien (ductien97, id 31, tier staff)
- KD6 = Han (baohan201, id 25, tier staff)

Diem bat ngo: cac ten trong anh mau Notion nguoi dung gui (Phuc, Dat, Trinh,
Hien) deu la thanh vien that cua KD3 (doi Duyen) - anh mau nhieu kha nang
chinh la bang Notion doi nay dang dung that. Rieng KD1 co 2 nguoi tier leader
(Tuyen va Le Thi My Huyen) - de xuat chi Tuyen giu vai tro quan ly tinh nang
nay, Huyen van la thanh vien binh thuong.

Da dung 1 Artifact (HTML tu viet, publish qua Claude Artifact) ve day du:
so do vai tro/luong nghiep vu (SVG tu tay, ranh gioi 6 doi tach biet + BGD
xem gop), ERD 3 bang moi (teams/team_members/tasks), ma tran phan quyen,
wireframe trang. Dung AskUserQuestion hoi 4 diem quyet dinh, user chon dung
4/4 phuong an khuyen nghi:
1. Giu nguyen anh xa 6 quan ly nhu tren.
2. Bang task "mo hoan toan" - ai trong doi cung sua/xoa duoc moi task.
3. Mot nguoi chi thuoc dung 1 doi (khong multi-team).
4. Vai tro "quan ly doi task" tach rieng khoi `tier` ho so nhan su hien co
   (khong nang bac Thao/Tien/Han).

Sau khi chot, dung `ak plan create` + `ak plan add-phase` (x5) dung plan tai
`plans/260828-1012-giao-task-6-doi-kinh-doanh/`, viet day du plan.md + 6
phase file (schema/migration/seed voi seed script idempotent doc lai DB
thay vi hard-code id; data access layer lib/teams.ts + lib/tasks.ts theo
mau lib/users.ts; server actions theo mau app/dashboard/actions.ts, teamId
luon tu suy tu session khong nhan tu client; UI route + component TaskBoard
theo mau report-dashboard.tsx/sticky-board.tsx cho bar chart tu ve va
polling; nav dieu kien theo department/tier; kiem thu tay 8 buoc). `ak plan
validate` bao OK, da `ak plan use` set active plan cho worktree.

## Decision

O buoc Post-Plan Handoff, user chon "Dung o day" - chua chay `/ak:plan
validate` (phong van phan bien), chua red-team, chua `/ak:cook`. Plan giu
nguyen trang thai pending de user tu xem lai truoc.

## Next steps

- Cho user quyet dinh buoc tiep theo: validate / red-team / cook thang, hoac
  sua truc tiep artifact/plan neu co diem can chinh.
- Khi bat tay code: Phase 1 (schema/migration/seed) phai backup DB truoc,
  va doi chieu lai so lieu team_label thuc te tai thoi diem chay (co the da
  lech so voi luc brainstorm 28/08/2026).
- Chua co code nao thay doi trong repo o phien nay, chi co plan + artifact.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
