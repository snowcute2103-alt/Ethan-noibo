import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canView } from '@/lib/roles';
import { CULTURE_ARTICLES } from '@/lib/content';
import CultureArticles from '@/components/dashboard/culture-articles';
import heroImg from '@/public/images/van-hoa/story-hope.jpg';

export default async function VanHoaPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const articles = CULTURE_ARTICLES.filter((c) => canView(session, c.visibility));

  return (
    <div className="bg-white">
      <div className="relative flex min-h-[520px] items-end overflow-hidden sm:min-h-[680px]">
        <Image src={heroImg} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-navy/10" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-[1320px] px-8 py-20 sm:py-28">
          <p className="font-heading text-sm font-medium uppercase tracking-[0.3em] text-cyan">Câu chuyện Ethan</p>
          <h2 className="mt-6 max-w-3xl font-heading text-[clamp(3.25rem,9vw,8rem)] font-medium tracking-wide leading-[1.02] text-white">
            Văn hoá
          </h2>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/80">
            &ldquo;Đồng lòng đồng sức, bứt phá gặt thành công&rdquo; — tầm nhìn, con người và những câu chuyện làm
            nên Ethan, dành riêng cho nhân sự nội bộ.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-8 pb-10">
        {articles.length === 0 ? (
          <p className="my-14 border border-dashed border-[#d5dfef] p-10 text-center text-base text-muted">
            Chưa có nội dung văn hoá nào cho khối của bạn.
          </p>
        ) : (
          <CultureArticles articles={articles} />
        )}
      </div>
    </div>
  );
}
