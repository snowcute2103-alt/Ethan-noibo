import { Fragment } from 'react';
import Image, { type StaticImageData } from 'next/image';
import type { CultureArticle } from '@/lib/content';
import { CULTURE_ARTICLE_IMAGE } from '@/lib/content/images';
import VisibilityBadge from '@/components/visibility-badge';
import dongLongImg from '@/public/images/van-hoa/dong-long.jpg';
import tuTeImg from '@/public/images/van-hoa/tu-te.jpg';
import trachNhiemImg from '@/public/images/van-hoa/trachnhiem.jpg';
import caiTienImg from '@/public/images/van-hoa/caitien.jpg';
import benBiImg from '@/public/images/van-hoa/benbi.jpg';

const VALUE_IMAGES: Record<string, StaticImageData> = {
  'Đồng lòng': dongLongImg,
  'Tử tế': tuTeImg,
  'Trách nhiệm': trachNhiemImg,
  'Cải tiến': caiTienImg,
  'Bền bỉ': benBiImg,
};

function ValueGrid({ values }: { values: string[] }) {
  return (
    <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3">
      {values.map((value) => {
        const img = VALUE_IMAGES[value];
        return (
          <li key={value} className="group relative aspect-square overflow-hidden rounded-2xl">
            {img && (
              <Image
                src={img}
                alt=""
                fill
                sizes="240px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/10 to-transparent" aria-hidden="true" />
            <span className="font-heading absolute bottom-4 left-4 right-4 text-base font-medium tracking-wide text-white">
              {value}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function CultureArticles({ articles }: { articles: CultureArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <div className="flex flex-col">
      {articles.map((a, i) => {
        const reversed = i % 2 === 1;
        const image = CULTURE_ARTICLE_IMAGE[a.id];
        return (
          <Fragment key={a.id}>
            {i > 0 && <hr className="gradient-divider" aria-hidden="true" />}
            <article
              id={a.id}
              className="scroll-mt-10 grid grid-cols-1 gap-16 py-24 first:pt-0 sm:py-28 lg:grid-cols-[1fr_1.4fr] lg:gap-24"
            >
            <div className={`flex flex-col gap-9 ${reversed ? 'lg:order-2' : ''}`}>
              <span
                className="font-heading select-none bg-gradient-to-br from-cyan/40 to-gold/40 bg-clip-text text-6xl font-light leading-none text-transparent sm:text-7xl sm:leading-none"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              {image && (
                <div
                  style={{ '--glow-color': 'rgba(0, 210, 255, 0.3)' } as React.CSSProperties}
                  className="card-glow relative h-64 w-full overflow-hidden rounded-2xl sm:h-80"
                >
                  <Image src={image} alt="" fill sizes="(min-width: 1024px) 420px, 100vw" className="object-cover" />
                </div>
              )}
              <div>
                <p className="font-heading text-sm font-medium uppercase tracking-[0.3em] text-blue">{a.kicker}</p>
                <h3 className="font-heading mt-4 text-4xl font-medium tracking-wide leading-tight text-navy sm:text-5xl sm:leading-tight">
                  {a.title}
                </h3>
              </div>
              <VisibilityBadge visibility={a.visibility} />
            </div>

            <div className={`flex flex-col gap-11 ${reversed ? 'lg:order-1' : ''}`}>
              <p className="font-heading max-w-prose text-2xl font-light leading-snug tracking-wide text-navy/80 sm:text-3xl sm:leading-snug">
                &ldquo;{a.intro}&rdquo;
              </p>
              <div className="flex flex-col gap-11">
                {a.blocks.map((block) => (
                  <div key={block.heading}>
                    <h4 className="font-heading text-sm font-medium uppercase tracking-wide text-muted">
                      {block.heading}
                    </h4>
                    {block.paragraphs?.map((p, pi) => (
                      <p key={pi} className="mt-4 max-w-prose text-lg leading-relaxed text-ink">
                        {p}
                      </p>
                    ))}
                    {block.list &&
                      (block.heading === '5 giá trị cốt lõi' ? (
                        <div className="mt-5">
                          <ValueGrid values={block.list} />
                        </div>
                      ) : (
                        <ul className="mt-4 flex flex-col gap-3">
                          {block.list.map((item, li) => (
                            <li key={li} className="flex gap-3 text-lg leading-relaxed text-ink">
                              <span className="mt-2.5 h-1 w-4 shrink-0 bg-gold" aria-hidden="true" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      ))}
                  </div>
                ))}
              </div>
            </div>
            </article>
          </Fragment>
        );
      })}
    </div>
  );
}
