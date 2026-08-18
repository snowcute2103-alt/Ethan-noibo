import { ShieldAlert } from 'lucide-react';
import type { RuleDocument, SopSection, SopTable } from '@/lib/content';

function Table({ table }: { table: SopTable }) {
  return (
    <div className="mt-5 overflow-x-auto border border-navy/15">
      <table className="w-full min-w-[560px] border-collapse text-left text-[15px]">
        <thead>
          <tr className="bg-navy">
            {table.headers.map((h) => (
              <th
                key={h}
                className="font-heading whitespace-nowrap border-b border-navy px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-cyan"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className="odd:bg-white even:bg-surface-2/60">
              {row.map((cell, j) => (
                <td key={j} className="border-b border-navy/10 px-5 py-3.5 align-top text-ink">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ section, index }: { section: SopSection; index: number }) {
  return (
    <section id={section.id} className="scroll-mt-28 border-t-2 border-navy py-20 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-7 sm:gap-10">
        <span className="font-heading select-none text-6xl font-light leading-none text-navy/15 sm:text-7xl">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="font-heading text-2xl font-medium tracking-wide leading-tight text-navy sm:text-3xl">
            {section.title}
          </h4>
          {section.paragraphs?.map((p, i) => (
            <p key={i} className="mt-5 max-w-prose text-base leading-relaxed text-ink">
              {p}
            </p>
          ))}
          {section.table && <Table table={section.table} />}
          {section.bullets && (
            <ul className="mt-6 flex flex-col gap-3.5">
              {section.bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-base leading-relaxed text-ink">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-blue" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default function SopDocumentView({ doc }: { doc: RuleDocument }) {
  return (
    <article>
      <header className="border-b-4 border-navy pb-10">
        <p className="font-heading text-sm font-medium uppercase tracking-[0.3em] text-blue">
          Tài liệu SOP · v{doc.version}
        </p>
        <h3 className="mt-4 font-heading text-[clamp(2.75rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-wide text-navy">
          {doc.title}
        </h3>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{doc.subtitle}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="border border-navy/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy">
            {doc.effectiveDate}
          </span>
          <span className="border border-gold-2 bg-[#FFF8EA] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy">
            {doc.status}
          </span>
          <span className="border border-navy/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy">
            Quyền đọc riêng — BGĐ cấp
          </span>
        </div>
      </header>

      <div className="my-20 flex items-start gap-6 border-2 border-navy bg-navy px-8 py-10 text-white sm:px-12 sm:py-12">
        <ShieldAlert size={32} strokeWidth={2} className="mt-0.5 shrink-0 text-gold-2" aria-hidden="true" />
        <div>
          <p className="font-heading text-xl font-medium tracking-wide text-white">{doc.goldenRule.title}</p>
          <ul className="mt-5 flex flex-col gap-3">
            {doc.goldenRule.points.map((pt, i) => (
              <li key={i} className="text-base leading-relaxed text-white/80">
                {pt}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        {doc.sections.map((s, i) => (
          <Section key={s.id} section={s} index={i} />
        ))}
      </div>
    </article>
  );
}
