import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canView, departmentLabel } from '@/lib/roles';
import { daysSince } from '@/lib/date';
import { NOTICES, POLICIES, CULTURE_ARTICLES, RECOGNITION_LISTS, ANNOUNCEMENTS } from '@/lib/content';
import { buildFeed } from '@/lib/content/feed';
import NoticeBanner from '@/components/dashboard/notice-banner';
import FeedCard from '@/components/dashboard/feed-card';
import FeedRow from '@/components/dashboard/feed-row';
import Reveal from '@/components/reveal';

function greetingForHour(hour: number) {
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 14) return 'Chào buổi trưa';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

function currentHanoiHour() {
  const hourText = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date());
  return Number(hourText);
}

export default async function DashboardHome() {
  const session = await getSession();
  if (!session) redirect('/login');

  const allNotices = NOTICES.filter((n) => canView(session, n.visibility));
  // Trang chủ chỉ nêu thông báo còn "nóng" (trong 1 tuần) — thông báo cũ hơn vẫn xem đầy đủ ở trang Thông báo.
  const homeNotices = allNotices.filter((n) => {
    const days = daysSince(n.date);
    return days === null || days <= 7;
  });
  const announcements = ANNOUNCEMENTS.filter((a) => canView(session, a.visibility));
  const policies = POLICIES.filter((p) => canView(session, p.visibility));
  const culture = CULTURE_ARTICLES.filter((c) => canView(session, c.visibility));
  const recognition = RECOGNITION_LISTS.filter((r) => canView(session, r.visibility));

  const feed = buildFeed({ notices: allNotices, announcements, policies, culture, recognition });
  const [hero, ...rest] = feed;
  const gridItems = rest.slice(0, 4);
  const listItems = rest.slice(4);

  const greeting = greetingForHour(currentHanoiHour());

  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-[1500px] px-8 pt-14 sm:pt-20">
        <p className="font-heading text-sm font-medium uppercase tracking-[0.3em] text-blue">Cổng thông tin nội bộ</p>
        <h2 className="font-heading mt-2 text-3xl font-medium tracking-wide text-navy sm:text-4xl">
          {greeting}, {departmentLabel(session.department)}
        </h2>
        <div className="gradient-divider mt-6 w-24" aria-hidden="true" />
      </div>

      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-20 px-8 py-12 sm:gap-28 sm:py-16">
        {homeNotices.length > 0 && (
          <Reveal>
            <NoticeBanner notices={homeNotices} />
          </Reveal>
        )}

        {hero && (
          <Reveal>
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:gap-12">
              <FeedCard
                href={hero.href}
                eyebrow={hero.category}
                title={hero.title}
                description={hero.excerpt}
                image={hero.image}
                accent={hero.accent}
                date={hero.date ?? undefined}
                featured
                index={0}
              />
              {gridItems.map((item, i) => (
                <FeedCard
                  key={item.key}
                  href={item.href}
                  eyebrow={item.category}
                  title={item.title}
                  description={item.excerpt}
                  image={item.image}
                  accent={item.accent}
                  date={item.date ?? undefined}
                  index={i + 1}
                />
              ))}
            </div>
          </Reveal>
        )}

        {listItems.length > 0 && (
          <Reveal className="flex flex-col gap-6">
            <div>
              <p className="font-heading text-sm font-medium uppercase tracking-[0.3em] text-blue">Mới nhất</p>
              <h2 className="font-heading mt-2 text-3xl font-medium tracking-wide text-navy sm:text-4xl">
                Nội dung khác
              </h2>
            </div>
            <div className="flex flex-col border-t border-navy/10">
              {listItems.map((item) => (
                <FeedRow key={item.key} item={item} />
              ))}
            </div>
          </Reveal>
        )}

        {feed.length === 0 && (
          <p className="border border-dashed border-[#d5dfef] p-10 text-center text-base text-muted">
            Chưa có nội dung nào cho khối của bạn.
          </p>
        )}
      </div>
    </div>
  );
}
