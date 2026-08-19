import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { FeedItem } from '@/lib/content/feed';

export default function FeedRow({ item }: { item: FeedItem }) {
  return (
    <Link
      href={item.href}
      className="group flex items-center gap-5 border-b border-navy/10 py-5 transition-colors hover:bg-surface-2"
    >
      <div className="relative h-16 w-24 shrink-0 overflow-hidden">
        <Image
          src={item.image}
          alt=""
          fill
          sizes="96px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-xs font-medium uppercase tracking-[0.2em]" style={{ color: item.accent }}>
          {item.category}
          {item.date && <span className="ml-2 normal-case tracking-normal text-muted/70">· {item.date}</span>}
        </p>
        <h3 className="mt-1 truncate font-heading text-lg font-medium text-navy transition-colors group-hover:text-blue">
          {item.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-muted">{item.excerpt}</p>
      </div>
      <ArrowUpRight
        size={18}
        strokeWidth={2.5}
        className="shrink-0 text-muted transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-blue"
        aria-hidden="true"
      />
    </Link>
  );
}
