'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useReducedEffects } from '@/lib/use-reduced-effects';
import type { CultureArticle } from '@/lib/content';
import type { FeedItem } from '@/lib/content/feed';
import type { HeadcountByGender, HeadcountByDepartment, BirthdayPerson } from '@/lib/users';
import { departmentLabel } from '@/lib/roles';
import { ORG_CHART_IMAGE } from '@/lib/content/images';
import TextBlockAnimation from '@/components/ui/text-block-animation';
import { CoreValuesStair } from '@/components/dashboard/core-values-stair';
import { BorderBeamPanel } from '@/components/ui/border-beam-panel';
import BirthdayModal from '@/components/dashboard/birthday-modal';
import FireworkBurst from '@/components/dashboard/firework-burst';
import InspireQuoteWidget from '@/components/dashboard/inspire-quote-widget';
import OrgChartPersonPopup from '@/components/dashboard/org-chart-person-popup';
import { ORG_CHART_PEOPLE, type OrgChartPerson } from '@/lib/content/org-chart-people';
import type { Quote } from '@/lib/quotes';
import birthdayCelebration from '@/sinhnhat.jpeg';
import headcountIllustration from '@/nhansu.png';

gsap.registerPlugin(ScrollTrigger);

interface DashboardBentoProps {
  culture: CultureArticle[];
  latestRecognition: FeedItem | null;
  latestRecognitionNames: string[];
  /** Tổng số người được vinh danh tháng gần nhất — dùng cho dòng teaser, khác latestRecognitionNames (chỉ 3 tên đầu cho chip ở khối dưới). */
  latestRecognitionCount: number;
  headcount: HeadcountByGender | null;
  departmentCounts: HeadcountByDepartment[];
  birthdays: BirthdayPerson[];
  quotes: Quote[];
}

const BIRTHDAY_BALLOONS = [
  { color: '#FF6F91', size: 46, rotate: -8, delay: '0ms', right: '44%', rise: '-152px', mobileRise: '-272px', drift: '-18px' },
  { color: '#00D2FF', size: 34, rotate: 6, delay: '1200ms', right: '32%', rise: '-140px', mobileRise: '-252px', drift: '12px' },
  { color: '#F5A623', size: 40, rotate: -4, delay: '2400ms', right: '20%', rise: '-160px', mobileRise: '-280px', drift: '-10px' },
  { color: '#7C6CF0', size: 30, rotate: 10, delay: '3600ms', right: '9%', rise: '-132px', mobileRise: '-244px', drift: '16px' },
];

const BALLOON_PARTICLES = [
  { x: '-52px', y: '-34px' },
  { x: '-30px', y: '-52px' },
  { x: '0px', y: '-60px' },
  { x: '32px', y: '-50px' },
  { x: '54px', y: '-28px' },
  { x: '60px', y: '4px' },
  { x: '48px', y: '36px' },
  { x: '22px', y: '54px' },
  { x: '-12px', y: '58px' },
  { x: '-42px', y: '42px' },
  { x: '-60px', y: '14px' },
  { x: '-62px', y: '-14px' },
];

/** Bong bóng bay trang trí — thân oval + nút thắt + dây buộc lượn nhẹ. */
function Balloon({ color, size, rotate }: { color: string; size: number; rotate: number }) {
  return (
    <svg
      width={size}
      height={size * 1.75}
      viewBox="0 0 40 70"
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <ellipse cx="20" cy="22" rx="18" ry="22" fill={color} />
      <path d="M17 43 L20 48 L23 43 Z" fill={color} />
      <path d="M20 48 C 26 54, 14 60, 20 68" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />
    </svg>
  );
}

function findArticle(culture: CultureArticle[], id: string): CultureArticle | undefined {
  return culture.find((c) => c.id === id);
}

