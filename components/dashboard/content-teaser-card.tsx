import Link from 'next/link';
import Image, { type StaticImageData } from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { PolicyRule } from '@/lib/content';
import CurvedScrollList from '@/components/dashboard/curved-scroll-list';
import { severityStyles } from '@/components/dashboard/policy-card';

interface HighlightGroup {
  heading: string;
  items: PolicyRule[];
}

interface ContentTeaserCardProps {
  /** Có cả 2 thì mới hiện CTA — dùng khi thẻ chỉ là bản rút gọn, còn nội dung đầy đủ nằm ở trang riêng. */
  href?: string;
  ctaLabel?: string;
  image: StaticImageData;
  category: string;
  accent: string;
  accentActive: string;
  date: string;
  title: string;
  intro: string;
  highlights?: HighlightGroup[];
  /** Ghi chú cuối bài (vd. Chính sách) — hiển thị dưới cùng, trước CTA. */
  notes?: string[];
}

function HighlightRule({ rule, accent }: { rule: PolicyRule; accent: string }) {
  const s = severityStyles(rule.severity);
  const Icon = s.icon;
  return (
    <li className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
      {rule.severity ? (
        <Icon size={16} strokeWidth={2.25} className={`mt-0.5 shrink-0 ${s.dot}`} aria-hidden="true" />
      ) : (
        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: accent }} aria-hidden="true" />
      )}
      <div className="flex-1">
        <span>{rule.text}</span>
        {rule.penalty && (
          <span className={`mt-1.5 block w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${s.badge}`}>
            {rule.penalty}
          </span>
        )}
      </div>
    </li>
  );
}

/** Thẻ giới thiệu 1 bài SOP/Chính sách — cuộn dọc độc lập trong thẻ bo góc, xem CurvedScrollList. */
export default function ContentTeaserCard({
  href,
  ctaLabel,
  image,
  category,
  accent,
  accentActive,
  date,
  title,
  intro,
  highlights,
  notes,
}: ContentTeaserCardProps) {
  return (
    <CurvedScrollList maxHeight={440} thumbColor={accent} thumbActiveColor={accentActive}>
      <div className="flex flex-col gap-3 px-4 py-4 sm:px-5 sm:py-5 min-[1025px]:gap-4 min-[1025px]:px-6 min-[1025px]:py-6">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>
          {category}
          <span className="ml-2 normal-case tracking-normal text-muted/70">· {date}</span>
        </p>
        <h3 className="font-heading text-balance text-lg font-medium text-navy min-[1025px]:text-xl">{title}</h3>
        <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg sm:h-32 min-[1025px]:h-36">
          <Image src={image} alt="" fill sizes="360px" className="object-cover" />
        </div>
        <p className="text-xs leading-relaxed text-muted min-[1025px]:text-sm">{intro}</p>
        {highlights?.map((group) => (
          <div key={group.heading}>
            <p className="font-heading text-xs font-semibold uppercase tracking-wide text-navy/70">{group.heading}</p>
            <ul className="mt-2 flex flex-col gap-3">
              {group.items.map((item, i) => (
                <HighlightRule key={i} rule={item} accent={accent} />
              ))}
            </ul>
          </div>
        ))}
        {notes && notes.length > 0 && (
          <ul className="flex flex-col gap-1.5 border-t border-navy/10 pt-4">
            {notes.map((note, i) => (
              <li key={i} className="text-xs leading-relaxed text-muted">
                {note}
              </li>
            ))}
          </ul>
        )}
        {href && ctaLabel && (
          <Link
            href={href}
            className="mt-auto inline-flex w-fit items-center gap-1.5 text-sm font-medium text-blue transition-colors hover:text-navy"
          >
            {ctaLabel}
            <ArrowUpRight size={14} strokeWidth={2.5} aria-hidden="true" />
          </Link>
        )}
      </div>
    </CurvedScrollList>
  );
}
