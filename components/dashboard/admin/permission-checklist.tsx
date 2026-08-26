'use client';

import { useMemo, useState, useTransition } from 'react';
import type { UserRow } from '@/lib/users';
import { DEPARTMENTS, departmentLabel, tierLabel, type Tier } from '@/lib/roles';

const TIERS: Tier[] = ['staff', 'leader', 'full'];

interface DocOption {
  id: string;
  title: string;
}

export interface PermissionActions {
  grant: (userId: number, docId: string) => Promise<{ ok: true }>;
  revoke: (userId: number, docId: string) => Promise<{ ok: true }>;
  bulkGrant: (userIds: number[], docId: string) => Promise<{ ok: true }>;
  bulkRevoke: (userIds: number[], docId: string) => Promise<{ ok: true }>;
}

export default function PermissionChecklist({
  docs,
  users,
  grantsByDoc,
  actions,
}: {
  docs: DocOption[];
  users: UserRow[];
  grantsByDoc: Record<string, number[]>;
  actions: PermissionActions;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedDocId, setSelectedDocId] = useState(docs[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [granted, setGranted] = useState<Set<number>>(new Set(grantsByDoc[docs[0]?.id ?? ''] ?? []));
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  function selectDoc(docId: string) {
    setSelectedDocId(docId);
    setGranted(new Set(grantsByDoc[docId] ?? []));
  }

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch = !term || u.fullName.toLowerCase().includes(term) || u.username.toLowerCase().includes(term);
      const matchesDept = !departmentFilter || u.department === departmentFilter;
      const matchesTier = !tierFilter || u.tier === tierFilter;
      return matchesSearch && matchesDept && matchesTier;
    });
  }, [users, search, departmentFilter, tierFilter]);

  const filteredIds = useMemo(() => filteredUsers.map((u) => u.id), [filteredUsers]);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someFilteredSelected = filteredIds.some((id) => selectedIds.has(id));

  function toggleSelectOne(userId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleBulkGrant() {
    setError(null);
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      try {
        await actions.bulkGrant(ids, selectedDocId);
        setGranted((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.add(id));
          return next;
        });
        clearSelection();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  function handleBulkRevoke() {
    setError(null);
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      try {
        await actions.bulkRevoke(ids, selectedDocId);
        setGranted((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
        clearSelection();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  function toggle(userId: number, checked: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        if (checked) {
          await actions.grant(userId, selectedDocId);
          setGranted((prev) => new Set(prev).add(userId));
        } else {
          await actions.revoke(userId, selectedDocId);
          setGranted((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  if (docs.length === 0) {
    return <p className="text-muted">Chưa có tài liệu rule nào trong hệ thống.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-ink">Tài liệu</label>
        <select
          value={selectedDocId}
          onChange={(e) => selectDoc(e.target.value)}
          className="max-w-md border border-[#e0e7f3] bg-[#fafbff] px-4 py-3 text-sm outline-none focus:border-blue"
        >
          {docs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc username…"
          className="max-w-md border border-[#e0e7f3] bg-[#fafbff] px-4 py-2.5 text-sm outline-none focus:border-blue"
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
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="border border-[#e0e7f3] bg-[#fafbff] px-4 py-2.5 text-sm outline-none focus:border-blue"
        >
          <option value="">Tất cả cấp</option>
          {TIERS.map((t) => (
            <option key={t} value={t}>
              {tierLabel(t)}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-4 border-2 border-gold/60 bg-[#fffaf0] px-5 py-3">
          <span className="text-sm font-semibold text-navy">Đã chọn {selectedIds.size} user</span>
          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide">
            <button
              type="button"
              disabled={isPending}
              onClick={handleBulkGrant}
              className="text-blue hover:underline disabled:opacity-50"
            >
              Cấp quyền đọc
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleBulkRevoke}
              className="text-red-600 hover:underline disabled:opacity-50"
            >
              Thu hồi quyền đọc
            </button>
            <button type="button" onClick={clearSelection} className="text-ink hover:underline">
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      <div className="max-h-[560px] overflow-auto border border-navy/15">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="sticky top-0">
            <tr className="bg-navy text-cyan">
              <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !allFilteredSelected && someFilteredSelected;
                  }}
                  onChange={toggleSelectAllFiltered}
                  aria-label="Chọn tất cả user đang lọc"
                  className="h-4 w-4 accent-gold"
                />
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide">Được đọc</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide">Họ tên</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide">Username</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide">Khối</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide">Cấp</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} className="odd:bg-white even:bg-surface-2/60">
                <td className="border-b border-navy/10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(u.id)}
                    onChange={() => toggleSelectOne(u.id)}
                    aria-label={`Chọn ${u.fullName}`}
                    className="h-4 w-4 accent-gold"
                  />
                </td>
                <td className="border-b border-navy/10 px-4 py-3">
                  <input
                    type="checkbox"
                    disabled={isPending}
                    checked={granted.has(u.id)}
                    onChange={(e) => toggle(u.id, e.target.checked)}
                  />
                </td>
                <td className="border-b border-navy/10 px-4 py-3 text-ink">{u.fullName}</td>
                <td className="border-b border-navy/10 px-4 py-3 text-ink">{u.username}</td>
                <td className="border-b border-navy/10 px-4 py-3 text-ink">{departmentLabel(u.department)}</td>
                <td className="border-b border-navy/10 px-4 py-3 text-ink">{tierLabel(u.tier)}</td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
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
