import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canView, departmentLabel } from '@/lib/roles';
import { listUsers } from '@/lib/users';
import { RECOGNITION_LISTS } from '@/lib/content';
import RecognitionWall from '@/components/dashboard/recognition-wall';
import FireworkBurst from '@/components/dashboard/firework-burst';
import Reveal from '@/components/reveal';
import SphereImageGrid, { type ImageData } from '@/components/ui/img-sphere';
import money1 from '@/public/images/khenthuong/money-1.png';
import money2 from '@/public/images/khenthuong/money-2.png';
import money3 from '@/public/images/khenthuong/money-3.png';

export default async function KhenThuongPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const lists = RECOGNITION_LISTS.filter((r) => canView(session, r.visibility));
  const users = await listUsers();
  const teamAvatars: ImageData[] = users.map((u) => ({
    id: String(u.id),
    src: u.avatarUrl ?? '',
    alt: u.fullName,
    title: u.fullName,
    description: departmentLabel(u.department),
  }));

  return (
    <div className="theme-light-surface relative overflow-hidden bg-gradient-to-b from-[#FFF5F8] via-white to-white">
      <div className="relative mx-auto flex max-w-[1500px] flex-col gap-10 px-4 py-10 sm:px-6 sm:py-12 min-[1025px]:gap-32 min-[1025px]:px-8 min-[1025px]:py-36">
        <div className="recognition-hero-grid relative grid grid-cols-1 items-center gap-7 overflow-visible min-[1025px]:grid-cols-[1fr_600px] min-[1025px]:gap-14">
          <Image
            src={money1}
            alt=""
            aria-hidden="true"
            priority={false}
            className="desktop-visual-effect pointer-events-none absolute -left-24 top-0 z-[5] hidden w-[520px] -rotate-12 opacity-[0.22] blur-[1px] min-[1025px]:block"
          />
          <Image
            src={money2}
            alt=""
            aria-hidden="true"
            priority={false}
            className="desktop-visual-effect pointer-events-none absolute left-[8%] top-[42%] z-[5] hidden w-[400px] rotate-[18deg] opacity-[0.18] blur-[1px] min-[1025px]:block"
          />
          <Image
            src={money3}
            alt=""
            aria-hidden="true"
            priority={false}
            className="desktop-visual-effect pointer-events-none absolute -left-16 bottom-0 z-[5] hidden w-[500px] rotate-[8deg] opacity-[0.18] blur-[1px] min-[1025px]:block"
          />
          <FireworkBurst />
          <div className="recognition-hero-copy relative z-10 text-center min-[1025px]:text-left">
            <p className="font-heading text-xs font-medium uppercase tracking-[0.2em] text-[#FF6F91] min-[1025px]:text-sm min-[1025px]:tracking-[0.3em]">Wall of fame</p>
            <h2 className="mt-3 font-heading text-[clamp(2rem,5.5vw,3.5rem)] font-light uppercase tracking-wide leading-[0.98] text-navy min-[1025px]:mt-5 min-[1025px]:text-[clamp(2.25rem,5.5vw,4.75rem)] min-[1025px]:leading-[0.95]">
              Khen thưởng
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted sm:text-base min-[1025px]:mx-0 min-[1025px]:mt-6 min-[1025px]:text-lg">
              Cảm ơn những đóng góp nổi bật mỗi tháng — tinh thần đồng lòng làm nên Ethan.
            </p>
          </div>
          <div className="desktop-visual-effect relative z-10 mx-auto hidden min-[1025px]:block">
            <SphereImageGrid
              images={teamAvatars}
              containerSize={600}
              sphereRadius={260}
              baseImageScale={0.16}
              hoverScale={1.3}
              dragSensitivity={0.6}
              momentumDecay={0.96}
              autoRotate
              autoRotateSpeed={0.15}
            />
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
