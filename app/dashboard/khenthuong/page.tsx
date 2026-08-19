import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canView } from '@/lib/roles';
import { RECOGNITION_LISTS } from '@/lib/content';
import RecognitionWall from '@/components/dashboard/recognition-wall';
import MoneyRain from '@/components/dashboard/money-rain';
import FireworkBurst from '@/components/dashboard/firework-burst';
import Reveal from '@/components/reveal';
import teamPhoto from '@/public/images/khenthuong/doingu.jpg';

export default async function KhenThuongPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const lists = RECOGNITION_LISTS.filter((r) => canView(session, r.visibility));

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#FFF5F8] via-white to-white">
      <svg
        className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 opacity-40"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="100" fill="#FFD9E4" />
      </svg>
      <svg
        className="pointer-events-none absolute -right-20 top-40 h-72 w-72 opacity-30"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="100" fill="#CFF3FF" />
      </svg>
      <svg
        className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 opacity-30"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="100" fill="#FFECC2" />
      </svg>

      <div className="relative mx-auto flex max-w-[1360px] flex-col gap-32 px-8 py-28 sm:py-36">
        <div className="relative grid grid-cols-1 items-center gap-14 overflow-hidden sm:grid-cols-[1fr_260px]">
          <MoneyRain />
          <FireworkBurst />
          <div className="relative z-10 text-center sm:text-left">
            <p className="font-heading text-sm font-medium uppercase tracking-[0.3em] text-[#FF6F91]">Wall of fame</p>
            <h2 className="mt-5 font-heading text-[clamp(3.25rem,9vw,8.5rem)] font-medium tracking-wide leading-[0.95] text-navy">
              Khen thưởng
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-muted sm:mx-0">
              Cảm ơn những đóng góp nổi bật mỗi tháng — tinh thần đồng lòng làm nên Ethan.
            </p>
          </div>
          <div className="relative z-10 mx-auto hidden rotate-3 rounded-[20px] border-8 border-white bg-white shadow-[0_20px_50px_-16px_rgba(255,111,145,0.45)] sm:block">
            <div className="relative aspect-[4/5] w-[240px] overflow-hidden rounded-[8px]">
              <Image src={teamPhoto} alt="Đội ngũ Ethan Ecom" fill sizes="240px" className="object-cover" />
            </div>
          </div>
        </div>

        {lists.length === 0 ? (
          <p className="rounded-[24px] border border-dashed border-[#f3d6de] bg-white p-10 text-center text-base text-muted">
            Chưa có danh sách khen thưởng nào cho khối của bạn.
          </p>
        ) : (
          <Reveal>
            <RecognitionWall lists={lists} />
          </Reveal>
        )}
      </div>
    </div>
  );
}
