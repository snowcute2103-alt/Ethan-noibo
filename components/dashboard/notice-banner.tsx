import { TriangleAlert } from 'lucide-react';
import type { Notice } from '@/lib/content';

export default function NoticeBanner({ notices }: { notices: Notice[] }) {
  if (notices.length === 0) return null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      {notices.map((n) => (
        <div
          key={n.id}
          className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-gold to-gold-2 p-6 shadow-[0_12px_28px_-14px_rgba(245,166,35,0.55)]"
        >
          <div
            className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15"
            aria-hidden="true"
          />
          <div className="relative flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90">
              <TriangleAlert size={18} strokeWidth={2.25} className="text-gold" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-heading text-lg font-medium tracking-wide text-navy">{n.title}</h3>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-navy">{n.date}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-navy/90">{n.body}</p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {n.details.map((d, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-navy/90">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy/50" aria-hidden="true" />
                    {d}
                  </li>
                ))}
              </ul>
              {n.callout && (
                <p className="mt-3 inline-block rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white">
                  {n.callout}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
