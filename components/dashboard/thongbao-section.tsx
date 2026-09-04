import type { SessionPayload } from '@/lib/auth';
import { canView } from '@/lib/roles';
import { daysSince } from '@/lib/date';
import { ANNOUNCEMENTS, NOTICES, POLICIES } from '@/lib/content';
import { listAnnouncements } from '@/lib/announcements';
import { announcementIdsVisibleTo } from '@/lib/announcement-permissions';
import { findActiveUserAvatarUrlByUsername, findFullTierAvatarUrl } from '@/lib/users';
import NoticeBanner from '@/components/dashboard/notice-banner';
import PolicyCard from '@/components/dashboard/policy-card';
import AnnouncementList from '@/components/dashboard/announcement-list';
import ThongBaoSlideshow, { type ThongBaoSlide } from '@/components/dashboard/thongbao-slideshow';

/** Khối Thông báo + Chính sách + Announcement ở đầu trang chủ, trình bày dạng slide — mới nhất lên trước. */
export default async function ThongBaoSection({ session }: { session: SessionPayload }) {
  const notices = NOTICES.filter((n) => canView(session, n.visibility));
  const policies = POLICIES.filter((p) => canView(session, p.visibility));

  const allAnnouncements = [...ANNOUNCEMENTS, ...(await listAnnouncements())];
  const visibleAnnouncementIds = await announcementIdsVisibleTo(session.userId, session.tier);
  const [avatarUrl, duyAvatarUrl, nguyetAvatarUrl] = await Promise.all([
    findFullTierAvatarUrl(),
    findActiveUserAvatarUrlByUsername('duynguyen'),
    findActiveUserAvatarUrlByUsername('minhnguyet'),
  ]);
  const announcements = allAnnouncements.filter(
    (a) => canView(session, a.visibility) || visibleAnnouncementIds === 'all' || visibleAnnouncementIds.has(Number(a.id))
  );

  const slides: (ThongBaoSlide & { rank: number })[] = [
    ...notices.map((n) => ({
      key: `notice-${n.id}`,
      label: 'Thông báo khẩn',
      title: n.title,
      excerpt: n.body,
      date: n.date,
      details: n.details,
      author: n.author,
      authorAvatarUrl: n.author === 'Chị Nguyệt' ? nguyetAvatarUrl : undefined,
      rank: daysSince(n.date) ?? Number.POSITIVE_INFINITY,
      node: <NoticeBanner notices={[n]} />,
    })),
    ...policies.map((p) => ({
      key: `policy-${p.id}`,
      label: 'Chính sách',
      title: p.title,
      excerpt: p.intro,
      date: p.effectiveDate,
      details: p.groups.map((g) => g.heading),
      rank: daysSince(p.effectiveDate) ?? Number.POSITIVE_INFINITY,
      node: <PolicyCard policy={p} />,
    })),
    ...announcements.map((a) => ({
      key: `announcement-${a.id}`,
      label: 'Thông báo',
      title: a.title,
      excerpt: a.body,
      date: a.date,
      author: a.author,
      authorAvatarUrl: a.author === 'Anh Duy' ? duyAvatarUrl : undefined,
      image: a.image,
      rank: daysSince(a.date) ?? Number.POSITIVE_INFINITY,
      node: <AnnouncementList announcements={[a]} />,
    })),
  ].sort((a, b) => a.rank - b.rank);

  if (slides.length === 0) return null;

  return (
    <div>
      <p className="font-heading text-xs font-medium uppercase tracking-[0.2em] text-gold min-[1025px]:text-sm min-[1025px]:tracking-[0.3em]">Từ Ban lãnh đạo</p>
      <h2 className="font-heading mt-2 text-2xl font-light uppercase tracking-wide text-navy sm:text-3xl min-[1025px]:mt-3 min-[1025px]:text-5xl">
        Thông báo mới nhất
      </h2>
      <div className="mt-6 sm:mt-8 min-[1025px]:mt-12">
        <ThongBaoSlideshow slides={slides} avatarUrl={avatarUrl} />
      </div>
    </div>
  );
}
