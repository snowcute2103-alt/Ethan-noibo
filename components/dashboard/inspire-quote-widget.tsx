'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Sparkles, X } from 'lucide-react';
import { createQuoteAction } from '@/app/dashboard/actions';
import { QUOTES_SEED } from '@/lib/content/quotes-seed';
import type { Quote } from '@/lib/quotes';

interface InspireQuoteWidgetProps {
  initialQuotes: Quote[];
}

interface DisplayQuote {
  text: string;
  author: string;
  img: string;
}

const BACKGROUND_VIDEO_SRC = '/images/inspire/vid3.mp4';
const DAILY_KEY = 'inspire_daily_v1';
const PARTICLE_COUNT = 20;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Hash chuỗi ngày -> số nguyên dương, dùng để chọn câu "cố định trong ngày" không cần server. */
function hashDay(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function addRipple(e: React.MouseEvent<HTMLButtonElement>) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const span = document.createElement('span');
  span.className = 'animate-inspire-ripple pointer-events-none absolute rounded-full bg-white/35';
  span.style.width = `${size}px`;
  span.style.height = `${size}px`;
  span.style.left = `${e.clientX - rect.left - size / 2}px`;
  span.style.top = `${e.clientY - rect.top - size / 2}px`;
  btn.appendChild(span);
  span.addEventListener('animationend', () => span.remove());
}

/** Thẻ "Câu nói ngẫu nhiên" — mang qua từ widget đứng riêng (well-known/index.html), thu gọn vào
 *  1 khung bên phải khối "5 giá trị cốt lõi" thay vì chiếm trọn trang: nền video cố định,
 *  particle + cursor trail + hiệu ứng gõ chữ chỉ hoạt động trong phạm vi khung này. */
