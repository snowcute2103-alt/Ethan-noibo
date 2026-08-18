import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { RULE_DOCUMENTS } from '@/lib/content';
import { docIdsVisibleTo } from '@/lib/rule-permissions';
import SopDocumentView from '@/components/dashboard/sop-document';
import ruleHero from '@/public/images/rule/ingiay.jpg';

export default async function RulePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const visibleIds = await docIdsVisibleTo(session.userId, session.tier);
  const sopDocs = visibleIds === 'all' ? RULE_DOCUMENTS : RULE_DOCUMENTS.filter((d) => visibleIds.has(d.id));

  return (
    <div className="bg-white">
      <div className="relative flex min-h-[420px] items-end overflow-hidden sm:min-h-[560px]">
        <Image src={ruleHero} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-navy/70" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-[1440px] px-8 py-20 sm:py-28">
          <p className="font-heading text-sm font-medium uppercase tracking-[0.3em] text-cyan">Khối vận hành</p>
          <h1 className="mt-5 font-heading text-[clamp(3rem,8vw,7rem)] font-medium tracking-wide leading-[0.95] text-white">
            SOP & Quy trình
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-8 py-28 sm:py-36">
        {sopDocs.length === 0 ? (
          <p className="border border-dashed border-[#d5dfef] p-10 text-center text-base text-muted">
            Trang này hiện chưa có tài liệu SOP cho khối của bạn.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-20 lg:grid-cols-[260px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-10 flex flex-col gap-10">
                {sopDocs.map((doc) => (
                  <nav key={doc.id} aria-label={`Mục lục ${doc.title}`} className="flex flex-col gap-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted">Mục lục</p>
                    {doc.sections.map((s) => (
                      <a
                        key={s.id}
                        href={`#${s.id}`}
                        className="cursor-pointer text-sm leading-snug text-ink transition-colors hover:text-blue"
                      >
                        {s.title}
                      </a>
                    ))}
                  </nav>
                ))}
              </div>
            </aside>
            <div className="flex flex-col gap-36">
              {sopDocs.map((doc) => (
                <SopDocumentView key={doc.id} doc={doc} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
