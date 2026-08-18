import Image, { type StaticImageData } from 'next/image';
import type { CultureArticle } from '@/lib/content';
import VisibilityBadge from '@/components/visibility-badge';
import visionImg from '@/public/images/van-hoa/connguoi.jpg';
import founderImg from '@/public/images/van-hoa/hanhtrinh.jpg';
import orgImg from '@/public/images/van-hoa/office.jpg';
import cultureImg from '@/public/images/van-hoa/team-building.jpg';
import dongLongImg from '@/public/images/van-hoa/dong-long.jpg';
import tuTeImg from '@/public/images/van-hoa/tu-te.jpg';
import trachNhiemImg from '@/public/images/van-hoa/trachnhiem.jpg';
import caiTienImg from '@/public/images/van-hoa/caitien.jpg';
import benBiImg from '@/public/images/van-hoa/benbi.jpg';

const ARTICLE_IMAGES: Record<string, StaticImageData> = {
  'tam-nhin-su-menh-gia-tri': visionImg,
  'cau-chuyen-founder': founderImg,
  'co-cau-to-chuc': orgImg,
  'van-hoa-gan-ket-dai-ngo': cultureImg,
};

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
        const image = ARTICLE_IMAGES[a.id];
        return (
          <article
            key={a.id}
            className="grid grid-cols-1 gap-16 border-t border-navy/10 py-28 first:border-t-0 first:pt-0 sm:py-32 lg:grid-cols-[1fr_1.4fr] lg:gap-24"
          >
            <div className={`flex flex-col gap-9 ${reversed ? 'lg:order-2' : ''}`}>
              {image && (
                <div className="relative h-64 w-full overflow-hidden rounded-2xl sm:h-80">
                  <Image src={image} alt="" fill sizes="(min-width: 1024px) 420px, 100vw" className="object-cover" />
                </div>
              )}
              <div>
                <p className="font-heading text-sm font-medium uppercase tracking-[0.3em] text-blue">{a.kicker}</p>
                <h3 className="font-heading mt-4 text-4xl font-medium tracking-wide leading-tight text-navy sm:text-5xl">
                  {a.title}
                </h3>
              </div>
              <VisibilityBadge visibility={a.visibility} />
            </div>

            <div className={`flex flex-col gap-11 ${reversed ? 'lg:order-1' : ''}`}>
              <p className="font-heading max-w-prose text-2xl font-light leading-snug tracking-wide text-navy/80 sm:text-3xl">
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
        );
      })}
    </div>
  );
}