function BentoCard({
  href,
  index,
  className = '',
  children,
  noLink = false,
}: {
  href: string;
  index: number;
  className?: string;
  children: React.ReactNode;
  /** Khi true, thẻ chỉ mang tính hiển thị: không phải <a>, không điều hướng khi click, không hiện URL lúc hover. */
  noLink?: boolean;
}) {
  const style = { '--glow-color': 'rgba(245, 166, 35, 0.3)', animationDelay: `${index * 80}ms` } as React.CSSProperties;
  const className_ = `dashboard-bento-card card-glow animate-fade-up group relative flex flex-col justify-between overflow-hidden rounded-[var(--ui-radius-panel)] border border-white/10 bg-white/[0.02] p-5 transition-colors duration-300 ease-[var(--theme-ease)] hover:border-white/25 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-2/40 sm:p-6 min-[1025px]:p-8 ${className}`;

  if (noLink) {
    return (
      <div style={style} className={className_}>
        {children}
      </div>
    );
  }

  return (
    <Link href={href} style={style} className={className_}>
      {children}
    </Link>
  );
}

function ViewMore() {
  return (
    <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors group-hover:text-white">
      Xem chi tiết
      <ArrowUpRight
        size={16}
        strokeWidth={2.5}
        className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
        aria-hidden="true"
      />
    </div>
  );
}

