'use client';

import { motion } from 'motion/react';
import type { CultureArticle } from '@/lib/content';
import FlowArt, { FlowSection } from '@/components/ui/story-scroll';
import { CultureArticleDetail } from '@/components/dashboard/culture-article-detail';
import { FounderStoryContent } from '@/components/dashboard/founder-story-content';
import FounderStoryFlipbook from '@/components/dashboard/founder-story-flipbook';
import AirHockeyGame from '@/components/dashboard/air-hockey-game';
import { ParallaxHero } from '@/components/ui/parallax-scrolling';
import parallaxLayerBgImg from '@/public/images/van-hoa/parallax-layer-bg.webp';
import parallaxLayerMidImg from '@/public/images/van-hoa/parallax-layer-mid.webp';
import parallaxLayerFgImg from '@/public/images/van-hoa/parallax-layer-fg.webp';
import { useReducedEffects } from '@/lib/use-reduced-effects';

const CHAPTER_STARS = [
  { top: '8%', left: '6%', size: 2, duration: 3.4, delay: 0 },
  { top: '18%', left: '16%', size: 2, duration: 4.2, delay: 0.8 },
  { top: '6%', left: '28%', size: 3, duration: 3.8, delay: 1.6 },
  { top: '22%', left: '38%', size: 2, duration: 3.1, delay: 0.3 },
  { top: '10%', left: '52%', size: 2, duration: 4.6, delay: 2.2 },
  { top: '26%', left: '62%', size: 3, duration: 3.5, delay: 1.1 },
  { top: '14%', left: '74%', size: 2, duration: 4, delay: 0.5 },
  { top: '30%', left: '84%', size: 2, duration: 3.7, delay: 1.9 },
  { top: '38%', left: '10%', size: 2, duration: 4.3, delay: 0.9 },
  { top: '44%', left: '46%', size: 3, duration: 3.3, delay: 1.4 },
  { top: '40%', left: '92%', size: 2, duration: 4.1, delay: 2.4 },
  { top: '55%', left: '22%', size: 2, duration: 3.6, delay: 0.6 },
];

/** Hạt sáng ấm trôi lên nền chương "Văn hoá" — cùng cấu trúc với CHAPTER_STARS nhưng chuyển động (float-drift) thay vì đứng yên nhấp nháy (twinkle), để 2 chương liền kề có khí chất riêng. */
const CULTURE_PARTICLES = [
  { top: '78%', left: '8%', size: 5, duration: 7.5, delay: 0, driftX: '10px' },
  { top: '85%', left: '20%', size: 4, duration: 8.5, delay: 1.2, driftX: '-14px' },
  { top: '70%', left: '32%', size: 6, duration: 7, delay: 2.4, driftX: '18px' },
  { top: '90%', left: '46%', size: 4, duration: 9, delay: 0.6, driftX: '-10px' },
  { top: '75%', left: '58%', size: 5, duration: 8, delay: 3, driftX: '12px' },
  { top: '82%', left: '70%', size: 4, duration: 7.8, delay: 1.8, driftX: '-16px' },
  { top: '88%', left: '82%', size: 6, duration: 8.6, delay: 0.9, driftX: '14px' },
  { top: '72%', left: '92%', size: 4, duration: 7.2, delay: 2.7, driftX: '-8px' },
];

/** Tên riêng cho từng chương, không lấy từ field kicker gốc vì 2 bài đầu cùng chung kicker "Về Ethan", dễ gây nhầm hai chương là một. */
const CHAPTER_LABELS = ['Về Ethan', 'Câu chuyện Founder', 'Cơ cấu tổ chức Ethan', 'Văn hoá', 'Giải trí'];

/** Bốn "chương" đầu trang Văn hoá dùng đúng nội dung thật của 4 bài viết bên dưới (Về Ethan / Câu chuyện Founder /
 *  Cơ cấu tổ chức / Văn hoá); chương 05 là phần giải trí cố định (mini game Air Hockey), không gắn với bài viết nào. */
