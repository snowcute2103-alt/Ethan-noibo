'use client';

import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Image, { type StaticImageData } from 'next/image';
import { ChevronsRight, Lock, ShieldAlert, X } from 'lucide-react';
import type { RuleDocument, SopSection, SopTable } from '@/lib/content';
import FromBgdBadge from '@/components/dashboard/from-bgd-badge';
import Reveal from '@/components/reveal';

gsap.registerPlugin(SplitText, ScrollTrigger);

/** Tìm "Phần N" trong text của ô bảng và biến thành chú thích nội tuyến — bấm nhảy tới đúng Phần N trong cùng bài
 *  (xem .inline-footnote-ref trong globals.css). Chỉ áp cho ô bảng, không áp cho đoạn văn/gạch đầu dòng — đây là
 *  nơi duy nhất trong dữ liệu SOP có tham chiếu chéo dạng "Phần N" rõ ràng (vd. cột "Kiểm ở đâu"). */
function linkifyPartRefs(text: string, sections: SopSection[]): React.ReactNode {
  const parts = text.split(/(Phần\s+\d+)/g);
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    const m = part.match(/^Phần\s+(\d+)$/);
    const targetIndex = m ? Number(m[1]) - 1 : -1;
    const targetId = sections[targetIndex]?.id;
    if (!m || !targetId) return <span key={i}>{part}</span>;

    return (
      <a
        key={i}
        href={`#${targetId}`}
        data-label="Phần"
        data-number={m[1]}
        className="inline-footnote-ref"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      >
        {part}
      </a>
    );
  });
}

