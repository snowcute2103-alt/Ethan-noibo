'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { listStickyNotesAction, createStickyNoteAction, updateStickyNoteTextAction, deleteStickyNoteAction } from '@/app/dashboard/actions';
import type { StickyNote } from '@/lib/sticky-notes';
import './sticky-board.css';

const STICKY_COLORS = ['#a9ef58', '#fbee9d', '#f45891', '#34add1', '#c97fe5'];
// Phải khớp STICKY_NOTE_TEXT_MAX_LEN ở app/dashboard/actions.ts (server không nhận lib
// 'server-only' làm hằng số dùng chung được ở phía client, nên lặp lại con số ở đây).
const TEXT_MAX_LEN = 100;
// Site không có hạ tầng WebSocket/pub-sub (Neon serverless chỉ có driver HTTP, không giữ
// kết nối để LISTEN/NOTIFY) — poll định kỳ là cách "gần-real-time" khả thi nhất mà không
// phải thêm dịch vụ ngoài (Pusher/Ably/Redis...).
const POLL_INTERVAL_MS = 150_000;
const CLASSIFIED_INTERVAL_MS = 12_000;
const CLASSIFIED_CHANCE = 0.18;

type SortKey = 'newest' | 'oldest';
type ModalState = { mode: 'create' } | { mode: 'view'; note: StickyNote };

interface DragState {
  el: HTMLElement;
  id: number;
  moved: boolean;
  offX: number;
  offY: number;
  pointerId: number;
}

interface StickyBoardProps {
  /** Note hiện có trên server tại thời điểm trang được render — ai cũng thấy note của mọi người. */
  initialNotes: StickyNote[];
  /** Id của người đang xem — dùng để biết note nào là "của mình" (được sửa nội dung/xoá). */
  currentUserId: number;
  /** BGĐ (tier full) — luôn xoá được bất kỳ note nào để kiểm duyệt, bất kể tác giả. */
  canModerate: boolean;
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' });

// Chức danh trong DB có thể dài (vd "Chief Executive Officer ( CEO )") — ưu tiên phần viết
// tắt trong ngoặc cho gọn, không có ngoặc thì mới dùng nguyên chức danh.
function shortTitle(title: string): string {
  const match = title.match(/\(([^)]+)\)/);
  return match ? match[1].trim() : title;
}

// Góc xoay giả-ngẫu-nhiên nhưng ổn định theo id note, để mỗi exhibit nghiêng khác nhau
// nhất quán giữa các lần render (không đổi mỗi khi list sort lại).
function rotFor(id: number): number {
  return ((id * 37) % 9) - 4;
}

// Hiệu ứng "chữ cắt dán" — mỗi ký tự một mảnh giấy riêng. NFC trước khi tách để một chữ có
// dấu tiếng Việt (vd "ệ") luôn là một khối duy nhất, không bị tách rời dấu khỏi chữ cái gốc.
function cutText(text: string): ReactNode[] {
  return Array.from(text.normalize('NFC')).map((ch, i) =>
    ch === ' ' ? (
      ' '
    ) : (
      <span className="sb-cut" key={i}>
        {ch}
      </span>
    )
  );
}

function mapById(notes: StickyNote[]): Map<number, StickyNote> {
  return new Map(notes.map((n) => [n.id, n]));
}

/**
 * Bảng ghi chú chung, phong cách "bảng hồ sơ điều tra" (evidence board). Mỗi note là một
 * exhibit ghim trên nền bảng bần, sắp xếp theo MỚI NHẤT/CŨ NHẤT, và kéo tạm để sắp xếp lại
 * (không lưu vị trí — vị trí chỉ còn ý nghĩa hiển thị cục bộ, khác bản kéo-thả-lưu-server
 * trước đây).
 *
 * Quyền hạn (giống bảng ghim vật lý thật): ai cũng xem được note của mọi người, nhưng chỉ
 * tác giả (hoặc BGĐ) mới xoá được note đó; chỉ tác giả mới sửa được nội dung.
 */
