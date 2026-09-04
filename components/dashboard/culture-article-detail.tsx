'use client';

import { Fragment, type ReactNode } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { Quote } from 'lucide-react';
import type { CultureArticle } from '@/lib/content';
import { CULTURE_ARTICLE_IMAGE } from '@/lib/content/images';
import VisibilityBadge from '@/components/visibility-badge';
import { SpinningText } from '@/components/ui/spinning-text';
import { cn } from '@/lib/utils';
import { useReducedEffects } from '@/lib/use-reduced-effects';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Bản chi tiết đầy đủ 1 bài viết văn hoá (light theme, 2 cột), dùng chung giữa danh sách bài viết và chương 1 của FlowArt overview. */
export function CultureArticleDetail({
  article,
  index,
  reversed = false,
  className,
  showNumber = true,
  showValuesBadge = false,
  theme = 'light',
  insertAfterHeading,
}: {
  article: CultureArticle;
  index: number;
  reversed?: boolean;
  className?: string;
  showNumber?: boolean;
  showValuesBadge?: boolean;
  theme?: 'light' | 'dark';
  /** Chèn nội dung tuỳ ý ngay sau block có `heading` khớp, trong cột phải (nơi các block văn bản render) —
   *  có đường kẻ trắng + khoảng cách phía trên để tách khỏi đoạn văn ngay trước. */
  insertAfterHeading?: { heading: string; node: ReactNode };
}) {
  const reduceMotion = Boolean(useReducedMotion()) || useReducedEffects();
  const image = CULTURE_ARTICLE_IMAGE[article.id];

  const staggerParent: Variants = { hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.14 } } };
  const fadeUp: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } } }
    : { hidden: { opacity: 0, y: 26 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } } };
  const revealBlur: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } } }
    : {
        hidden: { opacity: 0, scale: 0.94, filter: 'blur(10px)' },
        visible: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE_OUT } },
      };

  return (
    <motion.article
      id={article.id}
      initial={reduceMotion ? false : 'hidden'}
      animate={reduceMotion ? 'visible' : undefined}
      whileInView={reduceMotion ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.15 }}
      variants={staggerParent}
      className={cn('grid grid-cols-1 gap-8 min-[1025px]:grid-cols-[1fr_1.4fr] min-[1025px]:gap-24', className)}
    >
      <div className={`flex flex-col gap-6 min-[1025px]:gap-9 ${reversed ? 'min-[1025px]:order-2' : ''}`}>
        {showNumber && (
          <div className="relative">
            <div
              className="glow-orb -left-6 -top-10 h-32 w-32 opacity-70"
              style={{ background: 'radial-gradient(circle, rgba(0,210,255,0.35), rgba(245,166,35,0.2), transparent 70%)' }}
              aria-hidden="true"
            />
            <motion.span
              variants={fadeUp}
              className="font-heading relative select-none bg-gradient-to-br from-cyan/40 to-gold/40 bg-clip-text text-6xl font-light leading-none text-transparent sm:text-7xl sm:leading-none"
              aria-hidden="true"
            >
              {String(index + 1).padStart(2, '0')}
            </motion.span>
          </div>
        )}
        {image && (
          <div className="relative">
            <motion.div
              variants={revealBlur}
              whileHover={reduceMotion ? undefined : { y: -6 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              style={{ '--glow-color': 'rgba(0, 210, 255, 0.3)' } as React.CSSProperties}
              className="card-glow relative h-52 w-full overflow-hidden sm:h-64 min-[1025px]:h-96"
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="(min-width: 1024px) 420px, 100vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </motion.div>
            {showValuesBadge && (
              <div
                className="absolute -top-8 right-0 z-20 flex h-24 w-24 items-center justify-center rounded-full bg-black/20 backdrop-blur-[2px] sm:-top-10 sm:h-28 sm:w-28 min-[1025px]:-right-16 min-[1025px]:-top-20 min-[1025px]:h-44 min-[1025px]:w-44"
                aria-hidden="true"
              >
                <SpinningText
                  text="Đồng lòng • Tử tế • Trách nhiệm • Cải tiến • Bền Bỉ • Đồng lòng • Tử tế • Trách nhiệm • Cải tiến • Bền Bỉ • "
                  radius={40}
                  speed={16}
                  textClassName="text-[6.5px] font-light tracking-normal fill-white"
                  className="absolute inset-0"
                />
              </div>
            )}
          </div>
        )}
        <motion.div variants={fadeUp}>
          <p
            className={`font-heading text-xs font-medium uppercase tracking-[0.2em] min-[1025px]:text-sm min-[1025px]:tracking-[0.3em] ${theme === 'dark' ? 'text-cyan' : 'text-blue'}`}
          >
            {article.kicker}
          </p>
          <h3
            className={`font-heading mt-3 text-2xl font-light uppercase tracking-wide leading-tight sm:text-3xl min-[1025px]:mt-4 min-[1025px]:text-5xl min-[1025px]:leading-tight ${
              theme === 'dark' ? 'text-white' : 'text-navy'
            }`}
          >
            {article.title}
          </h3>
        </motion.div>
        <motion.div variants={fadeUp}>
          <VisibilityBadge visibility={article.visibility} theme={theme} />
        </motion.div>
      </div>

      <div className={`flex flex-col gap-7 min-[1025px]:gap-11 ${reversed ? 'min-[1025px]:order-1' : ''}`}>
        <motion.div variants={revealBlur} className="relative">
          <Quote size={40} strokeWidth={1.5} className="mb-2 text-cyan/50" aria-hidden="true" />
          <p
            className={`font-heading max-w-prose text-lg font-light leading-snug tracking-wide sm:text-xl min-[1025px]:text-3xl min-[1025px]:leading-snug ${
              theme === 'dark' ? 'text-white/90' : 'text-navy/80'
            }`}
          >
            {article.intro}
          </p>
        </motion.div>
        <motion.div variants={staggerParent} className="flex flex-col gap-7 min-[1025px]:gap-11">
          {article.blocks.map((block) => (
            <Fragment key={block.heading}>
              <motion.div variants={fadeUp}>
                <h4
                  className={`font-heading text-sm font-medium uppercase tracking-wide ${
                    theme === 'dark' ? 'text-cyan/80' : 'text-muted'
                  }`}
                >
                  {block.heading}
                </h4>
                {block.paragraphs?.map((p, pi) => (
                  <p
                    key={pi}
                    className={`mt-3 max-w-prose text-sm leading-relaxed sm:text-base min-[1025px]:mt-4 min-[1025px]:text-lg ${theme === 'dark' ? 'text-white/85' : 'text-ink'}`}
                  >
                    {p}
                  </p>
                ))}
                {block.list && (
                  <ul className="mt-4 flex flex-col gap-3">
                    {block.list.map((item, li) => (
                      <li
                        key={li}
                        className={`flex gap-3 text-sm leading-relaxed sm:text-base min-[1025px]:text-lg ${theme === 'dark' ? 'text-white/85' : 'text-ink'}`}
                      >
                        <span className="mt-2.5 h-1 w-4 shrink-0 bg-gold" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
              {insertAfterHeading?.heading === block.heading && (
                <motion.div variants={fadeUp} className="mt-[50px]">
                  <hr className={`mb-8 border-t ${theme === 'dark' ? 'border-white/20' : 'border-navy/15'}`} />
                  {insertAfterHeading.node}
                </motion.div>
              )}
            </Fragment>
          ))}
        </motion.div>
      </div>
    </motion.article>
  );
}
