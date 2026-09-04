'use client';

import { Fragment } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { Quote } from 'lucide-react';
import type { CultureArticle } from '@/lib/content';
import VisibilityBadge from '@/components/visibility-badge';
import { useReducedEffects } from '@/lib/use-reduced-effects';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** In đậm riêng cụm "đồng đội" trong đoạn văn kết bước ngoặt của founder — nhấn từ khoá cảm xúc. */
function renderParagraphWithEmphasis(text: string) {
  const parts = text.split('đồng đội');
  if (parts.length === 1) return text;
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && <strong className="font-semibold">đồng đội</strong>}
    </Fragment>
  ));
}

/** Khối nội dung nền đen của bài "Câu chuyện Founder" — kicker/tiêu đề/badge/quote/blocks — dùng chung giữa phần chi tiết bài viết và chương 2 của FlowArt overview. */
export function FounderStoryContent({ article }: { article: CultureArticle }) {
  const reduceMotion = Boolean(useReducedMotion()) || useReducedEffects();

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
    <motion.div
      initial={reduceMotion ? false : 'hidden'}
      animate={reduceMotion ? 'visible' : undefined}
      whileInView={reduceMotion ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.1 }}
      variants={staggerParent}
      className="flex flex-col items-center gap-7 text-center min-[1025px]:gap-11"
    >
      <motion.div variants={fadeUp}>
        <p className="font-heading text-xs font-medium uppercase tracking-[0.2em] text-cyan min-[1025px]:text-sm min-[1025px]:tracking-[0.3em]">{article.kicker}</p>
        <h3 className="font-heading mt-3 text-2xl font-light uppercase leading-tight tracking-wide text-white sm:text-3xl min-[1025px]:mt-4 min-[1025px]:text-5xl min-[1025px]:leading-tight">
          {article.title.split(/\s*—\s*|,\s+/).map((line, li, arr) => (
            <Fragment key={li}>
              {line}
              {li < arr.length - 1 && <br />}
            </Fragment>
          ))}
        </h3>
      </motion.div>
      <motion.div variants={fadeUp}>
        <VisibilityBadge visibility={article.visibility} theme="dark" />
      </motion.div>
      <motion.div variants={revealBlur} className="relative mx-auto text-center">
        <Quote size={40} strokeWidth={1.5} className="mx-auto mb-2 text-cyan/50" aria-hidden="true" />
        <p className="font-heading mx-auto max-w-prose text-lg font-light leading-snug tracking-wide text-white/90 sm:text-xl min-[1025px]:text-3xl min-[1025px]:leading-snug">
          {article.intro.split(/(?<=\.)\s+/).map((line, li, arr) => (
            <Fragment key={li}>
              {line}
              {li < arr.length - 1 && <br />}
            </Fragment>
          ))}
        </p>
      </motion.div>
      <motion.div variants={staggerParent} className="flex flex-col items-center gap-7 text-center min-[1025px]:gap-11">
        {article.blocks.map((block) => (
          <motion.div key={block.heading} variants={fadeUp}>
            <h4 className="font-heading text-sm font-medium uppercase tracking-wide text-cyan/80">{block.heading}</h4>
            {block.paragraphs?.map((p, pi) => (
              <p key={pi} className="mx-auto mt-3 max-w-prose text-sm font-light leading-relaxed text-white/85 sm:text-base min-[1025px]:mt-4 min-[1025px]:text-lg">
                {renderParagraphWithEmphasis(p)}
              </p>
            ))}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
