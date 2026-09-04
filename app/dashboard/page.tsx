import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canView, departmentLabel } from '@/lib/roles';
import { CULTURE_ARTICLES, RECOGNITION_LISTS, RULE_DOCUMENTS, POLICIES } from '@/lib/content';
import { buildFeed } from '@/lib/content/feed';
import { listRules } from '@/lib/rules';
import { listQuotes } from '@/lib/quotes';
import { countActiveUsersByGender, countActiveUsersByDepartment, listActiveBirthdaysThisMonth } from '@/lib/users';
import { listStickyNotes } from '@/lib/sticky-notes';
import { docIdsVisibleTo } from '@/lib/rule-permissions';
import ThongBaoSection from '@/components/dashboard/thongbao-section';
import DashboardBento from '@/components/dashboard/dashboard-bento';
import ContentTeaserCard from '@/components/dashboard/content-teaser-card';
import HoverToneSection from '@/components/dashboard/hover-tone-section';
import GreetingHero from '@/components/dashboard/greeting-hero';
import StickyBoard from '@/components/dashboard/sticky-board';
import RuleLaptopScene from '@/components/dashboard/rule-laptop-scene';
import TarotSection from '@/components/dashboard/tarot-section';
import BoxWaveDivider from '@/components/dashboard/box-wave-divider';
import Reveal from '@/components/reveal';
import { RULE_DOC_IMAGE, CATEGORY_IMAGE, FALLBACK_IMAGE } from '@/lib/content/images';

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

  const allRules = [...RULE_DOCUMENTS, ...(await listRules())];
  const visibleRuleIds = await docIdsVisibleTo(session.userId, session.tier);
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
  const headcount = await countActiveUsersByGender();
  const departmentCounts = await countActiveUsersByDepartment();
  const birthdays = await listActiveBirthdaysThisMonth();
  const quotes = await listQuotes();
  const stickyNotes = await listStickyNotes(session.userId);

  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-[1500px] px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-28">
        <div className="dashboard-brand-lockup mb-12 text-center">
          <p className="font-heading text-4xl font-light uppercase tracking-wide sm:text-5xl">
            Ethan Ecom
          </p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-current sm:w-16" aria-hidden="true" />
            <p className="text-base font-semibold uppercase tracking-[0.15em] sm:text-lg">
              Đồng lòng đồng sức, bứt phá gặt thành công
            </p>
            <span className="h-px w-10 bg-current sm:w-16" aria-hidden="true" />
          </div>
        </div>
        <GreetingHero greeting={greeting} department={departmentLabel(session.department)} />
      </div>

      <div className="mx-auto mb-16 flex w-full max-w-[1500px] flex-col gap-16 px-4 py-12 sm:px-6 sm:py-16 lg:mb-[140px] lg:gap-36 lg:px-8 lg:py-24">
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
          />
        </Reveal>

        {contentCards.length > 0 && (
          <Reveal>
            <HoverToneSection>
              <div className="theme-light-surface relative">
                <p className="font-heading text-sm font-medium uppercase tracking-[0.3em] text-blue">Mới nhất</p>
                <h2 id="other-content-title" className="font-heading mt-3 text-4xl font-light uppercase tracking-wide text-navy sm:text-5xl">
                  Nội dung khác
                </h2>
              </div>
              <div className="other-content-grid relative grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
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

      <Reveal>
        <StickyBoard
          initialNotes={stickyNotes}
          currentUserId={session.userId}
          canModerate={session.tier === 'full'}
        />
      </Reveal>

      <TarotSection />

      <BoxWaveDivider />

      <RuleLaptopScene />
    </div>
  );
}
