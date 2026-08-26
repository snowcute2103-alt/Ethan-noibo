'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import {
  listStickyNotesAction,
  createStickyNoteAction,
  moveStickyNoteAction,
  updateStickyNoteTextAction,
  deleteStickyNoteAction,
  toggleStickyNotePinAction,
} from '@/app/dashboard/actions';
import type { StickyNote } from '@/lib/sticky-notes';
import './sticky-board.css';

// Draggable + InertiaPlugin were Club GreenSock-only plugins; GSAP (now under
// Webflow) made every plugin free for everyone starting with the 3.13 "no
// charge" license — gsap@3.15 here already ships under that license, so no
// membership/token is needed to import them.
gsap.registerPlugin(Draggable, InertiaPlugin);

const NUM_STICKIES = 102;
const STICKY_COLORS = ['#a9ef58', '#fbee9d', '#f45891', '#34add1', '#c97fe5'];
// Phải khớp STICKY_NOTE_TEXT_MAX_LEN ở app/dashboard/actions.ts (server không nhận lib
// 'server-only' làm hằng số dùng chung được ở phía client, nên lặp lại con số ở đây).
const TEXT_MAX_LEN = 100;
// Site không có hạ tầng WebSocket/pub-sub (Neon serverless chỉ có driver HTTP, không giữ
// kết nối để LISTEN/NOTIFY) — poll định kỳ là cách "gần-real-time" khả thi nhất mà không
// phải thêm dịch vụ ngoài (Pusher/Ably/Redis...). 2.5 phút — đủ chậm để không còn cảm giác
// giật/lag khi thao tác, người khác thấy note mới trong khoảng 2-3 phút là chấp nhận được.
const POLL_INTERVAL_MS = 150_000;

const PLACEHOLDER_DRAG_ME = 'Kéo tôi ra';
const PLACEHOLDER_WRITE_ON_ME = 'Viết lên tôi';
const PLACEHOLDER_STICK_ME = 'Dán tôi vào bảng';

interface StickyBoardProps {
  /** Note hiện có trên server tại thời điểm trang được render — ai cũng thấy note của mọi người. */
  initialNotes: StickyNote[];
  /** Id của người đang xem — dùng để biết note nào là "của mình" (được sửa nội dung/xoá). */
  currentUserId: number;
  /** BGĐ (tier full) — luôn xoá được bất kỳ note nào để kiểm duyệt, bất kể tác giả. */
  canModerate: boolean;
}

/**
 * Bảng ghi chú kéo-thả dùng chung (sticky note corkboard) — ported từ một CodePen, sau đó
 * nối vào Postgres để mọi người cùng thấy note của nhau. Các note được tạo bằng DOM thuần
 * (không phải React state) vì GSAP Draggable là bên nắm transform/vị trí của chúng trực
 * tiếp — để React re-render cạnh tranh với engine kéo-thả sẽ chỉ gây giật/xung đột.
 *
 * Quyền hạn (giống bảng ghim vật lý thật): ai cũng kéo/di chuyển được note của bất kỳ ai,
 * nhưng chỉ tác giả (hoặc BGĐ) mới sửa được nội dung/xoá note đó. Xem sticky-board.css để
 * biết các thay đổi scoping khi nhúng pen gốc (vốn chiếm toàn trang) vào giữa trang dashboard.
 */
