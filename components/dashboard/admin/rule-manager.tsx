'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import type { RuleDocument, SopSection } from '@/lib/content/sop';
import type { UserRow } from '@/lib/users';
import {
  createRuleAction,
  updateRuleAction,
  deleteRuleAction,
  extractRuleFileAction,
} from '@/app/dashboard/admin/content-actions';
import {
  grantPermissionAction,
  revokePermissionAction,
  bulkGrantPermissionAction,
  bulkRevokePermissionAction,
} from '@/app/dashboard/admin/actions';
import PermissionChecklist from '@/components/dashboard/admin/permission-checklist';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

const inputClass = 'w-full border border-[var(--theme-border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-blue';
const labelClass = 'text-xs font-semibold uppercase tracking-wide text-muted';
const smallBtn = 'text-xs font-semibold uppercase tracking-wide text-blue hover:underline';
const removeBtn = 'text-muted hover:text-red-600';

function slugify(text: string): string {
  const base = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `muc-${Date.now()}`;
}

function todayLabel(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${now.getFullYear()}`;
}

interface SectionDraft {
  key: string;
  title: string;
  paragraphs: string[];
  bullets: string[];
  hasTable: boolean;
  tableHeaders: string[];
  tableRows: string[][];
}

function blankSection(): SectionDraft {
  return { key: crypto.randomUUID(), title: '', paragraphs: [], bullets: [], hasTable: false, tableHeaders: [], tableRows: [] };
}

interface FormState {
  title: string;
  subtitle: string;
  version: string;
  effectiveDate: string;
  updatedAt: string;
  status: string;
  hasGoldenRule: boolean;
  goldenRuleTitle: string;
  goldenRulePoints: string[];
  sections: SectionDraft[];
}

function blankForm(): FormState {
  return {
    title: '',
    subtitle: '',
    version: '1.0',
    effectiveDate: '',
    updatedAt: todayLabel(),
    status: '',
    hasGoldenRule: false,
    goldenRuleTitle: '',
    goldenRulePoints: [],
    sections: [],
  };
}

function toFormState(doc: RuleDocument): FormState {
  return {
    title: doc.title,
    subtitle: doc.subtitle,
    version: doc.version,
    effectiveDate: doc.effectiveDate,
    updatedAt: doc.updatedAt,
    status: doc.status,
    hasGoldenRule: !!doc.goldenRule,
    goldenRuleTitle: doc.goldenRule?.title ?? '',
    goldenRulePoints: doc.goldenRule?.points ?? [],
    sections: doc.sections.map((s) => ({
      key: crypto.randomUUID(),
      title: s.title,
      paragraphs: s.paragraphs ?? [],
      bullets: s.bullets ?? [],
      hasTable: !!s.table,
      tableHeaders: s.table?.headers ?? [],
      tableRows: s.table?.rows ?? [],
    })),
  };
}

function toSections(sections: SectionDraft[]): SopSection[] {
  return sections
    .filter((s) => s.title.trim())
    .map((s) => ({
      id: slugify(s.title),
      title: s.title.trim(),
      paragraphs: s.paragraphs.filter((p) => p.trim()).length ? s.paragraphs.filter((p) => p.trim()) : undefined,
      bullets: s.bullets.filter((b) => b.trim()).length ? s.bullets.filter((b) => b.trim()) : undefined,
      table:
        s.hasTable && s.tableHeaders.length > 0
          ? { headers: s.tableHeaders, rows: s.tableRows.map((r) => r.map((c) => c ?? '')) }
          : undefined,
    }));
}

function StringListEditor({
  items,
  onChange,
  placeholder,
  addLabel,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder={placeholder}
            className={inputClass}
          />
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className={removeBtn} aria-label="Xoá dòng">
            <X size={16} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, ''])} className={`${smallBtn} w-fit`}>
        + {addLabel}
      </button>
    </div>
  );
}

function TableEditor({
  headers,
  rows,
  onChangeHeaders,
  onChangeRows,
}: {
  headers: string[];
  rows: string[][];
  onChangeHeaders: (next: string[]) => void;
  onChangeRows: (next: string[][]) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className={labelClass}>Cột (headers)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {headers.map((h, i) => (
            <div key={i} className="flex items-center gap-1 border border-[var(--theme-border)] bg-white px-2 py-1">
              <input
                value={h}
                onChange={(e) => {
                  const next = [...headers];
                  next[i] = e.target.value;
                  onChangeHeaders(next);
                }}
                className="w-28 bg-transparent text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  onChangeHeaders(headers.filter((_, j) => j !== i));
                  onChangeRows(rows.map((r) => r.filter((_, j) => j !== i)));
                }}
                className={removeBtn}
                aria-label="Xoá cột"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => onChangeHeaders([...headers, ''])} className={smallBtn}>
            + Cột
          </button>
        </div>
      </div>

      {headers.length > 0 && (
        <div>
          <p className={labelClass}>Dòng dữ liệu</p>
          <div className="mt-2 flex flex-col gap-2">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                {headers.map((_, j) => (
                  <input
                    key={j}
                    value={row[j] ?? ''}
                    onChange={(e) => {
                      const next = rows.map((r) => [...r]);
                      next[i][j] = e.target.value;
                      onChangeRows(next);
                    }}
                    className={inputClass}
                  />
                ))}
                <button type="button" onClick={() => onChangeRows(rows.filter((_, k) => k !== i))} className={removeBtn} aria-label="Xoá dòng">
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onChangeRows([...rows, headers.map(() => '')])}
              className={`${smallBtn} w-fit`}
            >
              + Dòng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RuleManager({
  rules,
  staticRules,
  users,
  grantsByRule,
}: {
  rules: RuleDocument[];
  staticRules: RuleDocument[];
  users: UserRow[];
  grantsByRule: Record<string, number[]>;
}) {
  const [items, setItems] = useState(rules);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isExtracting, startExtracting] = useTransition();

  const staticIds = new Set(staticRules.map((r) => r.id));
  const combined = [...staticRules, ...items];
  const filtered = combined.filter((r) => r.title.toLowerCase().includes(search.trim().toLowerCase()));
  const editingExisting = selectedId !== null;
  const isStaticSelected = selectedId !== null && staticIds.has(selectedId);

  function selectRule(id: string) {
    const doc = combined.find((r) => r.id === id);
    if (!doc) return;
    setSelectedId(id);
    setForm(toFormState(doc));
    setError(null);
  }

  function startNew() {
    setSelectedId(null);
    setForm(blankForm());
    setError(null);
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateSection(key: string, patch: Partial<SectionDraft>) {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFileError(null);
    const formData = new FormData();
    formData.set('file', file);
    startExtracting(async () => {
      try {
        const { text, fileName } = await extractRuleFileAction(formData);
        const paragraphs = text
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean);
        setForm((prev) => ({
          ...prev,
          title: prev.title || fileName,
          sections: [
            ...prev.sections,
            { key: crypto.randomUUID(), title: 'Nội dung từ file', paragraphs, bullets: [], hasTable: false, tableHeaders: [], tableRows: [] },
          ],
        }));
      } catch (e) {
        setFileError(e instanceof Error ? e.message : 'Không trích xuất được nội dung file.');
      }
    });
  }

  function handleSave() {
    setError(null);
    if (!form.title.trim()) {
      setError('Cần nhập tiêu đề.');
      return;
    }
    const sections = toSections(form.sections);
    if (sections.length === 0) {
      setError('Cần ít nhất 1 mục nội dung.');
      return;
    }
    const input = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      version: form.version.trim() || '1.0',
      effectiveDate: form.effectiveDate.trim(),
      updatedAt: form.updatedAt.trim() || todayLabel(),
      status: form.status.trim(),
      goldenRule: form.hasGoldenRule
        ? { title: form.goldenRuleTitle.trim(), points: form.goldenRulePoints.filter((p) => p.trim()) }
        : null,
      sections,
    };

    startTransition(async () => {
      try {
        if (editingExisting && selectedId) {
          const updated = await updateRuleAction(selectedId, input);
          setItems((prev) => prev.map((r) => (r.id === selectedId ? updated : r)));
          setForm(toFormState(updated));
        } else {
          const created = await createRuleAction(input);
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
    setError(null);
    startTransition(async () => {
      try {
        await deleteRuleAction(selectedId);
        setItems((prev) => prev.filter((r) => r.id !== selectedId));
        startNew();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.');
      }
    });
  }

  const ruleActions = {
    grant: grantPermissionAction,
    revoke: revokePermissionAction,
    bulkGrant: bulkGrantPermissionAction,
    bulkRevoke: bulkRevokePermissionAction,
  };

  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 min-[1025px]:grid-cols-[320px_1fr] min-[1025px]:gap-8">
      <div className="flex flex-col gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm rule…"
          className={inputClass}
        />
        <Button type="button" onClick={startNew}>
          <Plus size={16} /> Rule mới
        </Button>
        <div className="flex max-h-[320px] flex-col gap-2 overflow-y-auto min-[1025px]:max-h-[640px]">
          {filtered.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => selectRule(r.id)}
              className={`border px-4 py-3 text-left transition ${
                selectedId === r.id ? 'border-blue-cta bg-blue-cta/5' : 'border-navy/15 hover:border-blue-cta/40'
              }`}
            >
              <p className="text-sm font-semibold text-navy">{r.title}</p>
              <p className="mt-1 line-clamp-1 text-xs text-muted">{r.subtitle || '—'}</p>
              <p className="mt-1 text-xs text-muted">
                v{r.version} · {r.updatedAt}
                {staticIds.has(r.id) && <span className="ml-2 font-semibold uppercase text-gold-2">· Hệ thống</span>}
              </p>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted">Không có rule nào.</p>}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4 border border-navy/15 p-4 sm:p-5 min-[1025px]:gap-6 min-[1025px]:p-8">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {isStaticSelected && (
          <p className="theme-light-surface border border-gold-2/50 bg-[#FFF4D6] px-4 py-3 text-sm text-navy">
            Rule này có sẵn trong code hệ thống (không phải tạo qua trang này) — chỉ xem, không sửa/xoá được ở đây.
          </p>
        )}

        <fieldset disabled={isStaticSelected} className="contents">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>Tiêu đề *</label>
            <input value={form.title} onChange={(e) => updateForm('title', e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>Phụ đề</label>
            <input value={form.subtitle} onChange={(e) => updateForm('subtitle', e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Phiên bản</label>
            <input value={form.version} onChange={(e) => updateForm('version', e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Ngày cập nhật</label>
            <input value={form.updatedAt} onChange={(e) => updateForm('updatedAt', e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Hiệu lực</label>
            <input value={form.effectiveDate} onChange={(e) => updateForm('effectiveDate', e.target.value)} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Trạng thái</label>
            <input value={form.status} onChange={(e) => updateForm('status', e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={`${labelClass} flex items-center gap-2`}>
            <input
              type="checkbox"
              checked={form.hasGoldenRule}
              onChange={(e) => updateForm('hasGoldenRule', e.target.checked)}
              className="h-4 w-4 accent-gold"
            />
            Có quy định vàng
          </label>
          {form.hasGoldenRule && (
            <div className="mt-3 flex flex-col gap-3 border-l-2 border-gold-2/60 pl-4">
              <input
                value={form.goldenRuleTitle}
                onChange={(e) => updateForm('goldenRuleTitle', e.target.value)}
                placeholder="Tiêu đề quy định vàng"
                className={inputClass}
              />
              <StringListEditor
                items={form.goldenRulePoints}
                onChange={(next) => updateForm('goldenRulePoints', next)}
                placeholder="Điểm quy định"
                addLabel="Điểm"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-navy/10 pt-4">
          <label className={labelClass}>Tải file lên để trích xuất nội dung (PDF/DOCX/TXT/MD)</label>
          <label className="flex w-fit cursor-pointer items-center gap-2 border border-dashed border-navy/30 px-4 py-2.5 text-sm text-ink hover:border-blue">
            <Upload size={16} />
            {isExtracting ? 'Đang trích xuất…' : 'Chọn file'}
            <input type="file" accept=".pdf,.docx,.txt,.md" className="hidden" onChange={handleFileChange} disabled={isExtracting} />
          </label>
          {fileError && <p className="text-sm text-red-600">{fileError}</p>}
        </div>

        <div className="flex flex-col gap-4 border-t border-navy/10 pt-4">
          <div className="flex items-center justify-between">
            <p className={labelClass}>Các mục nội dung</p>
            <button
              type="button"
              onClick={() => updateForm('sections', [...form.sections, blankSection()])}
              className={smallBtn}
            >
              + Mục mới
            </button>
          </div>

          {form.sections.map((section, i) => (
            <div key={section.key} className="flex min-w-0 flex-col gap-3 border border-navy/15 bg-surface-2/40 p-3 sm:p-4 min-[1025px]:p-5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-muted">{i + 1}.</span>
                <input
                  value={section.title}
                  onChange={(e) => updateSection(section.key, { title: e.target.value })}
                  placeholder="Tiêu đề mục"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => updateForm('sections', form.sections.filter((s) => s.key !== section.key))}
                  className={removeBtn}
                  aria-label="Xoá mục"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div>
                <p className={labelClass}>Đoạn văn</p>
                <StringListEditor
                  items={section.paragraphs}
                  onChange={(next) => updateSection(section.key, { paragraphs: next })}
                  placeholder="Nội dung đoạn văn"
                  addLabel="Đoạn văn"
                />
              </div>

              <div>
                <p className={labelClass}>Gạch đầu dòng</p>
                <StringListEditor
                  items={section.bullets}
                  onChange={(next) => updateSection(section.key, { bullets: next })}
                  placeholder="Nội dung gạch đầu dòng"
                  addLabel="Gạch đầu dòng"
                />
              </div>

              <div>
                <label className={`${labelClass} flex items-center gap-2`}>
                  <input
                    type="checkbox"
                    checked={section.hasTable}
                    onChange={(e) => updateSection(section.key, { hasTable: e.target.checked })}
                    className="h-4 w-4 accent-gold"
                  />
                  Có bảng
                </label>
                {section.hasTable && (
                  <div className="mt-3">
                    <TableEditor
                      headers={section.tableHeaders}
                      rows={section.tableRows}
                      onChangeHeaders={(next) => updateSection(section.key, { tableHeaders: next })}
                      onChangeRows={(next) => updateSection(section.key, { tableRows: next })}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          {form.sections.length === 0 && <p className="text-sm text-muted">Chưa có mục nào — bấm &quot;+ Mục mới&quot; hoặc tải file lên.</p>}
        </div>
        </fieldset>

        {!isStaticSelected && (
          <div className="flex flex-wrap gap-4 border-t border-navy/10 pt-6">
            <Button type="button" onClick={handleSave} disabled={isPending}>
              {editingExisting ? 'Lưu thay đổi' : 'Tạo Rule'}
            </Button>
            {editingExisting && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="outline" disabled={isPending}>Xoá Rule</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xoá rule này?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Rule “{form.title}” sẽ bị xoá vĩnh viễn và không thể khôi phục.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Giữ lại</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Xoá Rule</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}

        {!isStaticSelected && editingExisting && selectedId && (
          <div className="border-t border-navy/10 pt-6">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-navy">Cấp quyền đọc cho rule này</p>
            <PermissionChecklist
              key={selectedId}
              docs={[{ id: selectedId, title: form.title }]}
              users={users}
              grantsByDoc={{ [selectedId]: grantsByRule[selectedId] ?? [] }}
              actions={ruleActions}
            />
          </div>
        )}
      </div>
    </div>
  );
}