function Table({ table, sections }: { table: SopTable; sections: SopSection[] }) {
  const twoCols = table.headers.length <= 2;
  return (
    <div className="mt-4 flex flex-col gap-3">
      {table.rows.map((row, i) => (
        <div
          key={i}
          className="card-glow border-l-2 border-l-navy bg-[#fbf9f2] p-4"
          style={{ '--glow-color': 'rgba(26, 39, 69, 0.14)' } as React.CSSProperties}
        >
          <div className={`grid grid-cols-1 gap-x-6 gap-y-3 ${twoCols ? '' : 'sm:grid-cols-2'}`}>
            {row.map((cell, j) => (
              <div key={j}>
                <p className="font-heading text-[10px] font-bold uppercase tracking-wider text-navy/50">
                  {table.headers[j]}
                </p>
                <p className="mt-1 font-heading text-[13px] leading-[1.55] text-ink">
                  {linkifyPartRefs(cell, sections)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Trong popup, mọi mục hiện sẵn toàn bộ nội dung, đọc liền mạch từ trên xuống như 1 trang báo — không còn mục lục nhảy nhanh.
 *  Trình bày kiểu tản văn báo chí (phỏng theo bố cục "Tappable Stories" của mark_sottek): tít mục nhỏ, gọn, chữ hoa
 *  cách đều thay vì tít lớn kiểu manchette; đoạn văn thân bài chạy serif khổ lớn, thoáng dòng. Đoạn văn đầu tài liệu
 *  có chữ hoa thụt đầu dòng (drop cap), mục có từ 2 đoạn văn trở lên chạy 2 cột kiểu cột báo (xem .nyt-columns trong
 *  globals.css). Mỗi mục tự fade-up khi cuộn tới (Reveal) thay vì hiện cứng ngay lúc mở popup. Có id để chú thích
 *  nội tuyến "Phần N" trong bảng (xem linkifyPartRefs) nhảy tới đúng chỗ. */
function SectionBlock({
  section,
  index,
  isFirstSection,
  sections,
}: {
  section: SopSection;
  index: number;
  isFirstSection: boolean;
  sections: SopSection[];
}) {
  const paragraphs = section.paragraphs ?? [];
  const useColumns = paragraphs.length >= 2;
  const numberLabel = String(index + 1).padStart(2, '0');

  return (
    <div id={section.id} className="scroll-mt-24 border-t border-[#d8d0be] pt-6">
      <h5 className="font-heading text-xs font-black uppercase tracking-[0.08em] text-navy">
        <span className="text-navy/35">{numberLabel} · </span>
        {section.title}
      </h5>

      {paragraphs.length > 0 &&
        (useColumns ? (
          <div className="nyt-columns mt-3 font-heading text-[14px] leading-[1.65] text-ink">
            {paragraphs.map((p, i) => (
              <p key={i} className="mb-3">
                {p}
              </p>
            ))}
          </div>
        ) : (
          <div className="mt-3">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className={`font-heading text-[14px] leading-[1.65] text-ink ${i > 0 ? 'mt-3' : ''}`}
              >
                {p}
              </p>
            ))}
          </div>
        ))}

      {section.table && <Table table={section.table} sections={sections} />}

      {section.bullets && (
        <ul className="mt-3 flex flex-col gap-0.5">
          {section.bullets.map((b, i) => (
            <li
              key={i}
              className="-mx-2 flex gap-2 rounded-md px-2 py-1.5 font-heading text-[14px] leading-[1.6] text-ink transition-colors hover:bg-[#f7f3e8]"
            >
              <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-navy" aria-hidden="true">
                <span className="sr-only">•</span>
              </span>
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SopDocumentView({ doc, image }: { doc: RuleDocument; image: StaticImageData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const article = articleRef.current;
      if (!article || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const targets = Array.from(article.querySelectorAll<HTMLElement>('.sop-write-text'));
      const splits = targets.map((target) => new SplitText(target, { type: 'chars' }));
      const characterGroups = splits.map((split) => split.chars);
      gsap.set(characterGroups.flat(), { opacity: 0 });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: article,
          start: 'top 72%',
          once: true,
        },
      });

      characterGroups.forEach((characters, index) => {
        timeline.to(
          characters,
          {
            opacity: 1,
            duration: 0.04,
            stagger: 0.028,
            ease: 'none',
          },
          index === 0 ? 0 : '>-0.02'
        );
      });

      return () => {
        timeline.kill();
        splits.forEach((split) => split.revert());
      };
    },
    { scope: articleRef }
  );

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  function toggleReadingMode() {
    setShowDetails((current) => !current);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <article
        ref={articleRef}
        id={doc.id}
        className="scroll-mt-24 border-t-2 border-navy pt-12 first:border-t-0 first:pt-0"
      >
        <button
          type="button"
          onClick={() => {
            setShowDetails(false);
            setIsOpen(true);
          }}
          aria-haspopup="dialog"
          className="group flex w-full flex-col gap-6 text-left sm:flex-row sm:items-start"
        >
          <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-surface-2 sm:w-72">
            <Image src={image} alt={doc.title} fill sizes="(min-width: 640px) 288px, 100vw" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="sop-write-text font-heading text-xs font-bold uppercase tracking-[0.3em] text-navy/60">
              Tài liệu SOP · v{doc.version}
            </p>
            <h3 className="sop-write-text mt-3 font-serif text-[clamp(1.35rem,2.4vw,2rem)] font-bold leading-[1.1] tracking-tight text-navy group-hover:underline">
              {doc.title}
            </h3>
            <p className="sop-write-text mt-3 font-serif italic leading-relaxed text-muted">{doc.subtitle}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <FromBgdBadge />
              <span className="border border-cyan/50 bg-cyan/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy">
                {doc.effectiveDate}
              </span>
              <span className="border border-gold-2 bg-[#FFF4D6] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy">
                {doc.status}
              </span>
              <span className="flex items-center gap-1.5 border border-blue-cta/40 bg-blue-cta/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-cta">
                <Lock size={12} strokeWidth={2.5} aria-hidden="true" />
                Quyền đọc riêng — BGĐ cấp
              </span>
            </div>
          </div>
        </button>
      </article>

      {isOpen && (
        <div role="presentation" onClick={() => setIsOpen(false)} className="fixed inset-0 z-[100]">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={doc.title}
            onClick={(e) => e.stopPropagation()}
            className="animate-nyt-panel-in fixed inset-y-0 left-0 flex h-full w-full flex-col overflow-hidden border-r-2 border-navy bg-[#f7f3e8] shadow-[24px_0_60px_-24px_rgba(16,26,48,0.45)] sm:w-1/2 sm:min-w-[480px] lg:max-w-[820px]"
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng"
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center border border-navy/15 bg-white text-navy/70 shadow-sm transition hover:border-navy hover:text-navy sm:right-6 sm:top-6"
            >
              <X size={18} strokeWidth={2.25} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={toggleReadingMode}
              aria-label={showDetails ? 'Quay lại phần tổng quan' : 'Xem nội dung quy trình'}
              aria-pressed={showDetails}
              title={showDetails ? 'Quay lại tổng quan' : 'Xem nội dung quy trình'}
              className="group absolute right-4 top-1/2 z-20 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-navy text-white shadow-[0_12px_30px_rgba(16,26,48,0.3)] transition duration-300 hover:scale-110 hover:bg-blue-cta focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/25 sm:right-6"
            >
              <ChevronsRight
                size={28}
                strokeWidth={2.8}
                className={`transition-transform duration-700 ease-in-out ${showDetails ? 'rotate-180' : 'rotate-0'}`}
                aria-hidden="true"
              />
            </button>

            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              <div className="px-8 pb-10 pt-14 sm:px-12 sm:pb-12 sm:pt-16">
                <div className="mx-auto max-w-[820px]">
                  <div className={`sop-reading-stage ${showDetails ? 'sop-reading-stage--details' : ''}`}>
                    <div className="sop-reading-overview">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-gold">
                      Tài liệu SOP · v{doc.version}
                    </p>
                    <FromBgdBadge />
                  </div>

                  <h3 className="mt-3 font-heading text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[0.98] tracking-tight text-navy">
                    {doc.title}
                  </h3>
                  <p className="mt-3 max-w-[38rem] font-heading text-[15px] leading-[1.55] text-[#6d675d]">
                    {doc.subtitle}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-y border-[#d8d0be] py-2.5 font-heading text-[10px] font-semibold uppercase tracking-wider text-[#6d675d]">
                    <span>{doc.effectiveDate}</span>
                    <span aria-hidden="true" className="text-[#d8d0be]">
                      ·
                    </span>
                    <span>{doc.status}</span>
                    <span aria-hidden="true" className="text-[#d8d0be]">
                      ·
                    </span>
                    <span className="inline-flex items-center gap-1 text-blue-cta">
                      <Lock size={11} strokeWidth={2.5} aria-hidden="true" />
                      Quyền đọc riêng — BGĐ cấp
                    </span>
                  </div>

                  <figure className="mt-6">
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#efe9da]">
                      <Image
                        src={image}
                        alt={doc.title}
                        fill
                        sizes="(min-width: 1024px) 820px, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <figcaption className="mt-2 font-serif text-xs italic leading-snug text-[#6d675d]">
                      Ảnh minh hoạ · {doc.subtitle}
                    </figcaption>
                  </figure>

                  {doc.goldenRule && (
                    <Reveal>
                      <div className="relative mt-8 flex items-start gap-4 overflow-hidden border-2 border-navy bg-navy px-6 py-7 text-white sm:px-8 sm:py-8">
                        <div className="glow-orb -right-10 -top-10 h-48 w-48 bg-gold-2/20" aria-hidden="true" />
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-2/40 bg-gold-2/20">
                          <ShieldAlert size={20} strokeWidth={2} className="text-gold-2" aria-hidden="true" />
                        </div>
                        <div className="relative min-w-0">
                          <span
                            className="pointer-events-none absolute -left-2 -top-6 select-none font-serif text-[4.5rem] leading-none text-gold-2/25"
                            aria-hidden="true"
                          >
                            &ldquo;
                          </span>
                          <p className="relative font-serif text-base italic font-medium leading-[1.45] text-white sm:text-lg">
                            {doc.goldenRule.title}
                          </p>
                          <ul className="relative mt-3 flex flex-col gap-2">
                            {doc.goldenRule.points.map((pt, i) => (
                              <li key={i} className="font-heading text-[13px] leading-[1.55] text-white/80">
                                {pt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Reveal>
                  )}

                    </div>

                    <div className="sop-reading-details">
                      <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-blue">
                        Nội dung quy trình · {doc.sections.length} phần
                      </p>
                      <h3 className="mt-3 max-w-[38rem] font-heading text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-[1.05] tracking-tight text-navy">
                        {doc.title}
                      </h3>
                      <div className="gradient-divider mt-4 w-20" aria-hidden="true" />

                      <div className="mt-7 flex flex-col gap-7">
                        {doc.sections.map((section, i) => (
                          <Reveal key={section.id}>
                            <SectionBlock section={section} index={i} isFirstSection={i === 0} sections={doc.sections} />
                          </Reveal>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
