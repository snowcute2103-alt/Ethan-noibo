import { CULTURE_ARTICLES } from '@/lib/content';
import CultureGalleryHero from '@/components/dashboard/culture-gallery-hero';
import CultureFlowOverview from '@/components/dashboard/culture-flow-overview';

export default function DevPreviewVanHoaPage() {
  return (
    <div className="bg-white">
      <CultureGalleryHero />
      <CultureFlowOverview articles={CULTURE_ARTICLES} />
    </div>
  );
}
