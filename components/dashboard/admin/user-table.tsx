'use client';

import { Fragment, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { UserRow } from '@/lib/users';
import { DEPARTMENTS, departmentLabel, tierLabel } from '@/lib/roles';
import { updateUserAction, unlockUserAction } from '@/app/dashboard/admin/actions';

function formatDate(value: string | null): string {
  if (!value) return '—';
  const [y, m, d] = value.split('-');
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

const DETAIL_FIELDS: Array<{ label: string; get: (u: UserRow) => string }> = [
  { label: 'Mã nhân viên', get: (u) => u.employeeCode ?? '—' },
  { label: 'Chức danh', get: (u) => u.jobTitle ?? '—' },
  { label: 'Vị trí công việc', get: (u) => u.positionTitle ?? '—' },
  { label: 'Team', get: (u) => u.teamLabel ?? '—' },
  { label: 'Giới tính', get: (u) => u.gender ?? '—' },
  { label: 'Ngày sinh', get: (u) => formatDate(u.birthDate) },
  { label: 'Ngày vào làm', get: (u) => formatDate(u.startDate) },
  { label: 'Văn phòng', get: (u) => u.office ?? '—' },
  { label: 'Lịch làm việc', get: (u) => u.workSchedule ?? '—' },
  { label: 'Email cá nhân', get: (u) => u.personalEmail ?? '—' },
  { label: 'Điện thoại', get: (u) => u.phone ?? '—' },
];

export default function UserTable({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch = !term || u.fullName.toLowerCase().includes(term) || u.username.toLowerCase().includes(term);
      const matchesDept = !departmentFilter || u.department === departmentFilter;
      return matchesSearch && matchesDept;
    });
  }, [users, search, departmentFilter]);

  function handleToggleActive(user: UserRow) {
    setError(null);
    startTransition(async () => {
      try {
        await updateUserAction(user.id, { isActive: !user.isActive });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  function handleUnlock(username: string) {
    setError(null);
    startTransition(async () => {
      try {
        await unlockUserAction(username);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc username…"
            className="border border-[#e0e7f3] bg-[#fafbff] px-4 py-2.5 text-sm outline-none focus:border-blue"
          />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="border border-[#e0e7f3] bg-[#fafbff] px-4 py-2.5 text-sm outline-none focus:border-blue"
          >
            <option value="">Tất cả khối</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <Link
          href="/dashboard/admin/users/new"
          className="bg-navy px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-gold hover:text-navy"
        >
          + Tạo user
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto border border-navy/15">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-navy text-cyan">
              <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide"></th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide">Họ tên</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide">Username</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide">Khối</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide">Cấp</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide">Trạng thái</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const isExpanded = expandedId === u.id;
              return (
                <Fragment key={u.id}>
                  <tr className="odd:bg-white even:bg-surface-2/60">
                    <td className="border-b border-navy/10 px-2 py-3">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : u.id)}
                        aria-label={isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                        className="flex h-6 w-6 items-center justify-center text-base font-bold text-navy transition hover:text-blue"
                      >
                        {isExpanded ? '▾' : '▸'}
                      </button>
                    </td>
                    <td className="border-b border-navy/10 px-4 py-3">
                      {u.avatarUrl ? (
                        <Image
                          src={u.avatarUrl}
                          alt={u.fullName}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-surface-2" />
                      )}
                    </td>
                    <td className="border-b border-navy/10 px-4 py-3 text-ink">{u.fullName}</td>
                    <td className="border-b border-navy/10 px-4 py-3 text-ink">{u.username}</td>
                    <td className="border-b border-navy/10 px-4 py-3 text-ink">{departmentLabel(u.department)}</td>
                    <td className="border-b border-navy/10 px-4 py-3 text-ink">{tierLabel(u.tier)}</td>
                    <td className="border-b border-navy/10 px-4 py-3">
                      <span className={u.isActive ? 'text-blue' : 'text-muted'}>
                        {u.isActive ? 'Hoạt động' : 'Đã vô hiệu hoá'}
                      </span>
                    </td>
                    <td className="border-b border-navy/10 px-4 py-3">
                      <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide">
                        <Link href={`/dashboard/admin/users/${u.id}`} className="text-blue hover:underline">
                          Sửa
                        </Link>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleToggleActive(u)}
                          className="text-red-600 hover:underline disabled:opacity-50"
                        >
                          {u.isActive ? 'Vô hiệu hoá' : 'Kích hoạt lại'}
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleUnlock(u.username)}
                          className="text-muted hover:underline disabled:opacity-50"
                        >
                          Mở khoá
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-navy/5">
                      <td colSpan={8} className="border-b border-navy/10 px-6 py-4">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                          {DETAIL_FIELDS.map((field) => (
                            <div key={field.label} className="flex flex-col gap-0.5">
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                                {field.label}
                              </span>
                              <span className="text-sm text-ink">{field.get(u)}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
                  Không tìm thấy user nào khớp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
