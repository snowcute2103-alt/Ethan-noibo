'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { CultureArticle } from '@/lib/content';
import type { FeedItem } from '@/lib/content/feed';
import type { HeadcountByGender, HeadcountByDepartment, BirthdayPerson } from '@/lib/users';
import { departmentLabel } from '@/lib/roles';
import { CULTURE_ARTICLE_IMAGE } from '@/lib/content/images';
import TextBlockAnimation from '@/components/ui/text-block-animation';
import { CoreValuesStair } from '@/components/dashboard/core-values-stair';
import { BorderBeamPanel } from '@/components/ui/border-beam-panel';
import BirthdayModal from '@/components/dashboard/birthday-modal';
import FireworkBurst from '@/components/dashboard/firework-burst';
import InspireQuoteWidget from '@/components/dashboard/inspire-quote-widget';
import type { Quote } from '@/lib/quotes';
import moneyBill from '@/public/images/khenthuong/money-3.png';
import birthdayCelebration from '@/sinhnhat.jpeg';

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

const AVATAR_STACK_ACCENTS = ['#FF6F91', '#00D2FF', '#F5A623', '#7C6CF0'];
// Literal classes (not computed at runtime) so Tailwind's JIT scanner can pick them up — leftmost avatar stacks on top by default.
const AVATAR_STACK_Z = ['z-40', 'z-30', 'z-20', 'z-10'];

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

/** "Hoàng Thanh Dũng" -> "H. Dũng" — tên đệm/họ viết tắt, tên gọi (từ cuối) giữ nguyên. */
function chipLabel(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  const given = parts[parts.length - 1];
  return `${parts[0][0]}. ${given}`;
}

function findArticle(culture: CultureArticle[], id: string): CultureArticle | undefined {
  return culture.find((c) => c.id === id);
}

