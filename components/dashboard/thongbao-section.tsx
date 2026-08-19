import type { SessionPayload } from '@/lib/auth';
import { canView } from '@/lib/roles';
import { daysSince } from '@/lib/date';
import { ANNOUNCEMENTS, NOTICES, POLICIES } from '@/lib/content';
import NoticeBanner from '@/components/dashboard/notice-banner';
import PolicyCard from '@/components/dashboard/policy-card';
import AnnouncementList from '@/components/dashboard/announcement-list';
import ThongBaoSlideshow, { type ThongBaoSlide } from '@/components/dashboard/thongbao-slideshow';

/** Khối Thông báo + Chính sách + Announcement ở đầu trang chủ, trình bày dạng slide — mới nhất lên trước. */
export default function ThongBaoSection({ session }: { session: SessionPayload }) {
  const notices = NOTICES.filter((n) => canView(session, n.visibility));
  const policies = POLICIES.filter((p) => canView(session, p.visibility));
  const announcements = ANNOUNCEMENTS.filter((a) => canView(session, a.visibility));

  const slides: (ThongBaoSlide & { rank: number })[] = [
    ...notices.map((n) => ({
      key: `notice-${n.id}`,
      label: 'Thông báo khẩn',
      rank: daysSince(n.date) ?? Number.POSITIVE_INFINITY,
      node: <NoticeBanner notices={[n]} />,
    })),
    ...policies.map((p) => ({
      key: `policy-${p.id}`,
      label: 'Chính sách',
      rank: daysSince(p.effectiveDate) ?? Number.POSITIVE_INFINITY,
      node: <PolicyCard policy={p} />,
    })),
    ...announcements.map((a) => ({
      key: `announcement-${a.id}`,
      label: 'Thông báo',
      rank: daysSince(a.date) ?? Number.POSITIVE_INFINITY,
      node: <AnnouncementList announcements={[a]} />,
    })),
  ].sort((a, b) => a.rank - b.rank);

  if (slides.length === 0) return null;

  return (
    <div>
      <p className="font-heading text-sm font-medium uppercase tracking-[0.3em] text-gold">Từ Ban lãnh đạo</p>
      <h2 className="font-heading mt-2 text-3xl font-medium uppercase tracking-wide text-navy sm:text-4xl">
        Thông báo mới nhất
      </h2>
      <div className="mt-8">
        <ThongBaoSlideshow slides={slides} />
      </div>
    </div>
  );
}