export default function StickyBoard({ initialNotes, currentUserId, canModerate }: StickyBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Checked directly off the refs (not pre-extracted vars) so TS infers `board`/`trash`/
    // `resetLabel` below as non-null types — that inference is what the nested closures
    // further down see too, since narrowing itself doesn't cross closure boundaries.
    if (!boardRef.current || !trashRef.current || !resetRef.current) return;
    const board = boardRef.current;
    const trash = trashRef.current;
    const resetLabel = resetRef.current;

    const draggableByEl = new Map<HTMLElement, Draggable>();
    const domCleanupByEl = new Map<HTMLElement, () => void>();
    const elByNoteId = new Map<number, HTMLElement>();
    const pendingCreateByEl = new Map<HTMLElement, Promise<StickyNote>>();

    function isOverlapping(a: Element, b: Element) {
      const r1 = a.getBoundingClientRect();
      const r2 = b.getBoundingClientRect();
      return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
    }

    // Note này có xoá được bởi người đang xem không — tác giả luôn được, BGĐ luôn được
    // (kiểm duyệt), note trắng chưa từng "used" thì luôn được vì chưa có gì trên server.
    function canDelete(el: HTMLElement): boolean {
      return !el.classList.contains('used') || el.dataset.ownerId === String(currentUserId) || canModerate;
    }

    // Id note trên server cho 1 phần tử — chờ nốt request tạo đang chạy dở (nếu note vừa
    // được kéo ra chưa kịp có id) trước khi trả về undefined (note trắng, chưa từng tạo).
    async function resolveNoteId(el: HTMLElement): Promise<number | undefined> {
      if (el.dataset.noteId) return Number(el.dataset.noteId);
      const pending = pendingCreateByEl.get(el);
      if (!pending) return undefined;
      try {
        return (await pending).id;
      } catch {
        return undefined;
      }
    }

    // Xoay lật ra sau trên trục X + phóng to nhẹ, mô phỏng cảm giác "bóc" note khỏi bảng.
    function grabNoteAnimation(target: Element) {
      const tl = gsap.timeline();
      tl.to(target, {
        rotateX: 30,
        boxShadow: '-1px 14px 40px -4px rgba(0, 0, 0, 0.12), inset 0 14px 20px -12px rgba(0, 0, 0, 0.3)',
        duration: 0.3,
      }).to(
        target,
        {
          rotation: 0,
          rotateX: 5,
          scale: 1.1,
          boxShadow: '-1px 14px 40px -4px rgba(0, 0, 0, 0.12), inset 0 24px 30px -12px rgba(0, 0, 0, 0.3)',
          ease: 'elastic.out(0.8, 0.5)',
        },
        0.15
      );
      tl.play();
    }

    // Chiều ngược lại — "dán" note trở lại bảng khi thả tay.
    function releaseNoteAnimation(target: Element) {
      const tl = gsap.timeline();
      tl.to(target, {
        rotateX: 30,
        boxShadow: '-1px 10px 5px -4px rgba(0, 0, 0, 0.2), inset 0 24px 30px -12px rgba(0, 0, 0, 0.3)',
        duration: 0.3,
      })
        .to(target, { scale: 1 }, 0)
        .to(
          target,
          {
            rotateX: 5,
            boxShadow: '-1px 10px 5px -4px rgba(0, 0, 0, 0.2), inset 0 24px 30px -12px rgba(0, 0, 0, 0.3)',
            ease: 'elastic.out(0.8, 0.5)',
          },
          0.2
        );
      tl.play();
    }

    // Gỡ hẳn 1 note khỏi bảng: kill draggable, gỡ listener của textarea rồi mới xoá DOM
    // — thứ tự này tránh rò rỉ bộ nhớ khi node đã bị detach nhưng closure vẫn giữ tham chiếu.
    function removeSticky(el: HTMLElement) {
      draggableByEl.get(el)?.kill();
      draggableByEl.delete(el);
      domCleanupByEl.get(el)?.();
      domCleanupByEl.delete(el);
      if (el.dataset.noteId) elByNoteId.delete(Number(el.dataset.noteId));
      pendingCreateByEl.delete(el);
      el.remove();
    }

    // Chức danh trong DB có thể dài (vd "Chief Executive Officer ( CEO )") — ưu tiên phần
    // viết tắt trong ngoặc cho gọn, không có ngoặc thì mới dùng nguyên chức danh.
    function shortTitle(title: string): string {
      const match = title.match(/\(([^)]+)\)/);
      return match ? match[1].trim() : title;
    }

    function setAuthorLabel(sticky: HTMLElement, name: string, title: string | null) {
      const label = sticky.querySelector<HTMLElement>('.stickynote-author');
      if (label) label.textContent = title ? `${name} - ${shortTitle(title)}` : name;
    }

    // isOwn quyết định textarea có readOnly hay không — chỉ tác giả (hoặc chưa ai nhận,
    // tức note trắng sắp thành của người đang kéo) mới gõ được.
    function attachTextareaBehaviour(sticky: HTMLElement, textarea: HTMLTextAreaElement) {
      function setHeight() {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
      function onFocus() {
        draggableByEl.get(sticky)?.disable();
      }
      async function onBlur() {
        draggableByEl.get(sticky)?.enable();
        if (textarea.readOnly) return;
        const id = await resolveNoteId(sticky);
        if (id === undefined) return; // note trắng chưa từng kéo ra — chưa có gì để lưu
        updateStickyNoteTextAction(id, textarea.value).catch(() => {});
      }
      setHeight();
      textarea.addEventListener('input', setHeight);
      textarea.addEventListener('change', setHeight);
      textarea.addEventListener('focus', onFocus);
      textarea.addEventListener('blur', onBlur);
      const previousCleanup = domCleanupByEl.get(sticky);
      domCleanupByEl.set(sticky, () => {
        previousCleanup?.();
        textarea.removeEventListener('input', setHeight);
        textarea.removeEventListener('change', setHeight);
        textarea.removeEventListener('focus', onFocus);
        textarea.removeEventListener('blur', onBlur);
      });
    }

    function buildStickyDom(color: string) {
      const sticky = document.createElement('div');
      sticky.classList.add('stickynote');
      sticky.style.backgroundColor = color;

      const pinButton = document.createElement('button');
      pinButton.type = 'button';
      pinButton.classList.add('stickynote-pin');
      pinButton.hidden = true;
      const pinCount = document.createElement('span');
      pinCount.classList.add('stickynote-pin-count');
      pinButton.appendChild(pinCount);
      sticky.appendChild(pinButton);

      const textarea = document.createElement('textarea');
      textarea.maxLength = TEXT_MAX_LEN;
      textarea.classList.add('stickynote-text');
      sticky.appendChild(textarea);

      const authorLabel = document.createElement('span');
      authorLabel.classList.add('stickynote-author');
      sticky.appendChild(authorLabel);

      return { sticky, textarea, pinButton, pinCount };
    }

    function updatePinDisplay(sticky: HTMLElement, count: number, pinned: boolean) {
      const button = sticky.querySelector<HTMLButtonElement>('.stickynote-pin');
      const countLabel = sticky.querySelector<HTMLElement>('.stickynote-pin-count');
      if (!button || !countLabel) return;
      button.hidden = false;
      button.classList.toggle('is-pinned', pinned);
      button.classList.toggle('has-pins', count > 0);
      button.setAttribute('aria-pressed', String(pinned));
      button.setAttribute('aria-label', pinned ? `Bỏ ghim note (${count} lượt ghim)` : `Ghim note (${count} lượt ghim)`);
      button.title = pinned ? 'Bỏ ghim note' : 'Ghim note';
      countLabel.textContent = String(count);
    }

    function attachPinBehaviour(sticky: HTMLElement, pinButton: HTMLButtonElement) {
      async function onPinClick(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        const id = await resolveNoteId(sticky);
        if (id === undefined || pinButton.disabled) return;
        pinButton.disabled = true;
        try {
          const result = await toggleStickyNotePinAction(id);
          if (result.ok) updatePinDisplay(sticky, result.pinCount, result.pinned);
        } finally {
          pinButton.disabled = false;
        }
      }
      pinButton.addEventListener('click', onPinClick);
      const previousCleanup = domCleanupByEl.get(sticky);
      domCleanupByEl.set(sticky, () => {
        previousCleanup?.();
        pinButton.removeEventListener('click', onPinClick);
      });
    }

    // Note trắng trong chồng — chưa thuộc về ai, chưa tồn tại trên server. Chỉ khi được kéo
    // ra lần đầu (xem onDragEnd) mới thật sự tạo trên server, tác giả = người vừa kéo.
    function createBlankSticky(color: string) {
      const { sticky, textarea } = buildStickyDom(color);
      textarea.placeholder = PLACEHOLDER_DRAG_ME;
      board.appendChild(sticky);
      attachTextareaBehaviour(sticky, textarea);
      return sticky;
    }

    // Note đã tồn tại trên server (của mình hoặc của người khác) — dùng cho lần render đầu
    // (initialNotes) lẫn note mới/đổi vị trí phát hiện được qua polling (syncFromServer).
    function createServerSticky(note: StickyNote) {
      const { sticky, textarea, pinButton } = buildStickyDom(note.color);
      sticky.classList.add('used');
      sticky.dataset.noteId = String(note.id);
      sticky.dataset.ownerId = String(note.authorUserId);
      sticky.style.left = `${note.x}px`;
      sticky.style.top = `${note.y}px`;
      textarea.value = note.text;
      textarea.placeholder = PLACEHOLDER_WRITE_ON_ME;
      textarea.readOnly = note.authorUserId !== currentUserId;
      setAuthorLabel(sticky, note.authorName, note.authorTitle);
      updatePinDisplay(sticky, note.pinCount, note.pinnedByCurrentUser);
      board.appendChild(sticky);
      attachTextareaBehaviour(sticky, textarea);
      attachPinBehaviour(sticky, pinButton);
      elByNoteId.set(note.id, sticky);
      return sticky;
    }

    function spawnBlankStickies(count: number) {
      for (let i = 0; i < count; i++) {
        createBlankSticky(STICKY_COLORS[i % STICKY_COLORS.length]);
      }
    }

    function bindDraggableAll(elements: HTMLElement[]) {
      if (elements.length === 0) return;
      const instances = Draggable.create(elements, {
        type: 'x,y',
        bounds: board,
        onDragStart(this: Draggable) {
          const target = this.target as HTMLElement;
          InertiaPlugin.track(target, 'x');
          grabNoteAnimation(target);
          const textarea = target.querySelector<HTMLTextAreaElement>('.stickynote-text');
          if (textarea) textarea.placeholder = PLACEHOLDER_STICK_ME;
        },
        onDrag(this: Draggable) {
          const target = this.target as HTMLElement;
          const dx = InertiaPlugin.getVelocity(target, 'x');
          gsap.to(target, {
            rotation: dx * -0.003,
            duration: 0.5,
            ease: 'elastic.out(1.8, 0.6)',
          });
          if (canDelete(target) && isOverlapping(trash, target)) {
            target.style.border = 'solid 4px #d90429';
            target.style.borderRadius = '8px';
          } else {
            target.style.border = '';
            target.style.borderRadius = '';
          }
        },
        onDragEnd(this: Draggable) {
          const target = this.target as HTMLElement;
          releaseNoteAnimation(target);
          const textarea = target.querySelector<HTMLTextAreaElement>('.stickynote-text');
          const wasUsed = target.classList.contains('used');

          // Không phải chủ note (và không phải BGĐ) thì thả vào trash cũng không xoá được
          // — coi như trash "từ chối", note rớt lại bảng như thả ở chỗ bình thường.
          if (canDelete(target) && isOverlapping(trash, target)) {
            gsap.to(target, {
              scale: 0,
              ease: 'elastic.in(1, 0.8)',
              duration: 0.5,
              onComplete: async () => {
                const id = wasUsed ? await resolveNoteId(target) : undefined;
                removeSticky(target);
                if (id !== undefined) deleteStickyNoteAction(id).catch(() => {});
              },
            });
            return;
          }

          if (textarea) textarea.placeholder = PLACEHOLDER_WRITE_ON_ME;
          const boardRect = board.getBoundingClientRect();
          const rect = target.getBoundingClientRect();
          const x = rect.left - boardRect.left;
          const y = rect.top - boardRect.top;

          if (!wasUsed) {
            // Lần đầu kéo ra khỏi chồng note trắng — tạo note trên server, tác giả = mình.
            target.classList.add('used');
            target.dataset.ownerId = String(currentUserId);
            if (textarea) textarea.readOnly = false;
            const promise = createStickyNoteAction({
              x,
              y,
              color: target.style.backgroundColor,
              text: textarea ? textarea.value : '',
            });
            pendingCreateByEl.set(target, promise);
            promise
              .then((note) => {
                target.dataset.noteId = String(note.id);
                elByNoteId.set(note.id, target);
                pendingCreateByEl.delete(target);
                setAuthorLabel(target, note.authorName, note.authorTitle);
                updatePinDisplay(target, note.pinCount, note.pinnedByCurrentUser);
                const pinButton = target.querySelector<HTMLButtonElement>('.stickynote-pin');
                if (pinButton) attachPinBehaviour(target, pinButton);
              })
              .catch(() => {
                pendingCreateByEl.delete(target);
              });
          } else {
            // Di chuyển note đã có sẵn (của mình hoặc của người khác) — ai cũng làm được,
            // giống đẩy 1 note thật trên bảng ghim.
            resolveNoteId(target).then((id) => {
              if (id !== undefined) moveStickyNoteAction(id, x, y).catch(() => {});
            });
          }
        },
        dragClickables: false,
      });
      instances.forEach((inst) => draggableByEl.set(inst.target as HTMLElement, inst));
    }

    // Poll định kỳ để phản ánh note mới/di chuyển/xoá từ người khác — bỏ qua note đang được
    // chính người này kéo hoặc đang gõ dở để không giật tay/mất chữ đang gõ.
    async function syncFromServer() {
      // Đang có note vừa kéo ra khỏi chồng, request tạo trên server chưa kịp trả về id (nên
      // chưa nằm trong elByNoteId) — nếu poll ngay lúc này, note đó sẽ bị coi là "note mới của
      // người khác" và bị tạo trùng 1 bản DOM thứ hai (đè lên bản đang gõ dở, trông như giật
      // mất chữ). Bỏ qua nguyên lượt poll này, request tạo xong thì lượt sau lại đồng bộ bình thường.
      if (pendingCreateByEl.size > 0) return;

      let serverNotes: StickyNote[];
      try {
        serverNotes = await listStickyNotesAction();
      } catch {
        return;
      }

      const seenIds = new Set<number>();
      for (const note of serverNotes) {
        seenIds.add(note.id);
        const existing = elByNoteId.get(note.id);
        if (!existing) {
          bindDraggableAll([createServerSticky(note)]);
          continue;
        }

        const isBeingDragged = draggableByEl.get(existing)?.isDragging ?? false;
        if (!isBeingDragged) {
          // GSAP Draggable (type: 'x,y') di chuyển note bằng transform x/y chồng lên
          // left/top gốc, không phải bằng cách sửa trực tiếp left/top. Gán thẳng
          // style.left/top ở đây mà không reset x/y sẽ cộng dồn 2 lớp toạ độ (giật/nhảy
          // vị trí ở lần kéo tiếp theo) — gsap.set với x:0,y:0 giữ 2 lớp này khớp nhau.
          gsap.set(existing, { left: note.x, top: note.y, x: 0, y: 0 });
        }

        const textarea = existing.querySelector<HTMLTextAreaElement>('.stickynote-text');
        if (textarea && document.activeElement !== textarea && textarea.value !== note.text) {
          textarea.value = note.text;
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
        }
        updatePinDisplay(existing, note.pinCount, note.pinnedByCurrentUser);
      }

      for (const [id, el] of Array.from(elByNoteId.entries())) {
        if (!seenIds.has(id)) removeSticky(el);
      }
    }

    function handleTrashEnter() {
      const svg = trash.querySelector('svg');
      if (svg) gsap.to(svg, { scale: 0.8, y: '-=10' });
      gsap.to(resetLabel, { opacity: 1 });
    }
    function handleTrashLeave() {
      const svg = trash.querySelector('svg');
      if (svg) gsap.to(svg, { scale: 1, y: '+=10' });
      gsap.to(resetLabel, { opacity: 0 });
    }

    trash.addEventListener('mouseenter', handleTrashEnter);
    trash.addEventListener('mouseleave', handleTrashLeave);

    initialNotes.forEach((note) => createServerSticky(note));
    spawnBlankStickies(NUM_STICKIES);
    bindDraggableAll(Array.from(board.querySelectorAll<HTMLElement>('.stickynote')));

    const pollId = window.setInterval(syncFromServer, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(pollId);
      trash.removeEventListener('mouseenter', handleTrashEnter);
      trash.removeEventListener('mouseleave', handleTrashLeave);
      Array.from(draggableByEl.keys()).forEach(removeSticky);
    };
    // initialNotes chỉ dùng cho lần render đầu (seed danh sách note) — polling tự tiếp quản
    // đồng bộ sau đó, thêm nó vào deps sẽ chỉ khiến effect chạy lại không cần thiết mỗi khi
    // Next.js trả về 1 mảng mới cho cùng nội dung.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, canModerate]);

  return (
    <div ref={boardRef} className="sticky-board-widget">
      <div className="sticky-board-title">
        <p className="sticky-board-eyebrow">Góc ghi chú chung</p>
        <h2 className="sticky-board-heading">
          Note lại một điều bạn muốn gửi gắm, một lời chúc, một ước mong, hay chỉ một lời chào.
        </h2>
        <div className="sticky-board-title-divider" aria-hidden="true" />
      </div>

      <div ref={trashRef} className="sticky-board-trash">
        <span ref={resetRef} className="sticky-board-reset">
          XÓA
        </span>
        <svg viewBox="0 0 448 512">
          <title>Kéo note vào đây để xoá</title>
          <path d="M32 464a48 48 0 0 0 48 48h288a48 48 0 0 0 48-48V128H32zm272-256a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zm-96 0a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zm-96 0a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zM432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16z" />
        </svg>
      </div>
    </div>
  );
}
