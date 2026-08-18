'use client';

import { useMemo, useState, useTransition } from 'react';
import type { UserRow } from '@/lib/users';
import { departmentLabel } from '@/lib/roles';
import { grantPermissionAction, revokePermissionAction } from '@/app/dashboard/admin/actions';

interface DocOption {
  id: string;
  title: string;
}

export default function PermissionChecklist({
  docs,
  users,
  grantsByDoc,
}: {
  docs: DocOption[];
  users: UserRow[];
  grantsByDoc: Record<string, number[]>;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedDocId, setSelectedDocId] = useState(docs[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [granted, setGranted] = useState<Set<number>>(new Set(grantsByDoc[docs[0]?.id ?? ''] ?? []));

  function selectDoc(docId: string) {
    setSelectedDocId(docId);
    setGranted(new Set(grantsByDoc[docId] ?? []));
  }

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => u.fullName.toLowerCase().includes(term) || u.username.toLowerCase().includes(term));
  }, [users, search]);

  function toggle(userId: number, checked: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        if (checked) {
          await grantPermissionAction(userId, selectedDocId);
          setGranted((prev) => new Set(prev).add(userId));
        } else {
          await revokePermissionAction(userId, selectedDocId);
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

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm theo tên hoặc username…"
        className="max-w-md border border-[#e0e7f3] bg-[#fafbff] px-4 py-2.5 text-sm outline-none focus:border-blue"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="max-h-[560px] overflow-y-auto border border-navy/15">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead className="sticky top-0">
            <tr className="bg-navy text-cyan">
              <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide">Được đọc</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide">Họ tên</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide">Username</th>
              <th className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide">Khối</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} className="odd:bg-white even:bg-surface-2/60">
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
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
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
