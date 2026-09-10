'use client';

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import Image from 'next/image';
import { Clock3, History, ImagePlus, MessageCircle, Save, Trash2, X } from 'lucide-react';
import type {
  PersonalTaskDetail,
  PersonalTaskHistoryEntry,
  PersonalTaskPatch,
  Task,
  TaskPriority,
  TaskStatus,
} from '@/lib/tasks';
import {
  addPersonalTaskCommentAction,
  deletePersonalTaskAction,
  getPersonalTaskDetailAction,
  removePersonalTaskImageAction,
  updatePersonalTaskAction,
  uploadPersonalTaskImageAction,
} from '@/app/dashboard/giao-task/actions';
import ImageLightbox from '@/components/dashboard/image-lightbox';
import TaskDateRangePicker from '@/components/dashboard/task-date-range-picker';
import { normalizePersonalTaskDescription } from '@/lib/personal-task-description';

interface PersonalTaskDetailDrawerProps {
  task: Task;
  ownerUserId: number;
  /** Id người đang xem drawer — so với task.createdBy để quyết định có hiện
   *  nút "Xoá task" không (chỉ đúng người tạo/giao mới xoá được, xem
   *  deletePersonalTaskAction). Sửa/cập nhật thì ai có quyền xem cũng làm được. */
  viewerUserId: number;
  today: string;
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
  onDeleted: () => void;
}

const PRIORITIES: Array<{ value: TaskPriority; label: string; tone: string }> = [
  { value: 'low', label: 'Thấp', tone: 'text-slate-500' },
  { value: 'normal', label: 'Bình thường', tone: 'text-blue' },
  { value: 'high', label: 'Cao', tone: 'text-amber-600' },
];

const STATUSES: Array<{ value: TaskStatus; label: string }> = [
  { value: 'not_started', label: 'Chưa làm' },
  { value: 'in_progress', label: 'Đang làm' },
  { value: 'done', label: 'Hoàn thành' },
];

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}

