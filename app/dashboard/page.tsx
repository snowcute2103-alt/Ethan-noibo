import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getSession } from '@/lib/auth';
import { canView, departmentLabel } from '@/lib/roles';
import { CULTURE_ARTICLES, RECOGNITION_LISTS, RULE_DOCUMENTS, POLICIES } from '@/lib/content';
import { buildFeed } from '@/lib/content/feed';
import { listRules } from '@/lib/rules';
import { listQuotes } from '@/lib/quotes';
import {
  countActiveUsersByGender,
  countActiveUsersByDepartment,
  listActiveBirthdaysThisMonth,
  findAvatarUrlsByIds,
} from '@/lib/users';
import { listStickyNotes } from '@/lib/sticky-notes';
import { ORG_CHART_PEOPLE } from '@/lib/content/org-chart-people';
import { docIdsVisibleTo } from '@/lib/rule-permissions';
import ThongBaoSection from '@/components/dashboard/thongbao-section';
import DashboardBento from '@/components/dashboard/dashboard-bento';
import ContentTeaserCard from '@/components/dashboard/content-teaser-card';
import HoverToneSection from '@/components/dashboard/hover-tone-section';
import GreetingHero from '@/components/dashboard/greeting-hero';
import StickyBoard from '@/components/dashboard/sticky-board';
import Reveal from '@/components/reveal';
import { RULE_DOC_IMAGE, CATEGORY_IMAGE, FALLBACK_IMAGE } from '@/lib/content/images';

// Cả 2 đều nằm cuối trang chủ (dưới màn hình đầu) — tách chunk JS riêng thay vì
// gộp vào bundle chính, trì hoãn tải cho tới khi trình duyệt thực sự cần tới.
const RuleLaptopScene = dynamic(() => import('@/components/dashboard/rule-laptop-scene'));
const TarotSection = dynamic(() => import('@/components/dashboard/tarot-section'));

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

const SOP_CARD_PALETTE = [
  { accent: '#00D2FF', accentActive: '#0052CC', hoverTone: '#e4f8fc' },
  { accent: '#7C6CF0', accentActive: '#5545C8', hoverTone: '#eeeafe' },
  { accent: '#27AE60', accentActive: '#14733A', hoverTone: '#e7f7ed' },
] as const;