export default function InspireQuoteWidget({ initialQuotes }: InspireQuoteWidgetProps) {
  const [customQuotes, setCustomQuotes] = useState<Quote[]>(initialQuotes);
  const [current, setCurrent] = useState<DisplayQuote>({ text: '', author: '', img: '' });
  const [typedText, setTypedText] = useState('');
  const [fading, setFading] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [formContent, setFormContent] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastIndexRef = useRef(-1);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reducedMotionRef = useRef(false);

  const allQuotes = useMemo<DisplayQuote[]>(
    () => [
      ...QUOTES_SEED.map((q) => ({ text: q.text, author: q.author, img: '' })),
      ...customQuotes.map((q) => ({ text: q.content, author: q.author, img: q.imgUrl ?? '' })),
    ],
    [customQuotes]
  );

  function startTypewriter(text: string) {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    if (reducedMotionRef.current) {
      setTypedText(text);
      return;
    }
    setTypedText('');
    let i = 0;
    const speed = Math.max(18, Math.min(38, 2200 / Math.max(text.length, 1)));
    typingTimerRef.current = setInterval(() => {
      i += 1;
      setTypedText(text.slice(0, i));
      if (i >= text.length && typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    }, speed);
  }

  function revealQuote(next: DisplayQuote) {
    setFading(true);
    window.setTimeout(
      () => {
        setFading(false);
        setCurrent(next);
        setFlashKey((k) => k + 1);
        startTypewriter(next.text);
      },
      reducedMotionRef.current ? 0 : 300
    );
  }

  function pickRandom() {
    const list = allQuotes;
    if (list.length === 0) return;
    let i: number;
    do {
      i = Math.floor(Math.random() * list.length);
    } while (i === lastIndexRef.current && list.length > 1);
    lastIndexRef.current = i;
    revealQuote(list[i]);
  }

  // Chọn câu "của ngày hôm nay" 1 lần khi mount — lặp lại đúng câu đó nếu load lại trang trong ngày.
  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const list = allQuotes;
    if (list.length === 0) return;
    const today = todayStr();
    let saved: { date: string; idx: number } | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(DAILY_KEY) || 'null');
    } catch {
      saved = null;
    }
    if (saved && saved.date === today && saved.idx < list.length) {
      lastIndexRef.current = saved.idx;
      revealQuote(list[saved.idx]);
    } else {
      const prevIdx = saved ? saved.idx : -1;
      let i = hashDay(today) % list.length;
      if (i === prevIdx && list.length > 1) i = (i + 1) % list.length;
      lastIndexRef.current = i;
      try {
        localStorage.setItem(DAILY_KEY, JSON.stringify({ date: today, idx: i }));
      } catch {
        /* localStorage có thể bị chặn (chế độ riêng tư) — bỏ qua, không ảnh hưởng hiển thị. */
      }
      revealQuote(list[i]);
    }
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Particle trôi nhẹ trong phạm vi khung — canvas co giãn theo kích thước card, không phủ toàn trang.
  useEffect(() => {
    const canvas = canvasRef.current;
    const card = cardRef.current;
    if (!canvas || !card || reducedMotionRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random() * 1.8,
      speed: 0.00012 + Math.random() * 0.00022,
      angle: Math.random() * Math.PI * 2,
      drift: -0.0004 + Math.random() * 0.0008,
      opacity: 0.1 + Math.random() * 0.35,
      opDir: Math.random() > 0.5 ? 0.002 : -0.002,
    }));

    function resize() {
      if (!card) return;
      width = canvas!.width = card.clientWidth;
      height = canvas!.height = card.clientHeight;
    }
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(card);

    let raf = 0;
    function draw() {
      ctx!.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.angle += p.drift;
        p.x += Math.cos(p.angle) * p.speed;
        p.y -= p.speed * 0.7;
        if (p.y < -0.02) p.y = 1.02;
        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02) p.x = -0.02;
        p.opacity += p.opDir;
        if (p.opacity > 0.45 || p.opacity < 0.08) p.opDir *= -1;
        ctx!.beginPath();
        ctx!.arc(p.x * width, p.y * height, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(130,196,248,${p.opacity})`;
        ctx!.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  function openModal() {
    setFormContent('');
    setFormAuthor('');
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave() {
    const content = formContent.trim();
    const author = formAuthor.trim() || 'Khuyết danh';
    if (content.length < 3) {
      setFormError('Câu hơi ngắn, viết thêm chút nhé.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const saved = await createQuoteAction({ content, author });
      setCustomQuotes((prev) => [...prev, saved]);
      setModalOpen(false);
      lastIndexRef.current = -1;
      revealQuote({ text: saved.content, author: saved.author, img: saved.imgUrl ?? '' });
    } catch {
      setFormError('Lưu thất bại, thử lại nhé.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        ref={cardRef}
        className="relative flex h-full min-h-[580px] w-full flex-col overflow-hidden border border-white/15 bg-navy-deep shadow-[0_28px_80px_-36px_rgba(0,210,255,0.45)] sm:min-h-[700px] lg:min-h-[760px] xl:min-h-[820px]"
      >
        <div className="absolute inset-0 z-0 bg-navy-deep" aria-hidden="true" />
        <video
          className="absolute inset-0 z-0 h-full w-full object-cover opacity-45"
          autoPlay
          muted
          loop
          playsInline
          src={BACKGROUND_VIDEO_SRC}
        />
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-navy-deep/75 via-navy-deep/45 to-navy-deep/90" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-3 z-[2] border border-white/10" aria-hidden="true" />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-[2]" aria-hidden="true" />
        <div
          key={flashKey}
          className="animate-inspire-glow pointer-events-none absolute inset-0 z-[4]"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,210,255,.18), transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12 text-center sm:px-14 sm:py-16">
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px w-8 bg-gold-2/60" />
            <span className="h-1.5 w-1.5 rotate-45 bg-gold-2" />
            <span className="h-px w-8 bg-gold-2/60" />
          </div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.28em] text-cyan">
            Thông điệp ngẫu nhiên dành cho bạn
          </p>

          <div className="flex min-h-[170px] max-w-2xl flex-col items-center justify-center">
            {current.img && (
              <img
                src={current.img}
                alt=""
                className="animate-inspire-img-in mb-4 max-h-40 max-w-full rounded object-contain shadow-xl"
              />
            )}
            <span className="font-heading text-6xl leading-[0.65] text-gold-2/55" aria-hidden="true">
              &ldquo;
            </span>
            <p
              className={`mt-4 text-pretty text-xl font-medium leading-relaxed text-white transition-opacity duration-300 sm:text-[1.7rem] ${fading ? 'opacity-0' : 'opacity-100'}`}
              aria-live="polite"
            >
              {typedText}
              <span className="animate-inspire-blink ml-0.5 inline-block" aria-hidden="true">
                |
              </span>
            </p>
            <p
              className={`mt-4 text-sm font-medium text-white/75 transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}
            >
              {current.author && `— ${current.author}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                addRipple(e);
                pickRandom();
              }}
              className="relative flex min-h-11 cursor-pointer items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-gold-2 to-gold px-6 py-3 text-sm font-semibold text-navy-deep shadow-[0_10px_30px_-8px_rgba(245,166,35,0.55)] transition duration-200 hover:brightness-105 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
            >
              <Sparkles size={15} strokeWidth={2.5} aria-hidden="true" />
              Cho tôi một câu
            </button>
            <button
              type="button"
              onClick={(e) => {
                addRipple(e);
                openModal();
              }}
              className="relative flex min-h-11 cursor-pointer items-center gap-2 overflow-hidden rounded-full border border-white/30 bg-navy-deep/35 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:border-cyan/70 hover:bg-white/10 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
            >
              <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
              Thêm câu
            </button>
          </div>
        </div>
      </div>

      {modalOpen &&
        createPortal(
          <div
            role="presentation"
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/50 p-4 backdrop-blur-[2px]"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Thêm câu nói"
              onClick={(e) => e.stopPropagation()}
              className="animate-inspire-pop w-full max-w-md border border-white/10 bg-[#1c1410] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-heading text-lg font-light uppercase tracking-wide text-white">Thêm câu của bạn</h2>
                  <p className="mt-0.5 text-xs text-white/50">Câu sẽ xuất hiện trong vòng quay chung của mọi người.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Đóng"
                  className="shrink-0 border border-white/15 p-1.5 text-white/60 transition hover:border-white/40 hover:text-white"
                >
                  <X size={16} strokeWidth={2.25} aria-hidden="true" />
                </button>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                <div>
                  <label htmlFor="quote-content" className="mb-1.5 block text-xs text-cyan/80">
                    Nội dung câu nói
                  </label>
                  <textarea
                    id="quote-content"
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="VD: Tôi đã tìm thấy lối thoát trong công việc: thoát vị đĩa đệm."
                    className="min-h-[80px] w-full resize-y border border-white/15 bg-black/25 px-3.5 py-3 text-sm text-white outline-none transition focus:border-cyan"
                  />
                </div>
                <div>
                  <label htmlFor="quote-author" className="mb-1.5 block text-xs text-cyan/80">
                    Tác giả (không bắt buộc)
                  </label>
                  <input
                    id="quote-author"
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="1 nhà hiền triết trong Ethan Ecom"
                    className="w-full border border-white/15 bg-black/25 px-3.5 py-3 text-sm text-white outline-none transition focus:border-cyan"
                  />
                </div>
                {formError && <p className="text-xs text-gold-2">{formError}</p>}
                <div className="mt-1 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                    className="bg-gradient-to-r from-gold-2 to-gold px-5 py-2 text-sm font-semibold text-navy-deep transition hover:brightness-105 disabled:opacity-60"
                  >
                    {saving ? 'Đang lưu…' : 'Lưu câu'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