/** Khối bento tối màu bên dưới Thông báo ở trang chủ — 3 thẻ nhỏ + 2 thẻ lớn, gộp số liệu công ty và nội dung Khen thưởng/Văn hoá. */
export default function DashboardBento({
  culture,
  latestRecognition,
  latestRecognitionNames,
  latestRecognitionCount,
  headcount,
  departmentCounts,
  birthdays,
  quotes,
}: DashboardBentoProps) {
  const [birthdayOpen, setBirthdayOpen] = useState(false);
  const [birthdayMonthOffset, setBirthdayMonthOffset] = useState(0);
  const [birthdayFirework, setBirthdayFirework] = useState(0);
  const birthdayHoveredRef = useRef(false);
  const [orgChartPerson, setOrgChartPerson] = useState<OrgChartPerson | null>(null);
  const orgChartRevealRef = useRef<HTMLDivElement>(null);
  const headcountCardRef = useRef<HTMLDivElement>(null);
  const reduceEffects = useReducedEffects();
  const orgArticle = findArticle(culture, 'co-cau-to-chuc');
  const genderTotal = headcount ? headcount.female + headcount.male : 0;
  const femalePct = genderTotal > 0 && headcount ? (headcount.female / genderTotal) * 100 : 0;
  const visionArticle = findArticle(culture, 'tam-nhin-su-menh-gia-tri');
  const coreValues = visionArticle?.blocks.find((b) => b.heading === '5 giá trị cốt lõi')?.list;

  const hasCoreValues = Boolean(visionArticle && coreValues && coreValues.length > 0);
  // Thẻ sinh nhật là nội dung tĩnh nên hàng trên luôn hiện.
  const hasTopRow = true;

  // Sơ đồ tổ chức "vẽ" dần từ trên xuống khi cuộn tới — clip-path quét từ ẩn hoàn toàn
  // (đáy che hết) tới lộ hoàn toàn. toggleActions "play none none reverse" (như
  // TextBlockAnimation) thay vì scrub theo khoảng start/end: scrub đo toạ độ cuộn một lần
  // lúc gắn hiệu ứng nên dễ lệch nếu trang đổi chiều cao sau đó, khiến cuộn lên không thu lại
  // được nữa; toggleActions chỉ cần 1 mốc "start" nên không bị lệch kiểu đó và tự đảo chiều
  // đúng khi cuộn qua lại mốc này.
  useGSAP(
    () => {
      if (reduceEffects || !orgChartRevealRef.current) return;
      const el = orgChartRevealRef.current;

      gsap.set(el, { clipPath: 'inset(0% 0% 100% 0%)' });
      gsap.to(el, {
        clipPath: 'inset(0% 0% 0% 0%)',
        ease: 'power2.out',
        duration: 1.4,
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        },
      });
    },
    { scope: orgChartRevealRef, dependencies: [reduceEffects] }
  );

  // Số 98 đếm dần từ 0 khi card lọt vào khung nhìn.
  useGSAP(
    () => {
      const root = headcountCardRef.current;
      if (!root || !headcount) return;

      const numberEl = root.querySelector<HTMLSpanElement>('.headcount-number');

      if (reduceEffects) {
        if (numberEl) numberEl.textContent = String(headcount.total);
        return;
      }

      if (numberEl) numberEl.textContent = '0';

      const counter = { value: 0 };
      gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }).to(counter, {
        value: headcount.total,
        duration: 1.4,
        ease: 'power2.out',
        onUpdate: () => {
          if (numberEl) numberEl.textContent = String(Math.round(counter.value));
        },
      });
    },
    { scope: headcountCardRef, dependencies: [reduceEffects, headcount] }
  );

  const birthdayPanel = (
    <BorderBeamPanel
      beams={2}
      thickness={2}
      radius={28}
      glow
      onMouseEnter={() => {
        if (birthdayHoveredRef.current) return;
        birthdayHoveredRef.current = true;
        setBirthdayFirework((n) => n + 1);
      }}
      onMouseLeave={() => {
        birthdayHoveredRef.current = false;
      }}
      className="dashboard-bento-panel animate-fade-up flex min-h-[280px] flex-col justify-start border-navy/10 bg-white p-5 text-navy sm:min-h-[300px] sm:p-6 min-[1025px]:min-h-[340px] min-[1025px]:p-8"
      style={{ animationDelay: '80ms' }}
    >
      <FireworkBurst autoPlay={false} trigger={birthdayFirework} burstCount={3} particlesPerBurst={28} lifetimeMs={2200} />
      <div className="relative z-30">
        <h3 className="font-heading text-lg font-light uppercase tracking-wide text-navy sm:text-xl min-[1025px]:text-2xl">
          Chương trình sinh nhật
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted sm:w-[52%] sm:max-w-[45ch] sm:text-xs min-[1025px]:w-[46%] min-[1025px]:text-[13px]">
          Ethan luôn đồng hành và gửi lời chúc đến từng thành viên trong ngày đặc biệt của bạn. Và sẽ có những
          món quà đặc biệt bất ngờ dành cho bạn.
        </p>
      </div>
      <div className="birthday-balloon-stage pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
        {BIRTHDAY_BALLOONS.map((balloon) => (
          <span
            key={balloon.color}
            className="birthday-balloon-flight absolute bottom-[5%]"
            style={{
              right: balloon.right,
              '--birthday-delay': balloon.delay,
              '--birthday-rise': balloon.mobileRise,
              '--birthday-rise-desktop': balloon.rise,
              '--birthday-drift': balloon.drift,
            } as React.CSSProperties}
          >
            <span className="birthday-balloon-pop relative block">
              <Balloon color={balloon.color} size={balloon.size} rotate={balloon.rotate} />
            </span>
            <span
              className="birthday-balloon-flash absolute left-1/2 top-[30%] h-8 w-8 rounded-full border-2"
              style={{ borderColor: balloon.color }}
            />
            {BALLOON_PARTICLES.map((particle) => (
              <span
                key={`${particle.x}-${particle.y}`}
                className="birthday-balloon-particle absolute left-1/2 top-[30%] h-3 w-1 rounded-full"
                style={{
                  backgroundColor: balloon.color,
                  '--birthday-particle-x': particle.x,
                  '--birthday-particle-y': particle.y,
                } as React.CSSProperties}
              />
            ))}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          setBirthdayMonthOffset(0);
          setBirthdayOpen(true);
        }}
        className="group/more relative z-30 mt-4 flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-full border border-gold/50 bg-navy-deep px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-18px_rgba(16,26,48,0.85)] transition-[background-color,border-color,transform] duration-200 ease-[var(--theme-ease)] hover:border-gold-2 hover:bg-navy hover:-translate-y-0.5 active:bg-navy-2 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        Xem ai sinh nhật tháng này
        <ArrowUpRight size={16} strokeWidth={2.5} className="birthday-cta-arrow text-gold-2" aria-hidden="true" />
      </button>
      <div className="relative z-30 mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setBirthdayMonthOffset(-1);
            setBirthdayOpen(true);
          }}
          className="flex min-h-8 cursor-pointer items-center rounded-full border border-navy/10 bg-transparent px-3.5 py-1.5 text-xs font-medium text-navy/45 transition-colors duration-200 ease-[var(--theme-ease)] hover:border-navy/25 hover:text-navy/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/20 focus-visible:ring-offset-2"
        >
          Sinh nhật tháng trước
        </button>
        <button
          type="button"
          onClick={() => {
            setBirthdayMonthOffset(1);
            setBirthdayOpen(true);
          }}
          className="flex min-h-8 cursor-pointer items-center rounded-full border border-navy/10 bg-transparent px-3.5 py-1.5 text-xs font-medium text-navy/45 transition-colors duration-200 ease-[var(--theme-ease)] hover:border-navy/25 hover:text-navy/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/20 focus-visible:ring-offset-2"
        >
          Sinh nhật tháng sau
        </button>
      </div>
      <div className="pointer-events-none relative z-20 mt-3 h-40 w-full sm:absolute sm:bottom-[8%] sm:right-[1%] sm:mt-0 sm:h-[56%] sm:w-[44%] min-[1025px]:h-[64%] min-[1025px]:w-[48%]">
        <Image
          src={birthdayCelebration}
          alt="Minh hoạ chương trình sinh nhật của Ethan"
          fill
          sizes="(min-width: 640px) 24vw, calc(100vw - 64px)"
          className="object-contain object-center"
        />
      </div>
    </BorderBeamPanel>
  );

  if (!hasTopRow && !hasCoreValues) return null;

  return (
    <>
      <div className="dashboard-bento-band relative left-1/2 w-screen -translate-x-1/2 bg-navy-deep py-12 min-[1025px]:py-20 min-[1280px]:py-32">
        <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 min-[1025px]:px-8">
        <TextBlockAnimation blockColor="#101A30" duration={0.7} stagger={0.05}>
          <p className="font-heading text-xs font-medium uppercase tracking-[0.2em] text-gold-2 min-[1025px]:text-sm min-[1025px]:tracking-[0.3em]">Về Ethan</p>
          <h2 className="font-heading mt-2 text-2xl font-light uppercase tracking-wide text-white sm:text-3xl min-[1025px]:mt-3 min-[1025px]:text-5xl">
            Con người &amp; văn hoá
          </h2>
        </TextBlockAnimation>

        {hasTopRow && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 min-[1025px]:mt-20 min-[1025px]:gap-16">
            {headcount && orgArticle && (
              <BentoCard href={`/dashboard/van-hoa#${orgArticle.id}`} index={0} className="min-h-[280px]">
                <svg
                  className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 opacity-[0.15] blur-3xl transition-opacity duration-300 ease-[var(--theme-ease)] group-hover:opacity-25"
                  viewBox="0 0 200 200"
                  aria-hidden="true"
                >
                  <circle cx="100" cy="100" r="100" fill="#00D2FF" />
                </svg>
                <div ref={headcountCardRef} className="relative">
                  <div className="flex items-start justify-between gap-4 min-[1025px]:gap-6">
                    <div>
                      <p className="font-heading origin-left text-3xl font-medium text-white transition-transform duration-300 group-hover:scale-105 sm:text-4xl min-[1025px]:text-6xl">
                        <span className="headcount-number">{headcount.total}</span>
                      </p>
                      <TextBlockAnimation blockColor="#101A30" duration={0.6} stagger={0.05}>
                        <p className="mt-2 text-base text-white/70">Nhân sự Ethan</p>
                      </TextBlockAnimation>

                      {genderTotal > 0 && (
                        <div className="mt-7 flex items-center gap-4">
                          <div
                            className="relative h-14 w-14 shrink-0 rounded-full transition-transform duration-300 group-hover:scale-110"
                            style={{ background: `conic-gradient(#FF2E7A 0% ${femalePct}%, #00E5FF ${femalePct}% 100%)` }}
                            aria-hidden="true"
                          >
                            <div className="absolute inset-[5px] rounded-full bg-[#0d1424]" />
                          </div>
                          <div className="flex flex-col gap-1.5 text-sm text-white/80">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 shrink-0 rounded-full bg-[#FF2E7A]" aria-hidden="true" />
                              {headcount.female} nữ
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 shrink-0 rounded-full bg-[#00E5FF]" aria-hidden="true" />
                              {headcount.male} nam
                            </span>
                          </div>
                          <Image
                            src={headcountIllustration}
                            alt="Minh hoạ đội ngũ nhân sự Ethan"
                            className="pointer-events-none h-16 w-auto shrink-0 object-contain transition-transform duration-300 group-hover:scale-105 sm:h-20 min-[1025px]:h-24"
                          />
                        </div>
                      )}
                    </div>

                    {departmentCounts.length > 0 && (
                      <div className="hidden shrink-0 border-l border-white/10 pl-6 sm:block">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Theo bộ phận</p>
                        <div className="mt-3 flex flex-col gap-2 text-xs text-white/70">
                          {departmentCounts.map((d) => (
                            <div key={d.department} className="flex items-center justify-between gap-4">
                              <span className="truncate">{departmentLabel(d.department)}</span>
                              <span className="shrink-0 font-semibold text-white">{d.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </BentoCard>
            )}

            {birthdayPanel}
          </div>
        )}

        {hasCoreValues && visionArticle && coreValues && (
          <section
            className="dashboard-feature-grid mt-12 grid grid-cols-1 items-stretch gap-6 min-[1025px]:mt-24 min-[1025px]:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] min-[1025px]:gap-16 xl:gap-20"
            aria-labelledby="core-values-title"
          >
            <div className="dashboard-core-values-column flex min-h-[460px] flex-col items-start text-left sm:min-h-[520px] min-[1025px]:min-h-[760px] xl:min-h-[820px]">
              <TextBlockAnimation blockColor="#101A30" duration={0.6} stagger={0.05}>
                <p id="core-values-title" className="font-heading text-sm font-medium uppercase tracking-[0.34em] text-gold-2 sm:text-base">
                  5 giá trị cốt lõi
                </p>
              </TextBlockAnimation>
              <CoreValuesStair values={coreValues} />
              <Link
                href={`/dashboard/van-hoa#${visionArticle.id}`}
                className="flex min-h-11 items-center gap-2 border-b border-white/20 px-1 text-sm font-semibold text-white/75 transition-colors duration-200 hover:border-cyan hover:text-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-4 focus-visible:ring-offset-navy-deep"
              >
                Xem chi tiết
                <ArrowUpRight size={16} strokeWidth={2.5} aria-hidden="true" />
              </Link>
            </div>

            <div className="dashboard-quote-column min-h-[460px] w-full sm:min-h-[520px] min-[1025px]:min-h-[760px] xl:min-h-[820px]">
              <InspireQuoteWidget initialQuotes={quotes} />
            </div>
          </section>
        )}

        {orgArticle && (
          <div className="mt-10 min-[1025px]:mt-20">
            <BentoCard href={`/dashboard/van-hoa#${orgArticle.id}`} index={5} noLink>
              <svg
                className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 opacity-[0.15] blur-3xl transition-opacity duration-300 ease-[var(--theme-ease)] group-hover:opacity-25"
                viewBox="0 0 200 200"
                aria-hidden="true"
              >
                <circle cx="100" cy="100" r="100" fill="#00D2FF" />
              </svg>
              <div className="relative">
                <TextBlockAnimation blockColor="#101A30" duration={0.7} stagger={0.05}>
                  <p className="font-heading text-xs font-medium uppercase tracking-[0.25em] text-gold-2">Cơ cấu tổ chức</p>
                  <h3 className="font-heading mt-2 text-base font-light uppercase tracking-wide text-white sm:text-lg">
                    Sơ đồ tổ chức Ethan
                  </h3>
                </TextBlockAnimation>
                <div ref={orgChartRevealRef} className="mt-6 w-full overflow-x-auto rounded-2xl border border-white/10 bg-white">
                  <div className="relative w-full min-w-[820px]">
                    <Image
                      src={ORG_CHART_IMAGE}
                      alt="Sơ đồ tổ chức Ethan"
                      unoptimized
                      className="block h-auto w-full"
                    />
                    {ORG_CHART_PEOPLE.map((person, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setOrgChartPerson(person)}
                        aria-label={`${person.name} – ${person.role}`}
                        className="absolute -translate-y-1/2 rounded-md transition hover:ring-2 hover:ring-blue-cta/70"
                        style={{ left: `calc(${person.xPct}% - 1.2%)`, top: `${person.yPct}%`, width: '8%', height: '1.95%' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </BentoCard>
          </div>
        )}
      </div>
      </div>
      <BirthdayModal
        open={birthdayOpen}
        onClose={() => setBirthdayOpen(false)}
        monthOffset={birthdayMonthOffset}
        peopleThisMonth={birthdays}
      />
      <OrgChartPersonPopup person={orgChartPerson} onClose={() => setOrgChartPerson(null)} />
    </>
  );
}