export default async function DashboardHome() {
  const session = await getSession();
  if (!session) redirect('/login');

  const culture = CULTURE_ARTICLES.filter((c) => canView(session, c.visibility));
  const recognition = RECOGNITION_LISTS.filter((r) => canView(session, r.visibility));

  const feed = buildFeed({ culture, recognition });
  const latestRecognition = feed.find((item) => item.category === 'Khen thưởng') ?? null;
  const latestRecognitionList = recognition.find((r) => r.month === latestRecognition?.date);
  const latestRecognitionNames = latestRecognitionList?.names.slice(0, 3) ?? [];
  const latestRecognitionCount = latestRecognitionList?.names.length ?? 0;

  // Sơ đồ tổ chức: photoUrl trong ORG_CHART_PEOPLE là ảnh chụp lúc dựng sơ đồ — ghi đè bằng
  // avatar hiện tại của user (nếu có userId) để tự cập nhật khi ai đó đổi avatar sau này.
  const orgChartUserIds = [...new Set(ORG_CHART_PEOPLE.map((p) => p.userId).filter((id): id is number => id !== null))];

  // 8 truy vấn độc lập nhau chạy song song thay vì await tuần tự — listRules/
  // docIdsVisibleTo còn được cache() dedupe với layout.tsx (cùng gọi cho cùng
  // lượt tải trang chủ) nên 2 lệnh này thực chất không tốn thêm round-trip nào.
  const [rulesFromDb, visibleRuleIds, headcount, departmentCounts, birthdays, quotes, stickyNotes, liveAvatars] =
    await Promise.all([
      listRules(),
      docIdsVisibleTo(session.userId, session.tier),
      countActiveUsersByGender(),
      countActiveUsersByDepartment(),
      listActiveBirthdaysThisMonth(),
      listQuotes(),
      listStickyNotes(),
      findAvatarUrlsByIds(orgChartUserIds),
    ]);

  const allRules = [...RULE_DOCUMENTS, ...rulesFromDb];
  const sopDocs = visibleRuleIds === 'all' ? allRules : allRules.filter((d) => visibleRuleIds.has(d.id));

  // "Nội dung khác" chỉ hiển thị SOP & Quy trình và Chính sách công ty — Khen thưởng/Văn hoá đã có khối riêng ở DashboardBento.
  // Mỗi bài là 1 thẻ cuộn riêng (xem ContentTeaserCard), xếp thành lưới thay vì gộp chung 1 danh sách.
  const sopCards = sopDocs.map((doc, index) => {
    const palette = SOP_CARD_PALETTE[index % SOP_CARD_PALETTE.length];
    return {
      key: `rule-${doc.id}`,
      href: `/dashboard/rule#${doc.id}`,
      ctaLabel: 'Xem đầy đủ SOP',
      image: RULE_DOC_IMAGE[doc.id] ?? FALLBACK_IMAGE,
      category: 'SOP & Quy trình',
      ...palette,
      date: doc.updatedAt,
      title: doc.title,
      intro: doc.subtitle,
      highlights: doc.goldenRule
        ? [{ heading: doc.goldenRule.title, items: doc.goldenRule.points.map((text) => ({ text })) }]
        : undefined,
    };
  });

  /** Chính sách công ty — hiện trọn nội dung ngay trong thẻ (không CTA "xem đầy đủ" vì đã đủ hết ở đây). */
  const policies = POLICIES.filter((p) => canView(session, p.visibility));
  const policyCards = policies.map((p) => ({
    key: `policy-${p.id}`,
    image: CATEGORY_IMAGE['Chính sách'] ?? FALLBACK_IMAGE,
    category: 'Chính sách',
    accent: '#F5A623',
    accentActive: '#B5720A',
    hoverTone: '#fff3d9',
    date: p.effectiveDate,
    title: p.title,
    intro: p.intro,
    highlights: p.groups.map((g) => ({ heading: g.heading, items: g.rules })),
    notes: p.notes.map((n) => n.text),
  }));

  const contentCards = [...sopCards, ...policyCards];

  const greeting = greetingForHour(currentHanoiHour());

  const orgChartPeople = ORG_CHART_PEOPLE.map((p) =>
    p.userId !== null && liveAvatars.get(p.userId) ? { ...p, photoUrl: liveAvatars.get(p.userId)! } : p
  );

  return (
    <div className="flex flex-col">
      <div className="dashboard-home-intro mx-auto w-full max-w-[1500px] px-4 pt-8 sm:px-6 sm:pt-10 min-[1025px]:px-8 min-[1025px]:pt-16">
        <div className="dashboard-brand-lockup mb-8 text-center sm:mb-10 min-[1025px]:mb-8">
          <p className="font-heading text-2xl font-light uppercase tracking-wide sm:text-3xl min-[1025px]:text-5xl">
            Ethan Ecom
          </p>
          <div className="mt-2 flex items-center justify-center gap-2 sm:gap-3 min-[1025px]:gap-4">
            <span className="h-px w-6 bg-current sm:w-8 min-[1025px]:w-16" aria-hidden="true" />
            <p className="max-w-[28rem] text-[11px] font-semibold uppercase leading-snug tracking-[0.1em] sm:text-xs min-[1025px]:max-w-none min-[1025px]:text-lg min-[1025px]:tracking-[0.15em]">
              Đồng lòng đồng sức, bứt phá gặt thành công
            </p>
            <span className="h-px w-6 bg-current sm:w-8 min-[1025px]:w-16" aria-hidden="true" />
          </div>
        </div>
        <GreetingHero greeting={greeting} department={departmentLabel(session.department)} />
      </div>

      <div className="dashboard-home-content mx-auto mb-8 flex w-full max-w-[1500px] flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 min-[1025px]:mb-16 min-[1025px]:gap-16 min-[1025px]:px-8 min-[1025px]:py-24">
        <Reveal>
          <div id="thong-bao">
            <ThongBaoSection session={session} />
          </div>
        </Reveal>

        <Reveal>
          <DashboardBento
            culture={culture}
            latestRecognition={latestRecognition}
            latestRecognitionNames={latestRecognitionNames}
            latestRecognitionCount={latestRecognitionCount}
            headcount={headcount}
            departmentCounts={departmentCounts}
            birthdays={birthdays}
            quotes={quotes}
            orgChartPeople={orgChartPeople}
          />
        </Reveal>

        {contentCards.length > 0 && (
          <Reveal>
            <HoverToneSection>
              <div className="theme-light-surface relative">
                <p className="font-heading text-xs font-medium uppercase tracking-[0.2em] text-blue min-[1025px]:text-sm min-[1025px]:tracking-[0.3em]">Mới nhất</p>
                <h2 id="other-content-title" className="font-heading mt-2 text-2xl font-light uppercase tracking-wide text-navy sm:text-3xl min-[1025px]:mt-3 min-[1025px]:text-5xl">
                  Nội dung khác
                </h2>
              </div>
              <div className="other-content-grid relative grid grid-cols-1 items-start gap-6 sm:grid-cols-2 min-[1025px]:grid-cols-4 min-[1025px]:gap-8">
                {contentCards.map(({ key, hoverTone, ...card }) => (
                  <div key={key} data-hover-tone={hoverTone}>
                    <ContentTeaserCard {...card} />
                  </div>
                ))}
              </div>
            </HoverToneSection>
          </Reveal>
        )}

        {feed.length === 0 && contentCards.length === 0 && (
          <p className="border border-dashed border-[#d5dfef] p-10 text-center text-base text-muted">
            Chưa có nội dung nào cho khối của bạn.
          </p>
        )}
      </div>

      <Reveal className="mb-10 px-4 sm:px-6 min-[1025px]:mb-[140px] min-[1025px]:px-8">
        <StickyBoard
          initialNotes={stickyNotes}
          currentUserId={session.userId}
          canModerate={session.tier === 'full'}
        />
      </Reveal>

      <TarotSection />

      <div
        aria-hidden="true"
        className="h-24 w-full"
        style={{ background: 'linear-gradient(180deg, #000 0%, var(--navy-deep) 100%)' }}
      />

      <RuleLaptopScene />
    </div>
  );
}
