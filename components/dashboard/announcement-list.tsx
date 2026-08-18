import type { Announcement } from '@/lib/content';
import VisibilityBadge from '@/components/visibility-badge';

export default function AnnouncementList({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) return null;

  return (
    <ul className="flex flex-col gap-5">
      {announcements.map((a) => (
        <li key={a.id} className="rounded-[24px] border border-[#eef1f8] bg-white p-8 shadow-[0_10px_30px_-20px_rgba(26,39,69,0.2)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-heading text-lg font-medium tracking-wide text-navy">{a.title}</h3>
            <span className="text-sm text-muted">{a.date}</span>
          </div>
          <p className="text-base leading-relaxed text-ink">{a.body}</p>
          <div className="mt-4">
            <VisibilityBadge visibility={a.visibility} />
          </div>
        </li>
      ))}
    </ul>
  );
}
