---
title: Gioi han trang Bao cao cho Nguyet va Duy
date: 2026-09-02
summary: An menu va chan truy cap truc tiep trang Bao cao cho moi tai khoan ngoai hai user da duoc chi dinh.
---

# Gioi han trang Bao cao cho Nguyet va Duy

## What happened

Trang `/dashboard/bao-cao` truoc day nam trong `NAV_ITEMS` tinh va chi kiem tra co session, nen moi tai khoan dang nhap deu thay menu va mo duoc URL truc tiep.

Da them `lib/report-access.ts`, dua muc Bao cao ra khoi menu tinh, chi chen lai trong dashboard layout cho hai user duoc phep, va them guard tai Server Component cua route de redirect tai khoan khong duoc phep ve `/dashboard` truoc khi render du lieu.

## Decision

Quyen bam theo hai `user_id` bat bien da doi chieu trong database thay vi username hoac ma nhan vien co the duoc nhap bien the. Hai lop duoc giu tach bach: loc navigation cho UX, guard tai page la bien phap bao mat that.

## Verification

- Focused access test: 1 passed, 0 failed.
- `npx tsc --noEmit --incremental false`: passed.
- `npm run build -- --webpack`: passed.
- `git diff --check`: passed.
- Independent tester and code review: no remaining findings.

## Next steps

Thay doi moi o local worktree; can commit/deploy rieng khi duoc phep. Khong can cap nhat docs evergreen vi khong co tai lieu hien tai cong bo quyen trang Bao cao.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