export default function StickyBoard({ initialNotes, currentUserId, canModerate }: StickyBoardProps) {
  const [notes, setNotes] = useState<StickyNote[]>(initialNotes);
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [modal, setModal] = useState<ModalState | null>(null);
  const [draftText, setDraftText] = useState('');
  const [editText, setEditText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteBusyId, setDeleteBusyId] = useState<number | null>(null);
  const [freeMode, setFreeMode] = useState(false);
  const [classifiedTick, setClassifiedTick] = useState(0);

  const pinboardRef = useRef<HTMLDivElement>(null);
  const positionsRef = useRef(new Map<number, { x: number; y: number }>());
  const freeModeRef = useRef(false);
  const dragRef = useRef<DragState | null>(null);
  const justDraggedRef = useRef(false);
  const modalOpenRef = useRef(false);
  modalOpenRef.current = modal !== null;

  function canDelete(note: StickyNote): boolean {
    return note.authorUserId === currentUserId || canModerate;
  }

  function resetLayout() {
    positionsRef.current.clear();
    freeModeRef.current = false;
    setFreeMode(false);
    if (pinboardRef.current) pinboardRef.current.style.height = '';
  }

  function enterFreeMode() {
    const pinboard = pinboardRef.current;
    if (!pinboard || freeModeRef.current) return;
    const pinRect = pinboard.getBoundingClientRect();
    const h = pinboard.offsetHeight;
    const snapshot: { el: HTMLElement; id: number; x: number; y: number }[] = [];
    pinboard.querySelectorAll<HTMLElement>('.sb-exhibit').forEach((el) => {
      const r = el.getBoundingClientRect();
      snapshot.push({ el, id: Number(el.dataset.index), x: r.left - pinRect.left, y: r.top - pinRect.top });
    });
    freeModeRef.current = true;
    setFreeMode(true);
    pinboard.style.height = `${h}px`;
    snapshot.forEach((s) => {
      positionsRef.current.set(s.id, { x: s.x, y: s.y });
      s.el.style.setProperty('--x', `${s.x}px`);
      s.el.style.setProperty('--y', `${s.y}px`);
    });
  }

  // Kéo tạm để sắp xếp lại exhibit — chỉ đổi hiển thị cục bộ (--x/--y trên DOM node, viết
  // trực tiếp ngoài React để không giật khi rê chuột), không có gì được lưu lên server.
  useEffect(() => {
    const pinboard = pinboardRef.current;
    if (!pinboard) return;

    // offX/offY chỉ ghi lại độ lệch giữa điểm bấm và góc thẻ — chưa đụng gì đến free mode
    // hay setPointerCapture. Cả hai việc đó dời sang onPointerMove, chỉ chạy khi con trỏ
    // thật sự di chuyển: gọi setPointerCapture ngay ở đây từng khiến sự kiện "click" bị
    // trình duyệt retarget lên .sb-exhibit (phần tử capture) thay vì <h3> bên trong nó —
    // closest('[data-act=view]') tìm lên tổ tiên nên không thấy nữa, bấm vào tiêu đề để mở
    // modal im lặng không phản ứng dù không hề kéo.
    function onPointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      const card = target.closest<HTMLElement>('.sb-exhibit');
      if (!card) return;
      const cardRect = card.getBoundingClientRect();
      dragRef.current = {
        el: card,
        id: Number(card.dataset.index),
        moved: false,
        offX: e.clientX - cardRect.left,
        offY: e.clientY - cardRect.top,
        pointerId: e.pointerId,
      };
    }

    function onPointerMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const ref = pinboard!.getBoundingClientRect();
      let x = e.clientX - ref.left - drag.offX;
      let y = e.clientY - ref.top - drag.offY;
      x = Math.max(0, Math.min(x, pinboard!.clientWidth - 240));
      y = Math.max(0, Math.min(y, pinboard!.clientHeight - 120));
      if (!drag.moved) {
        drag.moved = true;
        enterFreeMode();
        drag.el.classList.add('dragging');
        drag.el.setPointerCapture(drag.pointerId);
      }
      positionsRef.current.set(drag.id, { x, y });
      drag.el.style.setProperty('--x', `${x}px`);
      drag.el.style.setProperty('--y', `${y}px`);
    }

    function onPointerUp() {
      const drag = dragRef.current;
      if (!drag) return;
      if (drag.moved) justDraggedRef.current = true;
      drag.el.classList.remove('dragging');
      dragRef.current = null;
    }

    pinboard.addEventListener('pointerdown', onPointerDown);
    pinboard.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      pinboard.removeEventListener('pointerdown', onPointerDown);
      pinboard.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  // Đổi cách sắp xếp trong lúc đang kéo-sắp-tạm sẽ khiến vị trí đóng băng lệch khỏi thứ tự
  // mới — tự đưa layout về lưới bình thường để tránh hiển thị rối (không còn nút thủ công).
  useEffect(() => {
    resetLayout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortKey]);

  // Poll định kỳ để phản ánh note mới/sửa/xoá từ người khác. Bỏ qua nguyên lượt khi đang có
  // modal mở (xem/sửa/tạo) để không đè nội dung đang thao tác dở ngay dưới tay người dùng.
  useEffect(() => {
    let cancelled = false;
    async function sync() {
      if (modalOpenRef.current) return;
      let serverNotes: StickyNote[];
      try {
        serverNotes = await listStickyNotesAction();
      } catch {
        return;
      }
      if (cancelled) return;
      setNotes(serverNotes);
      const known = mapById(serverNotes);
      for (const id of Array.from(positionsRef.current.keys())) {
        if (!known.has(id)) positionsRef.current.delete(id);
      }
    }
    const id = window.setInterval(sync, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  // Con dấu "MẬT" thi thoảng loé lên rồi mờ dần — key đổi ép React remount node để hiệu ứng
  // CSS (animation: sb-bleed, chạy hết là dừng ở trạng thái ẩn) chạy lại từ đầu mỗi lần.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (Math.random() < CLASSIFIED_CHANCE) setClassifiedTick((t) => t + 1);
    }, CLASSIFIED_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const visibleNotes = useMemo(() => {
    const list = [...notes];
    if (sortKey === 'newest') list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    else list.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    return list;
  }, [notes, sortKey]);

  function openCreate() {
    setDraftText('');
    setCreateError(null);
    setModal({ mode: 'create' });
  }

  function openView(note: StickyNote) {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    setEditText(note.text);
    setIsEditing(false);
    setModal({ mode: 'view', note });
  }

  function closeModal() {
    setModal(null);
    setIsEditing(false);
  }

  async function handleCreateSubmit() {
    const text = draftText.trim().slice(0, TEXT_MAX_LEN);
    if (!text || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const color = STICKY_COLORS[notes.length % STICKY_COLORS.length];
      const note = await createStickyNoteAction({ x: 0, y: 0, color, text });
      setNotes((prev) => [note, ...prev]);
      closeModal();
    } catch {
      setCreateError('Không tạo được ghi chú, thử lại nhé.');
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveEdit(note: StickyNote) {
    const text = editText.trim().slice(0, TEXT_MAX_LEN);
    if (!text || savingEdit) return;
    setSavingEdit(true);
    try {
      const result = await updateStickyNoteTextAction(note.id, text);
      if (result.ok) {
        setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, text } : n)));
        setModal({ mode: 'view', note: { ...note, text } });
        setIsEditing(false);
      }
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(note: StickyNote) {
    if (deleteBusyId === note.id) return;
    if (typeof window !== 'undefined' && !window.confirm('Xoá ghi chú này khỏi bảng? Không thể hoàn tác.')) return;
    setDeleteBusyId(note.id);
    try {
      const result = await deleteStickyNoteAction(note.id);
      if (result.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== note.id));
        positionsRef.current.delete(note.id);
        setModal((m) => (m && m.mode === 'view' && m.note.id === note.id ? null : m));
      }
    } finally {
      setDeleteBusyId(null);
    }
  }

  return (
    <div className="sticky-board-widget">
      <div className="sb-grain" aria-hidden="true" />
      <div className="sb-flicker" aria-hidden="true" />
      <div key={classifiedTick} className="sb-classified show" aria-hidden="true">
        MẬT
      </div>

      <header className="sb-header">
        <div className="sb-stamp">HỒ SƠ SỐ 001</div>
        <div className="sb-header-row">
          <h2 className="sb-title">
            {cutText('GÓC GHI CHÚ')}
            <span className="sb-title-sub">GHI CHÚ NỘI BỘ CHUNG</span>
          </h2>
          <div className="sb-controls">
            <button type="button" className={`sb-ctrl${sortKey === 'newest' ? ' is-active' : ''}`} onClick={() => setSortKey('newest')}>
              MỚI NHẤT
            </button>
            <button type="button" className={`sb-ctrl${sortKey === 'oldest' ? ' is-active' : ''}`} onClick={() => setSortKey('oldest')}>
              CŨ NHẤT
            </button>
            <button type="button" className="sb-ctrl" onClick={openCreate}>
              + THÊM GHI CHÚ
            </button>
          </div>
        </div>
      </header>

      <main className={`sb-pinboard${freeMode ? ' free' : ''}`} ref={pinboardRef} aria-live="polite">
        {visibleNotes.length === 0 ? (
          <p className="sb-empty">Bảng đang trống — bấm &quot;+ THÊM GHI CHÚ&quot; để là người đầu tiên.</p>
        ) : (
          visibleNotes.map((note) => (
            <article
              key={note.id}
              className="sb-exhibit"
              data-index={note.id}
              style={{ '--rot': `${rotFor(note.id)}deg` } as CSSProperties}
            >
              <div className="sb-exhibit-meta">
                <span className="sb-exhibit-source">
                  <span className="sb-exhibit-tag" style={{ background: note.color }} aria-hidden="true" />
                  {note.authorName}
                  {note.authorTitle && <span className="sb-exhibit-role">{shortTitle(note.authorTitle)}</span>}
                </span>
                <span className="sb-exhibit-date">
                  <time dateTime={note.updatedAt}>{fmtDate(note.updatedAt)}</time>
                </span>
              </div>
              <h3 className="sb-exhibit-title" onClick={() => openView(note)} title="Xem chi tiết">
                {note.text || '(chưa có nội dung)'}
              </h3>
              {canDelete(note) && (
                <div className="sb-exhibit-actions">
                  <button type="button" disabled={deleteBusyId === note.id} onClick={() => handleDelete(note)}>
                    XOÁ
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </main>

      <footer className="sb-footer">{notes.length} GHI CHÚ TRÊN BẢNG · VUI LÒNG GIỮ GÌN CHUNG</footer>

      <div className={`evb-notes${modal ? ' open' : ''}`}>
        <div className="evb-notes-card" role="dialog" aria-modal="true" aria-label="Chi tiết ghi chú">
          <button type="button" className="evb-notes-close" aria-label="Đóng" onClick={closeModal}>
            &times;
          </button>

          {modal?.mode === 'create' && (
            <>
              <div className="evb-note-stamp">EXHIBIT MỚI</div>
              <h3 className="evb-note-title">Thêm ghi chú lên bảng</h3>
              <textarea
                className="evb-note-textarea"
                value={draftText}
                maxLength={TEXT_MAX_LEN}
                placeholder="Một điều bạn muốn gửi gắm, một lời chúc, một lời chào…"
                onChange={(e) => setDraftText(e.target.value)}
                autoFocus
              />
              <div className="evb-note-counter">
                {draftText.length}/{TEXT_MAX_LEN}
              </div>
              {createError && <p className="evb-note-line">{createError}</p>}
              <div className="evb-note-actions">
                <button type="button" className="primary" disabled={!draftText.trim() || creating} onClick={handleCreateSubmit}>
                  {creating ? 'ĐANG GHIM…' : 'GHIM LÊN BẢNG'}
                </button>
              </div>
            </>
          )}

          {modal?.mode === 'view' && (
            <>
              <div className="evb-note-stamp">EXHIBIT #{String(modal.note.id).padStart(3, '0')}</div>
              {isEditing ? (
                <textarea
                  className="evb-note-textarea"
                  value={editText}
                  maxLength={TEXT_MAX_LEN}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                />
              ) : (
                <h3 className="evb-note-title">{modal.note.text || '(chưa có nội dung)'}</h3>
              )}
              <p className="evb-note-line">
                <b>TÁC GIẢ:</b> {modal.note.authorName}
                {modal.note.authorTitle ? ` · ${shortTitle(modal.note.authorTitle)}` : ''}
              </p>
              <p className="evb-note-line">
                <b>CẬP NHẬT:</b> {fmtDateTime(modal.note.updatedAt)}
              </p>
              <div className="evb-note-actions">
                {modal.note.authorUserId === currentUserId &&
                  (isEditing ? (
                    <button type="button" className="primary" disabled={!editText.trim() || savingEdit} onClick={() => handleSaveEdit(modal.note)}>
                      {savingEdit ? 'ĐANG LƯU…' : 'LƯU'}
                    </button>
                  ) : (
                    <button type="button" onClick={() => setIsEditing(true)}>
                      SỬA
                    </button>
                  ))}
                {canDelete(modal.note) && (
                  <button type="button" className="danger" disabled={deleteBusyId === modal.note.id} onClick={() => handleDelete(modal.note)}>
                    XOÁ
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
