import Link from 'next/link';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';

interface HubCardProps {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  count?: number;
  featured?: boolean;
  index?: number;
}

export default function HubCard({
  href,
  eyebrow,
  title,
  description,
  icon: Icon,
  accent,
  count,
  featured = false,
  index = 0,
}: HubCardProps) {
  return (
    <Link
      href={href}
      style={{ '--accent': accent, animationDelay: `${index * 90}ms` } as React.CSSProperties}
      className={`animate-fade-up group relative flex cursor-pointer flex-col justify-between overflow-hidden border border-[#e0e7f3] bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-[color:var(--accent)]/50 hover:shadow-[0_24px_48px_-20px_rgba(26,39,69,0.28)] focus-visible:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--accent)]/30 ${
        featured
          ? 'min-h-[420px] p-10 sm:col-span-2 sm:p-12 lg:col-span-2 lg:row-span-2 lg:min-h-full'
          : 'min-h-[280px] p-8 sm:p-10 lg:min-h-[280px]'
      }`}
    >
      <span
        className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
        style={{ background: accent }}
        aria-hidden="true"
      />
      <div
        className={`absolute -right-10 -top-10 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-125 ${
          featured ? 'h-56 w-56' : 'h-40 w-40'
        }`}
        style={{ background: accent }}
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between">
        <div
          className={`flex items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${
            featured ? 'h-20 w-20' : 'h-16 w-16'
          }`}
          style={{ background: `${accent}1A` }}
        >
          <Icon size={featured ? 34 : 28} strokeWidth={2} style={{ color: accent }} aria-hidden="true" />
        </div>
        {typeof count === 'number' && (
          <span
            className="rounded-full px-3 py-1.5 text-sm font-semibold uppercase tracking-wide"
            style={{ background: `${accent}1A`, color: accent }}
          >
            {count} mục
          </span>
        )}
      </div>

      <div className="relative mt-10">
        <p className="font-heading text-sm font-medium uppercase tracking-[0.2em] text-muted">{eyebrow}</p>
        <h3
          className={`font-heading mt-3 font-medium tracking-wide text-navy ${featured ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'}`}
        >
          {title}
        </h3>
        <p className={`mt-4 leading-relaxed text-muted ${featured ? 'max-w-md text-base' : 'max-w-sm text-base'}`}>
          {description}
        </p>
      </div>

      <div className="relative mt-10 flex items-center gap-2 text-base font-semibold" style={{ color: accent }}>
        Xem chi tiết
        <ArrowUpRight
          size={18}
          strokeWidth={2.5}
          className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
