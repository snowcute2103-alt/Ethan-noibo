import { TriangleAlert } from 'lucide-react';
import type { Notice } from '@/lib/content';

export default function NoticeBanner({ notices }: { notices: Notice[] }) {
  if (notices.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      {notices.map((n) => (
        <div
          key={n.id}
          className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-gold to-gold-2 p-10 shadow-[0_16px_40px_-16px_rgba(245,166,35,0.55)] sm:p-12"
        >
          <div
            className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15"
            aria-hidden="true"
          />
          <div className="relative flex items-start gap-6">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/90">
              <TriangleAlert size={26} strokeWidth={2.25} className="text-gold" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-heading text-2xl font-medium tracking-wide text-navy">{n.title}</h3>
                <span className="rounded-full bg-white/70 px-3.5 py-1.5 text-sm font-semibold text-navy">{n.date}</span>
              </div>
              <p className="mt-3 text-base leading-relaxed text-navy/90">{n.body}</p>
              <ul className="mt-5 flex flex-col gap-2.5">
                {n.details.map((d, i) => (
                  <li key={i} className="flex gap-3 text-base leading-relaxed text-navy/90">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-navy/50" aria-hidden="true" />
                    {d}
                  </li>
                ))}
              </ul>
              {n.callout && (
                <p className="mt-5 inline-block rounded-2xl bg-navy px-5 py-2.5 text-base font-semibold text-white">
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
