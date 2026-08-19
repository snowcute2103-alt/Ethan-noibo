import Link from 'next/link';
import Image, { type StaticImageData } from 'next/image';
import { ArrowUpRight } from 'lucide-react';

interface FeedCardProps {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  image: StaticImageData;
  accent: string;
  date?: string;
  featured?: boolean;
  index?: number;
}

export default function FeedCard({
  href,
  eyebrow,
  title,
  description,
  image,
  accent,
  date,
  featured = false,
  index = 0,
}: FeedCardProps) {
  return (
    <Link
      href={href}
      style={{ '--accent': accent, animationDelay: `${index * 90}ms` } as React.CSSProperties}
      className={`animate-fade-up group relative flex cursor-pointer flex-col justify-end overflow-hidden border border-[#e0e7f3] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-20px_rgba(26,39,69,0.45)] focus-visible:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--accent)]/30 ${
        featured ? 'min-h-[560px] sm:col-span-2 sm:min-h-[720px]' : 'min-h-[500px] sm:min-h-[600px]'
      }`}
    >
      <Image
        src={image}
        alt=""
        fill
        sizes={featured ? '100vw' : '(min-width: 640px) 50vw, 100vw'}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Lớp phủ đen mờ để chữ trắng đọc được trên mọi ảnh, đậm dần về phía đáy thẻ nơi đặt chữ. */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/75 to-navy/10" aria-hidden="true" />

      {date && (
        <span
          className="absolute right-4 top-4 z-10 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide shadow-sm"
          style={{ color: accent }}
        >
          {date}
        </span>
      )}

      <span
        className="absolute inset-x-0 bottom-0 z-10 h-1 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
        style={{ background: accent }}
        aria-hidden="true"
      />

      <div className={`relative z-10 ${featured ? 'p-8 sm:p-16' : 'p-6 sm:p-12'}`}>
        <p
          className={`font-heading font-medium uppercase tracking-[0.25em] ${featured ? 'text-base' : 'text-sm'}`}
          style={{ color: accent }}
        >
          {eyebrow}
        </p>
        <h3
          className={`font-heading mt-4 font-medium tracking-wide text-white ${featured ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-4xl'}`}
        >
          {title}
        </h3>
        <p
          className={`mt-5 leading-relaxed text-white/80 ${featured ? 'line-clamp-3 max-w-xl text-lg sm:text-xl' : 'line-clamp-2 text-base sm:text-lg'}`}
        >
          {description}
        </p>

        <div className="mt-8 flex items-center gap-2 text-base font-semibold text-white">
          Xem chi tiết
          <ArrowUpRight
            size={18}
            strokeWidth={2.5}
            className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  );
}