export default function CultureFlowOverview({ articles }: { articles: CultureArticle[] }) {
  const reduceEffects = useReducedEffects();

  if (articles.length === 0) return null;

  return (
    <FlowArt aria-label="Tổng quan Văn hoá Ethan">
      {articles.slice(0, 4).map((article, i) => {
        if (i === 0) {
          return (
            <FlowSection key={article.id} aria-label={article.title} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
              <p className="relative text-xs font-medium uppercase tracking-[0.2em]">
                {String(i + 1).padStart(2, '0')}. {CHAPTER_LABELS[i]}
              </p>
              <hr className="relative my-[2vw] border-t border-white/20" />
              <div className="relative mx-auto w-full max-w-[1500px] py-8">
                <CultureArticleDetail
                  article={article}
                  index={i}
                  showNumber={false}
                  showValuesBadge
                  theme="dark"
                  insertAfterHeading={{ heading: 'Sứ mệnh', node: <FounderStoryFlipbook /> }}
                />
              </div>
            </FlowSection>
          );
        }

        if (i === 1) {
          return (
            <FlowSection
              id={article.id}
              key={article.id}
              aria-label={article.title}
              style={{ backgroundColor: '#000000', color: '#ffffff' }}
              rotateDeg={8}
            >
              <div className="relative -mx-[4vw] -mt-[clamp(2rem,8vw,4vw)]">
                <div className="absolute inset-x-0 top-0 z-10 px-[4vw] pt-[clamp(2rem,8vw,4vw)]">
                  <p className="relative text-xs font-medium uppercase tracking-[0.2em] text-white">
                    {String(i + 1).padStart(2, '0')}. {CHAPTER_LABELS[i]}
                  </p>
                  <hr className="relative mt-[2vw] border-t border-white" />
                </div>
                <ParallaxHero
                  title="Ethan Ecom"
                  layer1={parallaxLayerBgImg}
                  layer2={parallaxLayerMidImg}
                  layer4={parallaxLayerFgImg}
                />
              </div>

              <div className="relative -mx-[4vw] bg-black px-[4vw] py-[3vw] sm:py-[2.5vw]">
                <FounderStoryContent article={article} />
              </div>
            </FlowSection>
          );
        }

        if (i === 2) {
          return (
            <FlowSection
              key={article.id}
              aria-label={article.title}
              style={{ backgroundColor: '#1A2745', color: '#ffffff' }}
              rotateDeg={8}
            >
              <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                {CHAPTER_STARS.map((star, si) => (
                  <span
                    key={si}
                    className="animate-twinkle absolute rounded-full bg-white"
                    style={{
                      top: star.top,
                      left: star.left,
                      width: star.size,
                      height: star.size,
                      animationDuration: `${star.duration}s`,
                      animationDelay: `${star.delay}s`,
                    }}
                  />
                ))}
                <span
                  className="animate-org-glow absolute -left-[10%] top-[10%] h-[45vw] w-[45vw] rounded-full blur-3xl"
                  style={{ background: 'radial-gradient(circle, rgba(0,210,255,0.35), transparent 70%)' }}
                />
                <span
                  className="animate-org-glow absolute -right-[15%] bottom-[5%] h-[38vw] w-[38vw] rounded-full blur-3xl"
                  style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.3), transparent 70%)', animationDelay: '2.5s' }}
                />
              </div>

              <motion.p
                initial={reduceEffects ? false : { opacity: 0, letterSpacing: '0em' }}
                animate={reduceEffects ? { opacity: 1, letterSpacing: '0.2em' } : undefined}
                whileInView={reduceEffects ? undefined : { opacity: 1, letterSpacing: '0.2em' }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                className="relative text-xs font-medium uppercase"
              >
                {String(i + 1).padStart(2, '0')}. {CHAPTER_LABELS[i]}
              </motion.p>
              <hr className="relative my-[2vw] border-t border-white/20" />
              <div className="relative mx-auto w-full max-w-[1500px] py-8">
                <CultureArticleDetail article={article} index={i} showNumber={false} theme="dark" />
              </div>
            </FlowSection>
          );
        }

        return (
          <FlowSection
            key={article.id}
            aria-label={article.title}
            style={{ backgroundColor: '#003A8C', color: '#ffffff' }}
            rotateDeg={8}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              {CULTURE_PARTICLES.map((p, pi) => (
                <span
                  key={pi}
                  className="animate-float-drift absolute rounded-full bg-gold"
                  style={{
                    top: p.top,
                    left: p.left,
                    width: p.size,
                    height: p.size,
                    animationDuration: `${p.duration}s`,
                    animationDelay: `${p.delay}s`,
                    ['--float-drift-x' as string]: p.driftX,
                  }}
                />
              ))}
            </div>

            <motion.p
              initial={reduceEffects ? false : { opacity: 0, letterSpacing: '0em' }}
              animate={reduceEffects ? { opacity: 1, letterSpacing: '0.2em' } : undefined}
              whileInView={reduceEffects ? undefined : { opacity: 1, letterSpacing: '0.2em' }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative text-xs font-medium uppercase"
            >
              {String(i + 1).padStart(2, '0')}. {CHAPTER_LABELS[i]}
            </motion.p>
            <hr className="relative my-[2vw] border-t border-white/25" />
            <div className="relative mx-auto w-full max-w-[1500px] py-8">
              <CultureArticleDetail article={article} index={i} showNumber={false} theme="dark" />
            </div>
          </FlowSection>
        );
      })}

      <FlowSection aria-label={CHAPTER_LABELS[4]} style={{ backgroundColor: '#04060a', color: '#ffffff' }} rotateDeg={8}>
        <p className="relative text-xs font-medium uppercase tracking-[0.2em]">05. {CHAPTER_LABELS[4]}</p>
        <hr className="relative my-[2vw] border-t border-white/20" />
        <div className="relative mx-auto flex w-full max-w-[1500px] flex-1 items-center justify-center py-8">
          <AirHockeyGame />
        </div>
      </FlowSection>
    </FlowArt>
  );
}
