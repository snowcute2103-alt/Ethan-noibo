import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canView } from '@/lib/roles';
import { CULTURE_ARTICLES } from '@/lib/content';
import CultureGalleryHero from '@/components/dashboard/culture-gallery-hero';
import CultureFlowOverview from '@/components/dashboard/culture-flow-overview';

export default async function VanHoaPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const articles = CULTURE_ARTICLES.filter((c) => canView(session, c.visibility));

  return (
    <div className="bg-white">
      <CultureGalleryHero />
      {articles.length === 0 ? (
        <p className="mx-auto max-w-[1500px] border border-dashed border-[#d5dfef] p-10 text-center text-base text-muted">
          Chưa có nội dung văn hoá nào cho khối của bạn.
        </p>
      ) : (
        <CultureFlowOverview articles={articles} />
      )}
    </div>
  );
}
