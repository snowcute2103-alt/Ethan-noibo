import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canView } from '@/lib/roles';
import { CULTURE_ARTICLES } from '@/lib/content';
import CultureArticles from '@/components/dashboard/culture-articles';
import CultureGalleryHero from '@/components/dashboard/culture-gallery-hero';

export default async function VanHoaPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const articles = CULTURE_ARTICLES.filter((c) => canView(session, c.visibility));

  return (
    <div className="bg-white">
      <CultureGalleryHero />

      <div className="mx-auto max-w-[1500px] px-8 py-20 sm:py-28">
        {articles.length === 0 ? (
          <p className="border border-dashed border-[#d5dfef] p-10 text-center text-base text-muted">
            Chưa có nội dung văn hoá nào cho khối của bạn.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-[240px_1fr]">
            <aside className="hidden lg:block">
              <nav aria-label="Mục lục Văn hoá" className="sticky top-10 flex flex-col gap-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">Trong bài này</p>
                {articles.map((a, i) => (
                  <a
                    key={a.id}
                    href={`#${a.id}`}
                    className="link-glow flex w-fit items-baseline gap-3 text-sm leading-snug text-ink transition-colors hover:text-blue"
                  >
                    <span className="font-heading text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>
                    {a.title}
                  </a>
                ))}
              </nav>
            </aside>
            <CultureArticles articles={articles} />
          </div>
        )}
      </div>
    </div>
  );
}
