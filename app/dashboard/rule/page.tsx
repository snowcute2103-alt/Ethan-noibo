import { ArrowUpRight } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canView } from '@/lib/roles';
import { RULE_DOCUMENTS, POLICIES, NOTICES } from '@/lib/content';
import { listRules } from '@/lib/rules';
import { docIdsVisibleTo } from '@/lib/rule-permissions';
import { RULE_DOC_IMAGE, CATEGORY_IMAGE, NOTICE_IMAGE, FALLBACK_IMAGE } from '@/lib/content/images';
import SopDocumentView from '@/components/dashboard/sop-document';
import RegulationTeaserCard from '@/components/dashboard/regulation-teaser-card';
import PolicyCard from '@/components/dashboard/policy-card';
import NoticeBanner from '@/components/dashboard/notice-banner';
import { Spotlight } from '@/components/ui/spotlight';

/** Duy nhất thông báo này mang nội dung "quy định" (lịch mặc đồng phục) — Notice nói chung là tin ngắn hạn,
 *  không phải mọi Notice đều phù hợp đứng cạnh SOP, nên chọn đích danh thay vì gộp cả NOTICES. */
const DRESS_CODE_NOTICE_ID = 'quy-dinh-len-do-thu-2-thu-6';

export default async function RulePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const allRules = [...RULE_DOCUMENTS, ...(await listRules())];
  const visibleIds = await docIdsVisibleTo(session.userId, session.tier);
  const sopDocs = visibleIds === 'all' ? allRules : allRules.filter((d) => visibleIds.has(d.id));
  const heroImage = sopDocs[0] ? (RULE_DOC_IMAGE[sopDocs[0].id] ?? FALLBACK_IMAGE) : FALLBACK_IMAGE;

  // Nội dung phụ đi kèm SOP trên trang này — Chính sách (quy định có cấu trúc) + 1 thông báo quy định lên đồ.
  const policies = POLICIES.filter((p) => canView(session, p.visibility));
  const dressCodeNotice = NOTICES.find((n) => n.id === DRESS_CODE_NOTICE_ID && canView(session, n.visibility));
  const regulationItems: Array<{ key: string; node: React.ReactNode }> = [
    ...policies.map((p) => ({
      key: `policy-${p.id}`,
      node: (
        <RegulationTeaserCard
          image={CATEGORY_IMAGE['Chính sách'] ?? FALLBACK_IMAGE}
          kicker="Chính sách"
          title={p.title}
          intro={p.intro}
          meta={`Hiệu lực ${p.effectiveDate}`}
        >
          <PolicyCard policy={p} />
        </RegulationTeaserCard>
      ),
    })),
    ...(dressCodeNotice
      ? [
          {
            key: `notice-${dressCodeNotice.id}`,
            node: (
              <RegulationTeaserCard
                image={NOTICE_IMAGE[dressCodeNotice.id] ?? CATEGORY_IMAGE['Thông báo'] ?? FALLBACK_IMAGE}
                kicker="Thông báo"
                title={dressCodeNotice.title}
                intro={dressCodeNotice.body}
                meta={dressCodeNotice.date}
              >
                <NoticeBanner notices={[dressCodeNotice]} />
              </RegulationTeaserCard>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="bg-white">
      <div className="relative overflow-hidden bg-navy-deep">
        <div className="glow-orb -right-20 top-10 h-80 w-80 bg-cyan/25" aria-hidden="true" />
        <div className="glow-orb bottom-0 left-1/4 h-56 w-56 bg-blue/25" aria-hidden="true" />
        <Spotlight className="-top-40 left-1/3 md:-top-20" fill="white" />
        <div className="rule-hero-grid" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-[1500px] px-4 py-10 sm:px-6 sm:py-12 min-[1025px]:px-8 min-[1025px]:py-28">
          <div
            className="rule-hover-banner"
            style={
              {
                '--rule-banner-image': `linear-gradient(120deg, rgba(16, 26, 48, 0.78), rgba(0, 82, 204, 0.48)), url("${heroImage.src}")`,
              } as React.CSSProperties
            }
          >
            <div className="rule-hover-banner-inner">
              <div className="relative z-10 px-4 text-center sm:px-8 min-[1025px]:px-14">
                <p className="font-heading text-xs font-medium uppercase tracking-[0.2em] text-cyan min-[1025px]:text-sm min-[1025px]:tracking-[0.3em]">Khối vận hành</p>
                <h1 className="rule-page-title title-glow mt-3 font-heading text-[clamp(2.25rem,7vw,4rem)] font-medium leading-[0.98] tracking-wide text-white min-[1025px]:mt-5 min-[1025px]:text-[clamp(2.75rem,7vw,5.5rem)] min-[1025px]:leading-[0.95]">
                  SOP &amp; Quy trình
                </h1>
                <div className="gradient-divider mx-auto mt-4 w-16 min-[1025px]:mt-6 min-[1025px]:w-24" aria-hidden="true" />
              </div>
            </div>
          </div>

          {sopDocs.length > 0 && (
            <div className="mt-7 flex flex-col border-t border-white/15 min-[1025px]:mt-12">
              {sopDocs.map((doc, i) => (
                <a
                  key={doc.id}
                  href={`#${doc.id}`}
                  style={{ animationDelay: `${i * 70}ms` }}
                  className="animate-fade-up group relative flex min-h-[56px] items-center justify-between gap-3 overflow-hidden border-b border-white/15 py-3.5 pl-0 transition-all duration-300 hover:bg-white/5 hover:pl-2 min-[1025px]:gap-6 min-[1025px]:py-6 min-[1025px]:hover:pl-4"
                >
                  <span
                    className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-gradient-to-b from-cyan to-gold-2 transition-transform duration-300 group-hover:scale-y-100"
                    aria-hidden="true"
                  />
                  <div className="flex min-w-0 items-baseline gap-3 min-[1025px]:gap-5">
                    <span className="font-heading shrink-0 text-sm text-white/40 transition-colors duration-300 group-hover:text-cyan">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-heading truncate text-base font-medium text-white sm:text-lg min-[1025px]:text-2xl">{doc.title}</h2>
                      <p className="mt-1 line-clamp-1 max-w-xl text-xs text-white/60 min-[1025px]:text-sm">{doc.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="hidden text-xs uppercase tracking-wide text-white/50 sm:inline">v{doc.version}</span>
                    <ArrowUpRight
                      size={18}
                      strokeWidth={2.5}
                      className="text-white/50 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-cyan"
                      aria-hidden="true"
                    />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-12 min-[1025px]:px-8 min-[1025px]:py-36">
        {sopDocs.length === 0 ? (
          <p className="border border-dashed border-[#d5dfef] p-10 text-center text-base text-muted">
            Trang này hiện chưa có tài liệu SOP cho khối của bạn.
          </p>
        ) : (
          <div className="rule-content-grid grid grid-cols-1 gap-8 min-[1025px]:grid-cols-[1fr_360px] min-[1025px]:items-start min-[1025px]:gap-14">
            <div>
              <div className="text-center">
                <p className="font-heading text-xs font-bold uppercase tracking-[0.35em] text-blue">
                  Tin chính · SOP &amp; Quy trình
                </p>
                <div className="mx-auto mt-3 h-px w-16 bg-blue/60" aria-hidden="true" />
              </div>

              <div className="mt-6 border-2 border-navy p-4 sm:p-5 min-[1025px]:mt-8 min-[1025px]:p-10">
                <div className="flex flex-col gap-8 min-[1025px]:gap-12">
                  {sopDocs.map((doc) => (
                    <SopDocumentView key={doc.id} doc={doc} image={RULE_DOC_IMAGE[doc.id] ?? FALLBACK_IMAGE} />
                  ))}
                </div>
              </div>
            </div>

            {regulationItems.length > 0 && (
              <div className="flex flex-col gap-8">
                <div>
                  <p className="font-heading text-xs font-bold uppercase tracking-[0.35em] text-blue">
                    Quy định vận hành
                  </p>
                  <div className="mt-3 h-px w-16 bg-blue/60" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-6">
                  {regulationItems.map((item, index) => (
                    <div key={item.key} className={index > 0 ? 'border-t border-black pt-8' : undefined}>
                      {item.node}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
