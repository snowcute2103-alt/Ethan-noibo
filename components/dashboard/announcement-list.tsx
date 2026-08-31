import Image from 'next/image';
import type { Announcement } from '@/lib/content';
import VisibilityBadge from '@/components/visibility-badge';
import FromBgdBadge from '@/components/dashboard/from-bgd-badge';

export default function AnnouncementList({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) return null;

  return (
    <ul className="flex flex-col gap-5">
      {announcements.map((a) => (
        <li
          key={a.id}
          style={{ '--glow-color': 'rgba(245, 166, 35, 0.3)' } as React.CSSProperties}
          className="card-glow rounded-[24px] border-l-4 border-l-gold border-r border-t border-b border-[#eef1f8] bg-white p-8 shadow-[0_10px_30px_-20px_rgba(26,39,69,0.2)]"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-heading text-lg font-medium tracking-wide text-navy">{a.title}</h3>
            <span className="text-sm text-muted">{a.date}</span>
          </div>
          {a.image && (
            <Image
              src={a.image}
              alt={a.title}
              width={2000}
              height={2000}
              sizes="(max-width: 768px) 100vw, 900px"
              className="mb-6 h-auto w-full rounded-2xl object-cover"
            />
          )}
          <p className="whitespace-pre-wrap text-base leading-relaxed text-ink">{a.body}</p>
          {a.author && <p className="mt-4 text-sm font-semibold text-navy">Người đăng: {a.author}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <FromBgdBadge />
            <VisibilityBadge visibility={a.visibility} />
          </div>
        </li>
      ))}
    </ul>
  );
}