const FIELD_LABELS: Record<string, string> = {
  title: 'tiêu đề',
  taskDate: 'ngày bắt đầu',
  dueDate: 'ngày kết thúc',
  description: 'mô tả',
  priority: 'mức ưu tiên',
  status: 'trạng thái',
  imageUrl: 'ảnh',
  imageUrls: 'ảnh',
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'trống';
  if (value === 'not_started') return 'Chưa làm';
  if (value === 'in_progress') return 'Đang làm';
  if (value === 'done') return 'Hoàn thành';
  if (value === 'low') return 'Thấp';
  if (value === 'normal') return 'Bình thường';
  if (value === 'high') return 'Cao';
  const text = String(value);
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

function historyText(entry: PersonalTaskHistoryEntry): string {
  if (entry.eventType === 'created') return 'đã tạo task';
  if (entry.eventType === 'commented') return 'đã thêm bình luận';
  if (entry.eventType === 'image_updated') return 'đã cập nhật ảnh';
  if (entry.eventType === 'rollover') {
    const change = entry.changes.taskDate as { from?: unknown; to?: unknown } | undefined;
    return `Hệ thống chuyển task trễ từ ${displayValue(change?.from)} sang ${displayValue(change?.to)}`;
  }
  const descriptions = Object.entries(entry.changes).map(([field, rawChange]) => {
    const change = rawChange as { from?: unknown; to?: unknown };
    return `${FIELD_LABELS[field] ?? field} từ ${displayValue(change.from)} thành ${displayValue(change.to)}`;
  });
  return descriptions.length > 0 ? `đã đổi ${descriptions.join('; ')}` : 'đã cập nhật task';
}

function initialsOf(name: string): string {
  return name.trim().split(/\s+/).slice(-1)[0]?.[0]?.toUpperCase() ?? '?';
}

export default function PersonalTaskDetailDrawer({
  task,
  ownerUserId,
  viewerUserId,
  today,
  onClose,
  onTaskUpdated,
  onDeleted,
}: PersonalTaskDetailDrawerProps) {
  const canDelete = viewerUserId === (task.createdBy ?? ownerUserId);
  const [detail, setDetail] = useState<PersonalTaskDetail | null>(null);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(() => normalizePersonalTaskDescription(task.description ?? task.note ?? ''));
  const [taskDate, setTaskDate] = useState(task.taskDate);
  const [dueDate, setDueDate] = useState<string | null>(task.dueDate);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  function loadDetail() {
    startTransition(() => {
      getPersonalTaskDetailAction(ownerUserId, task.id)
        .then((next) => {
          setDetail(next);
          onTaskUpdated(next.task);
          setTitle(next.task.title);
          setDescription(normalizePersonalTaskDescription(next.task.description ?? next.task.note ?? ''));
          setTaskDate(next.task.taskDate);
          setDueDate(next.task.dueDate);
          setPriority(next.task.priority);
          setStatus(next.task.status);
          setError(null);
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được chi tiết task.'));
    });
  }

  useEffect(() => {
    loadDetail();
    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab' && drawerRef.current) {
        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocusedRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  function save(event: FormEvent) {
    event.preventDefault();
    const baseline = detail?.task ?? task;
    const patch: PersonalTaskPatch = {};
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim() || null;
    if (normalizedTitle !== baseline.title) patch.title = normalizedTitle;
    if (normalizedDescription !== baseline.description) patch.description = normalizedDescription;
    if (taskDate !== baseline.taskDate) patch.taskDate = taskDate;
    if (dueDate !== baseline.dueDate) patch.dueDate = dueDate;
    if (priority !== baseline.priority) patch.priority = priority;
    if (status !== baseline.status) patch.status = status;
    if (Object.keys(patch).length === 0) return;
    startTransition(() => {
      updatePersonalTaskAction(ownerUserId, task.id, patch)
        .then((updated) => {
          onTaskUpdated(updated);
          setDetail((current) => (current ? { ...current, task: updated } : current));
          setError(null);
          loadDetail();
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Không lưu được task.'));
    });
  }

  function handleDescriptionEnter(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    const input = event.currentTarget;
    const beforeCursor = description.slice(0, input.selectionStart);
    const currentLine = beforeCursor.slice(beforeCursor.lastIndexOf('\n') + 1);
    const match = currentLine.match(/^\s*(•|→)\s+(.*)$/);
    if (!match) return;
    event.preventDefault();
    const marker = match[1];
    const continuation = match[2].trim() ? `\n${marker} ` : '\n';
    const next = `${description.slice(0, input.selectionStart)}${continuation}${description.slice(input.selectionEnd)}`;
    const cursor = input.selectionStart + continuation.length;
    setDescription(next);
    requestAnimationFrame(() => input.setSelectionRange(cursor, cursor));
  }

  function uploadImages(files: File[]) {
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    startTransition(() => {
      uploadPersonalTaskImageAction(ownerUserId, task.id, formData)
        .then((updated) => {
          onTaskUpdated(updated);
          setDetail((current) => (current ? { ...current, task: updated } : current));
          setError(null);
          loadDetail();
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được ảnh.'));
    });
  }

  function handleImageDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingImages(false);
    uploadImages(Array.from(event.dataTransfer.files));
  }

  function handleImagePaste(event: ClipboardEvent<HTMLElement>) {
    const files = Array.from(event.clipboardData.files);
    if (files.length === 0) return;
    event.preventDefault();
    uploadImages(files);
  }

  function removeTask() {
    if (!window.confirm('Xoá task này? Không thể hoàn tác.')) return;
    startTransition(() => {
      deletePersonalTaskAction(ownerUserId, task.id)
        .then(() => onDeleted())
        .catch((err) => setError(err instanceof Error ? err.message : 'Không xoá được task.'));
    });
  }

  function removeImage(imageUrl: string) {
    startTransition(() => {
      removePersonalTaskImageAction(ownerUserId, task.id, imageUrl)
        .then((updated) => {
          onTaskUpdated(updated);
          setDetail((current) => (current ? { ...current, task: updated } : current));
          setError(null);
          loadDetail();
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Không xoá được ảnh.'));
    });
  }

  function submitComment(event: FormEvent) {
    event.preventDefault();
    const content = comment.trim();
    if (!content) return;
    startTransition(() => {
      addPersonalTaskCommentAction(ownerUserId, task.id, content)
        .then(() => {
          setComment('');
          loadDetail();
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Không gửi được bình luận.'));
    });
  }

  const currentTask = detail?.task ?? task;

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      <button
        type="button"
        aria-label="Đóng chi tiết task"
        onClick={onClose}
        className="absolute inset-0 h-full w-full"
      />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="personal-task-detail-title"
        onPaste={handleImagePaste}
        className="theme-light-surface absolute inset-y-0 right-0 flex w-full flex-col border-l-2 border-black bg-[#f8fafc] shadow-[-24px_0_60px_-32px_rgba(16,26,48,0.55)] sm:w-[min(70vw,440px)] min-[1025px]:w-[clamp(360px,33vw,520px)]"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e2e8f0] bg-white/95 px-3.5 py-2.5 backdrop-blur sm:px-4">
          <div>
            <h2 id="personal-task-detail-title" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue">Chi tiết task</h2>
            <p className="mt-0.5 text-xs text-muted" aria-live="polite">
              {isPending ? 'Đang xử lý…' : 'Mọi thay đổi được lưu vào lịch sử'}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="grid h-[44px] w-[44px] place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue min-[1025px]:h-9 min-[1025px]:w-9"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-3.5 py-3.5 sm:px-4">
          {error && <p className="mb-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{error}</p>}

          <form onSubmit={save} className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Tiêu đề</span>
              <textarea
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                rows={2}
                required
                className="mt-1 w-full resize-none rounded-[10px] border border-[#dbe4f2] bg-white px-3 py-2 font-heading text-lg font-semibold text-navy outline-none focus:border-blue focus:ring-2 focus:ring-blue/15"
              />
            </label>

            <div className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Mô tả</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(normalizePersonalTaskDescription(event.target.value))}
                onKeyDown={handleDescriptionEnter}
                rows={4}
                maxLength={10_000}
                placeholder="Gõ “- ” để tạo gạch đầu dòng…"
                className="mt-1 w-full resize-y rounded-[10px] border border-[#dbe4f2] bg-white px-3 py-2.5 text-sm leading-7 text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue/15"
              />
            </div>

            <div
              className="block"
              onDragEnter={(event) => { event.preventDefault(); setIsDraggingImages(true); }}
              onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDraggingImages(false);
              }}
              onDrop={handleImageDrop}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Ảnh</span>
                {currentTask.imageUrls.length > 0 && (
                  <span className="text-[11px] text-muted">{currentTask.imageUrls.length}/10 ảnh</span>
                )}
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(event) => {
                  uploadImages(Array.from(event.target.files ?? []));
                  event.currentTarget.value = '';
                }}
              />
              {currentTask.imageUrls.length > 0 && (
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {currentTask.imageUrls.map((imageUrl, index) => (
                    <div key={imageUrl} className="relative overflow-hidden rounded-[10px] border border-[#dbe4f2] bg-white">
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(imageUrl)}
                        title="Bấm để xem ảnh to hơn"
                        className="relative h-28 w-full cursor-zoom-in"
                      >
                        <Image src={imageUrl} alt={`Ảnh ${index + 1} của task ${currentTask.title}`} fill sizes="(max-width: 640px) 50vw, 260px" className="object-contain" />
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => removeImage(imageUrl)}
                        aria-label={`Xoá ảnh ${index + 1}`}
                        className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-red-500 shadow hover:bg-white disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                disabled={isPending || currentTask.imageUrls.length >= 10}
                onClick={() => imageInputRef.current?.click()}
                className={`mt-2 flex min-h-16 w-full flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed bg-white px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  isDraggingImages ? 'border-blue bg-blue/5 text-blue ring-2 ring-blue/10' : 'border-[#cbd7e8] text-muted hover:border-blue hover:text-blue'
                }`}
              >
                <span className="flex items-center gap-2"><ImagePlus className="h-4 w-4" aria-hidden="true" /> Thêm ảnh</span>
                <span className="text-[11px] font-normal">Chọn nhiều ảnh, kéo thả hoặc Ctrl/Cmd + V</span>
              </button>
              <ImageLightbox src={lightboxUrl} alt={currentTask.title} onClose={() => setLightboxUrl(null)} />
            </div>

            <div className="flex flex-col gap-2">
              <div className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Ngày</span>
                <div className="mt-1">
                  <TaskDateRangePicker
                    startDate={taskDate}
                    dueDate={dueDate}
                    today={today}
                    onChange={(next) => {
                      setTaskDate(next.startDate);
                      setDueDate(next.dueDate);
                    }}
                  />
                </div>
              </div>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Trạng thái</span>
                <select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)} className="mt-1 h-[44px] w-full rounded-[10px] border border-[#dbe4f2] bg-white px-2.5 text-sm text-navy outline-none focus:border-blue min-[1025px]:h-10">
                  {STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
            </div>

            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-muted">Mức độ ưu tiên</legend>
              <div className="mt-1 grid grid-cols-3 gap-1.5">
                {PRIORITIES.map((item) => (
                  <label key={item.value} className={`flex min-h-9 cursor-pointer items-center justify-center gap-1 rounded-[10px] border bg-white px-1.5 text-xs font-semibold ${priority === item.value ? 'border-blue ring-2 ring-blue/10' : 'border-[#dbe4f2]'} ${item.tone}`}>
                    <input type="radio" name="priority" value={item.value} checked={priority === item.value} onChange={() => setPriority(item.value)} className="sr-only" />
                    <span aria-hidden="true">⚑</span>{item.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <button type="submit" disabled={isPending || !title.trim()} className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] bg-blue px-4 text-sm font-semibold text-white hover:bg-blue-cta disabled:cursor-not-allowed disabled:opacity-50 min-[1025px]:h-10">
              <Save className="h-4 w-4" aria-hidden="true" /> Lưu thay đổi
            </button>
            {canDelete && (
              <button
                type="button"
                disabled={isPending}
                onClick={removeTask}
                className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] border border-red-200 px-4 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 min-[1025px]:h-10"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Xoá task
              </button>
            )}
          </form>

          <section className="mt-5 border-t border-[#e2e8f0] pt-4">
            <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-navy"><MessageCircle className="h-4 w-4 text-blue" aria-hidden="true" />Bình luận <span className="text-xs text-muted">({detail?.comments.length ?? 0})</span></h3>
            <form onSubmit={submitComment} className="mt-2">
              <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={2} maxLength={2_000} placeholder="Viết bình luận…" className="w-full resize-y rounded-[10px] border border-[#dbe4f2] bg-white px-3 py-2 text-sm outline-none focus:border-blue" onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') event.currentTarget.form?.requestSubmit(); }} />
              <button type="submit" disabled={isPending || !comment.trim()} className="mt-1.5 rounded-[9px] bg-navy px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-40">Gửi bình luận</button>
            </form>
            <div className="mt-3 space-y-2">
              {detail?.comments.map((item) => (
                <article key={item.id} className="flex gap-2 rounded-[10px] bg-white p-2.5">
                  {item.authorAvatarUrl ? <Image src={item.authorAvatarUrl} alt={item.authorFullName} width={24} height={24} className="h-6 w-6 shrink-0 rounded-full object-cover" /> : <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue text-[10px] font-bold text-white">{initialsOf(item.authorFullName)}</span>}
                  <div className="min-w-0"><p className="text-xs font-bold text-navy">{item.authorFullName} <time className="ml-1 font-normal text-muted">{formatDateTime(item.createdAt)}</time></p><p className="mt-0.5 whitespace-pre-wrap break-words text-xs leading-relaxed text-ink">{item.content}</p></div>
                </article>
              ))}
              {detail && detail.comments.length === 0 && <p className="text-xs text-muted">Chưa có bình luận.</p>}
            </div>
          </section>

          <details className="mt-5 border-t border-[#e2e8f0] pt-4">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-heading text-sm font-bold text-navy"><History className="h-4 w-4 text-blue" aria-hidden="true" />Lịch sử hoạt động <span className="text-xs text-muted">({detail?.history.length ?? 0})</span></summary>
            <ol className="mt-3 space-y-2 border-l border-[#dbe4f2] pl-3">
              {detail?.history.map((entry) => (
                <li key={entry.id} className="relative text-xs text-ink before:absolute before:-left-[17px] before:top-1.5 before:h-2 before:w-2 before:rounded-full before:bg-blue">
                  <p><strong className="font-semibold text-navy">{entry.actorFullName ?? 'Hệ thống'}</strong> {historyText(entry)}</p>
                  <time className="mt-0.5 block text-[11px] text-muted">{formatDateTime(entry.createdAt)}</time>
                </li>
              ))}
            </ol>
          </details>

          <footer className="mt-5 space-y-1 border-t border-[#e2e8f0] pt-3 text-xs text-muted">
            <p className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />Tạo lúc {formatDateTime(currentTask.createdAt)}</p>
            <p className="pl-5">Cập nhật lúc {formatDateTime(currentTask.updatedAt)}</p>
          </footer>
        </div>
      </aside>
    </div>
  );
}