function BentoCard({
  href,
  index,
  className = '',
  children,
}: {
  href: string;
  index: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{ '--glow-color': 'rgba(245, 166, 35, 0.3)', animationDelay: `${index * 80}ms` } as React.CSSProperties}
      className={`card-glow animate-fade-up group relative flex flex-col justify-between overflow-hidden rounded-[var(--ui-radius-panel)] border border-white/10 bg-white/[0.02] p-8 transition-colors duration-300 ease-[var(--theme-ease)] hover:border-white/25 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-2/40 ${className}`}
    >
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
  const [birthdayFirework, setBirthdayFirework] = useState(0);
  const birthdayHoveredRef = useRef(false);
  const orgArticle = findArticle(culture, 'co-cau-to-chuc');
  const genderTotal = headcount ? headcount.female + headcount.male : 0;
  const femalePct = genderTotal > 0 && headcount ? (headcount.female / genderTotal) * 100 : 0;
  const visionArticle = findArticle(culture, 'tam-nhin-su-menh-gia-tri');
  const coreValues = visionArticle?.blocks.find((b) => b.heading === '5 giá trị cốt lõi')?.list;
  const cultureArticle = findArticle(culture, 'van-hoa-gan-ket-dai-ngo');

  const hasCoreValues = Boolean(visionArticle && coreValues && coreValues.length > 0);
  // Thẻ sinh nhật là nội dung tĩnh nên hàng trên luôn hiện; hàng dưới chứa Vinh danh và Đời sống Ethan.
  const hasTopRow = true;
  const hasBottomRow = Boolean(latestRecognition || cultureArticle);

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
      className="animate-fade-up flex min-h-[340px] flex-col justify-start border-navy/10 bg-white p-8 text-navy"
      style={{ animationDelay: '80ms' }}
    >
      <FireworkBurst autoPlay={false} trigger={birthdayFirework} burstCount={3} particlesPerBurst={28} lifetimeMs={2200} />
      <div className="relative z-30">
        <h3 className="font-heading text-xl font-light uppercase tracking-wide text-navy sm:text-2xl">
          Chương trình sinh nhật
        </h3>
        <p className="mt-2 text-base leading-relaxed text-muted sm:w-[46%] sm:max-w-[45ch] sm:text-[13px]">
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
        onClick={() => setBirthdayOpen(true)}
        className="group/more relative z-30 mt-4 flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-full border border-gold/50 bg-navy-deep px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-18px_rgba(16,26,48,0.85)] transition-[background-color,border-color,transform] duration-200 ease-[var(--theme-ease)] hover:border-gold-2 hover:bg-navy hover:-translate-y-0.5 active:bg-navy-2 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        Xem ai sinh nhật tháng này
        <ArrowUpRight size={16} strokeWidth={2.5} className="birthday-cta-arrow text-gold-2" aria-hidden="true" />
      </button>
      <div className="pointer-events-none relative z-20 mt-4 h-64 w-full sm:absolute sm:bottom-[8%] sm:right-[1%] sm:mt-0 sm:h-[64%] sm:w-[48%]">
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

  const recognitionPanel = latestRecognition ? (
    <BorderBeamPanel
      beams={2}
      thickness={2}
      radius={28}
      glow
      colors={['#00D2FF', '#F5A623']}
      className="animate-fade-up flex min-h-[340px] flex-col justify-between p-8"
      style={{ animationDelay: '240ms' }}
    >
      <TextBlockAnimation blockColor="#101A30" duration={0.6} stagger={0.04} delay={0.1}>
        <h3 className="font-heading text-xl font-light uppercase tracking-wide text-white">{latestRecognition.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          Vinh danh {latestRecognitionCount} thành viên tiêu biểu — những gương mặt nổi bật nhất, ghi nhận đóng góp xuất sắc trong tháng.
        </p>
      </TextBlockAnimation>
      <Image
        src={moneyBill}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[58%] w-40 -translate-x-1/2 -translate-y-1/2 -rotate-[8deg] opacity-90 drop-shadow-2xl sm:w-56"
      />
      <Link
        href={latestRecognition.href}
        className="group/more relative z-10 mt-6 flex w-fit items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
      >
        Xem thêm
        <ArrowUpRight
          size={16}
          strokeWidth={2.5}
          className="transition-transform duration-300 group-hover/more:translate-x-1 group-hover/more:-translate-y-1"
          aria-hidden="true"
        />
      </Link>
    </BorderBeamPanel>
  ) : null;

  if (!hasTopRow && !hasCoreValues && !hasBottomRow) return null;

  return (
    <>
      <div className="relative left-1/2 w-screen -translate-x-1/2 bg-navy-deep py-20 sm:py-32">
        <div className="mx-auto w-full max-w-[1500px] px-8">
        <TextBlockAnimation blockColor="#101A30" duration={0.7} stagger={0.05}>
          <p className="font-heading text-sm font-medium uppercase tracking-[0.3em] text-gold-2">Về Ethan</p>
          <h2 className="font-heading mt-3 text-4xl font-light uppercase tracking-wide text-white sm:text-5xl">
            Con người &amp; văn hoá
          </h2>
        </TextBlockAnimation>

        {hasTopRow && (
          <div className="mt-20 grid grid-cols-1 gap-16 sm:grid-cols-2">
            {headcount && orgArticle && (
              <BentoCard href={`/dashboard/van-hoa#${orgArticle.id}`} index={0} className="min-h-[280px]">
                <svg
                  className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 opacity-[0.15] blur-3xl transition-opacity duration-300 ease-[var(--theme-ease)] group-hover:opacity-25"
                  viewBox="0 0 200 200"
                  aria-hidden="true"
                >
                  <circle cx="100" cy="100" r="100" fill="#00D2FF" />
                </svg>
                <div className="relative">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <TextBlockAnimation blockColor="#101A30" duration={0.6} stagger={0.05}>
                        <p className="font-heading origin-left text-5xl font-medium text-white transition-transform duration-300 group-hover:scale-105 sm:text-6xl">
                          {headcount.total}
                        </p>
                        <p className="mt-2 text-base text-white/70">Nhân sự Ethan</p>
                      </TextBlockAnimation>

                      {genderTotal > 0 && (
                        <div className="mt-7 flex items-center gap-4">
                          <div
                            className="relative h-14 w-14 shrink-0 rounded-full transition-transform duration-300 group-hover:scale-110"
                            style={{ background: `conic-gradient(#FF6F91 0% ${femalePct}%, #00D2FF ${femalePct}% 100%)` }}
                            aria-hidden="true"
                          >
                            <div className="absolute inset-[5px] rounded-full bg-[#0d1424]" />
                          </div>
                          <div className="flex flex-col gap-1.5 text-sm text-white/80">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 shrink-0 rounded-full bg-[#FF6F91]" aria-hidden="true" />
                              {headcount.female} nữ
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 shrink-0 rounded-full bg-[#00D2FF]" aria-hidden="true" />
                              {headcount.male} nam
                            </span>
                          </div>
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

                  <ViewMore />
                </div>
              </BentoCard>
            )}

            {birthdayPanel}
          </div>
        )}

        {hasCoreValues && visionArticle && coreValues && (
          <section
            className="dashboard-feature-grid mt-24 grid grid-cols-1 items-stretch gap-16 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-16 xl:gap-20"
            aria-labelledby="core-values-title"
          >
            <div className="flex min-h-[620px] flex-col items-start text-left sm:min-h-[700px] lg:min-h-[760px] xl:min-h-[820px]">
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

            <div className="min-h-[580px] w-full sm:min-h-[700px] lg:min-h-[760px] xl:min-h-[820px]">
              <InspireQuoteWidget initialQuotes={quotes} />
            </div>
          </section>
        )}

        {hasBottomRow && (
          <div className="mt-20 grid grid-cols-1 gap-16 sm:grid-cols-2">
            {recognitionPanel}

            {cultureArticle && (() => {
              const extraCount = Math.max(0, latestRecognitionCount - latestRecognitionNames.length);
              return (
                <BentoCard
                  href={`/dashboard/van-hoa#${cultureArticle.id}`}
                  index={4}
                  className="min-h-[340px] sm:flex-row sm:items-center sm:gap-8"
                >
                  <svg
                    className="pointer-events-none absolute -right-14 -top-14 h-60 w-60 opacity-[0.15] blur-3xl transition-opacity duration-300 ease-[var(--theme-ease)] group-hover:opacity-25"
                    viewBox="0 0 200 200"
                    aria-hidden="true"
                  >
                    <circle cx="100" cy="100" r="100" fill="#7C6CF0" />
                  </svg>
                  <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:h-full sm:w-56">
                    <Image
                      src={CULTURE_ARTICLE_IMAGE[cultureArticle.id]}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 224px, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="relative mt-6 flex-1 sm:mt-0">
                    <TextBlockAnimation blockColor="#101A30" duration={0.7} stagger={0.05} delay={0.1}>
                      <p className="font-heading text-xs font-medium uppercase tracking-[0.25em] text-[#B7ADF2]">
                        Đời sống Ethan
                      </p>
                      <h3 className="font-heading mt-2 whitespace-nowrap text-base font-light uppercase tracking-wide text-white sm:text-lg">
                        {cultureArticle.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/70">{cultureArticle.intro}</p>
                    </TextBlockAnimation>

                    {latestRecognitionNames.length > 0 && (
                      <div className="mt-7">
                        <div className="flex items-center">
                          {latestRecognitionNames.map((name, i) => (
                            <span
                              key={name}
                              title={name}
                              className={`group/avatar relative -ml-2.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-2 ring-[#0d1424] transition-transform duration-200 first:ml-0 hover:z-50 hover:-translate-y-1 ${AVATAR_STACK_Z[i] ?? 'z-10'}`}
                            >
                              <span
                                className="flex h-full w-full items-center justify-center rounded-full text-sm font-semibold text-white"
                                style={{
                                  background: `linear-gradient(135deg, ${AVATAR_STACK_ACCENTS[i % AVATAR_STACK_ACCENTS.length]}, #0d1424 130%)`,
                                }}
                              >
                                {chipLabel(name).charAt(0)}
                              </span>
                            </span>
                          ))}
                          {extraCount > 0 && (
                            <span className="relative -ml-2.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/80 ring-2 ring-[#0d1424]">
                              +{extraCount}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <ViewMore />
                  </div>
                </BentoCard>
              );
            })()}
          </div>
        )}
      </div>
      </div>
      <BirthdayModal open={birthdayOpen} onClose={() => setBirthdayOpen(false)} people={birthdays} />
    </>
  );
}
