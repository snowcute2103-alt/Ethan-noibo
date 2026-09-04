'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import type { Announcement } from '@/lib/content/announcements';
import type { UserRow } from '@/lib/users';
import { DEPARTMENTS, type Department, type Tier } from '@/lib/roles';
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
  grantAnnouncementPermissionAction,
  revokeAnnouncementPermissionAction,
  bulkGrantAnnouncementPermissionAction,
  bulkRevokeAnnouncementPermissionAction,
} from '@/app/dashboard/admin/content-actions';
import PermissionChecklist from '@/components/dashboard/admin/permission-checklist';

const inputClass = 'w-full border border-[var(--theme-border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-blue';
const labelClass = 'text-xs font-semibold uppercase tracking-wide text-muted';
const primaryBtn =
  'bg-navy px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-gold hover:text-navy disabled:cursor-not-allowed disabled:opacity-60';
const outlineBtn =
  'border border-navy px-6 py-3 text-sm font-semibold uppercase tracking-wide text-navy transition hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-60';

function todayLabel(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${now.getFullYear()}`;
}

interface FormState {
  title: string;
  body: string;
  date: string;
  allDepartments: boolean;
  departments: Department[];
  minTier: Tier | '';
}

function blankForm(): FormState {
  return { title: '', body: '', date: todayLabel(), allDepartments: true, departments: [], minTier: '' };
}

export interface StaticAnnouncementRef {
  id: string;
  kind: string;
  title: string;
  date: string;
  preview: string;
}

function toFormState(a: Announcement): FormState {
  return {
    title: a.title,
    body: a.body,
    date: a.date,
    allDepartments: a.visibility.departments === 'all',
    departments: a.visibility.departments === 'all' ? [] : a.visibility.departments,
    minTier: a.visibility.minTier ?? '',
  };
}

export default function AnnouncementManager({
  announcements,
  users,
  grantsByAnnouncement,
  staticItems,
}: {
  announcements: Announcement[];
  users: UserRow[];
  grantsByAnnouncement: Record<string, number[]>;
  staticItems: StaticAnnouncementRef[];
}) {
  const [items, setItems] = useState(announcements);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedStatic, setSelectedStatic] = useState<StaticAnnouncementRef | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const term = search.trim().toLowerCase();
  const filtered = items.filter((a) => a.title.toLowerCase().includes(term));
  const filteredStatic = staticItems.filter((s) => s.title.toLowerCase().includes(term));
  const editingExisting = selectedId !== null;

  function select(id: string) {
    const a = items.find((x) => x.id === id);
    if (!a) return;
    setSelectedStatic(null);
    setSelectedId(id);
    setForm(toFormState(a));
    setError(null);
  }

  function selectStatic(item: StaticAnnouncementRef) {
    setSelectedId(null);
    setSelectedStatic(item);
    setError(null);
  }

  function startNew() {
    setSelectedId(null);
    setSelectedStatic(null);
    setForm(blankForm());
    setError(null);
  }

  function toggleDepartment(dept: Department) {
    setForm((prev) => ({
      ...prev,
      departments: prev.departments.includes(dept) ? prev.departments.filter((d) => d !== dept) : [...prev.departments, dept],
    }));
  }

  function handleSave() {
    setError(null);
    if (!form.title.trim() || !form.body.trim()) {
      setError('Cần nhập tiêu đề và nội dung.');
      return;
    }
    if (!form.allDepartments && form.departments.length === 0) {
      setError('Chọn ít nhất 1 khối, hoặc chọn "Toàn công ty".');
      return;
    }
    const input = {
      title: form.title.trim(),
      body: form.body.trim(),
      date: form.date.trim() || todayLabel(),
      departments: form.allDepartments ? ('all' as const) : form.departments,
      minTier: form.minTier || undefined,
    };

    startTransition(async () => {
      try {
        if (editingExisting && selectedId) {
          const updated = await updateAnnouncementAction(Number(selectedId), input);
          setItems((prev) => prev.map((a) => (a.id === selectedId ? updated : a)));
          setForm(toFormState(updated));
        } else {
          const created = await createAnnouncementAction(input);
          setItems((prev) => [...prev, created]);
          setSelectedId(created.id);
          setForm(toFormState(created));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  function handleDelete() {
    if (!selectedId) return;
    if (!confirm(`Xoá thông báo "${form.title}"? Không thể hoàn tác.`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteAnnouncementAction(Number(selectedId));
        setItems((prev) => prev.filter((a) => a.id !== selectedId));
        startNew();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  const announcementActions = {
    grant: grantAnnouncementPermissionAction,
    revoke: revokeAnnouncementPermissionAction,
    bulkGrant: bulkGrantAnnouncementPermissionAction,
    bulkRevoke: bulkRevokeAnnouncementPermissionAction,
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
      <div className="flex flex-col gap-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm thông báo…" className={inputClass} />
        <button type="button" onClick={startNew} className={`${primaryBtn} flex items-center justify-center gap-2`}>
          <Plus size={16} /> Thông báo mới
        </button>
        <div className="flex max-h-[640px] flex-col gap-2 overflow-y-auto">
          {filteredStatic.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectStatic(s)}
              className={`border px-4 py-3 text-left transition ${
                selectedStatic?.id === s.id ? 'border-blue-cta bg-blue-cta/5' : 'border-navy/15 hover:border-blue-cta/40'
              }`}
            >
              <p className="text-sm font-semibold text-navy">{s.title}</p>
              <p className="mt-1 line-clamp-1 text-xs text-muted">{s.preview}</p>
              <p className="mt-1 text-xs text-muted">
                {s.date} <span className="ml-2 font-semibold uppercase text-gold-2">· Hệ thống ({s.kind})</span>
              </p>
            </button>
          ))}
          {filtered.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => select(a.id)}
              className={`border px-4 py-3 text-left transition ${
                selectedId === a.id ? 'border-blue-cta bg-blue-cta/5' : 'border-navy/15 hover:border-blue-cta/40'
              }`}
            >
              <p className="text-sm font-semibold text-navy">{a.title}</p>
              <p className="mt-1 line-clamp-1 text-xs text-muted">{a.body}</p>
              <p className="mt-1 text-xs text-muted">{a.date}</p>
            </button>
          ))}
          {filtered.length === 0 && filteredStatic.length === 0 && <p className="text-sm text-muted">Không có thông báo nào.</p>}
        </div>
      </div>

      {selectedStatic ? (
        <div className="flex flex-col gap-6 border border-navy/15 p-6 sm:p-8">
          <p className="theme-light-surface border border-gold-2/50 bg-[#FFF4D6] px-4 py-3 text-sm text-navy">
            Mục này ({selectedStatic.kind}) có sẵn trong code hệ thống — chỉ xem, không sửa/xoá được ở đây.
          </p>
          <div>
            <p className={labelClass}>Tiêu đề</p>
            <p className="mt-1 text-lg font-semibold text-navy">{selectedStatic.title}</p>
          </div>
          <div>
            <p className={labelClass}>Ngày</p>
            <p className="mt-1 text-sm text-ink">{selectedStatic.date}</p>
          </div>
          <div>
            <p className={labelClass}>Nội dung</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">{selectedStatic.preview}</p>
          </div>
        </div>
      ) : (
      <div className="flex flex-col gap-6 border border-navy/15 p-6 sm:p-8">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Tiêu đề *</label>
          <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Ngày</label>
          <input value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className={`${inputClass} max-w-xs`} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Nội dung *</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
            rows={6}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-navy/10 pt-4">
          <p className={labelClass}>Ai xem được</p>
          <label className="flex w-fit items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.allDepartments}
              onChange={(e) => setForm((p) => ({ ...p, allDepartments: e.target.checked }))}
              className="h-4 w-4 accent-gold"
            />
            Toàn công ty
          </label>
          {!form.allDepartments && (
            <div className="flex flex-wrap gap-4 pl-6">
              {DEPARTMENTS.filter((d) => d.id !== 'bgd').map((d) => (
                <label key={d.id} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={form.departments.includes(d.id)}
                    onChange={() => toggleDepartment(d.id)}
                    className="h-4 w-4 accent-gold"
                  />
                  {d.label}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 border-t border-navy/10 pt-6">
          <button type="button" onClick={handleSave} disabled={isPending} className={primaryBtn}>
            {editingExisting ? 'Lưu thay đổi' : 'Tạo thông báo'}
          </button>
          {editingExisting && (
            <button type="button" onClick={handleDelete} disabled={isPending} className={outlineBtn}>
              Xoá thông báo
            </button>
          )}
        </div>

        {editingExisting && selectedId && (
          <div className="border-t border-navy/10 pt-6">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-navy">
              Cấp thêm quyền xem cho từng người (ngoài khối đã chọn ở trên)
            </p>
            <PermissionChecklist
              key={selectedId}
              docs={[{ id: selectedId, title: form.title }]}
              users={users}
              grantsByDoc={{ [selectedId]: grantsByAnnouncement[selectedId] ?? [] }}
              actions={announcementActions}
            />
          </div>
        )}
      </div>
      )}
    </div>
  );
}
