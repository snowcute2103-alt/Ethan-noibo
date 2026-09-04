import { CircleAlert, OctagonAlert, Info } from 'lucide-react';
import type { Policy, PolicyRule } from '@/lib/content';
import VisibilityBadge from '@/components/visibility-badge';

export function severityStyles(severity?: PolicyRule['severity']) {
  if (severity === 'critical') return { icon: OctagonAlert, badge: 'bg-red-50 text-red-600', dot: 'text-red-600' };
  if (severity === 'warning') return { icon: CircleAlert, badge: 'bg-[#FFF3D6] text-[#B5720A]', dot: 'text-gold-2' };
  return { icon: Info, badge: 'bg-blue/10 text-blue', dot: 'text-blue' };
}

function RuleRow({ rule }: { rule: PolicyRule }) {
  const s = severityStyles(rule.severity);
  const Icon = s.icon;

  return (
    <li className="flex items-start gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-surface-2 min-[1025px]:gap-4 min-[1025px]:rounded-2xl min-[1025px]:px-4 min-[1025px]:py-4">
      <Icon size={20} strokeWidth={2.25} className={`mt-0.5 shrink-0 ${s.dot}`} aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm leading-relaxed text-ink min-[1025px]:text-base">{rule.text}</p>
        {rule.penalty && (
          <span className={`mt-2 inline-block rounded-full px-3.5 py-1.5 text-sm font-semibold ${s.badge}`}>
            {rule.penalty}
          </span>
        )}
      </div>
    </li>
  );
}

export default function PolicyCard({ policy }: { policy: Policy }) {
  return (
    <article className="overflow-hidden rounded-[16px] border border-[#eef1f8] bg-white shadow-[0_10px_30px_-18px_rgba(26,39,69,0.25)] min-[1025px]:rounded-[28px]">
      <header className="relative overflow-hidden rounded-t-[16px] bg-navy px-4 py-5 sm:px-6 sm:py-6 min-[1025px]:rounded-t-[28px] min-[1025px]:px-12 min-[1025px]:py-11">
        <div className="glow-orb -right-12 -top-16 h-52 w-52 bg-cyan/20" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-heading text-xl font-medium tracking-wide text-white sm:text-2xl min-[1025px]:text-3xl">{policy.title}</h3>
          <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white/70">
            Hiệu lực {policy.effectiveDate}
          </span>
        </div>
        <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-white/70 min-[1025px]:mt-4 min-[1025px]:text-base">{policy.intro}</p>
      </header>

      <div className="flex flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6 min-[1025px]:gap-11 min-[1025px]:px-12 min-[1025px]:py-12">
        {policy.groups.map((group) => (
          <section key={group.heading}>
            <h4 className="font-heading text-base font-medium uppercase tracking-wide text-navy">{group.heading}</h4>
            <ol className="mt-3 flex flex-col divide-y divide-[#f0f3f9]">
              {group.rules.map((rule, i) => (
                <RuleRow key={i} rule={rule} />
              ))}
            </ol>
          </section>
        ))}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-b-[16px] bg-surface-2 px-4 py-4 sm:px-6 min-[1025px]:rounded-b-[28px] min-[1025px]:px-12 min-[1025px]:py-7">
        {policy.notes.length > 0 && (
          <ul className="flex flex-col gap-2">
            {policy.notes.map((n, i) => (
              <li key={i} className="text-sm leading-relaxed text-muted">
                {n.text}
              </li>
            ))}
          </ul>
        )}
        <VisibilityBadge visibility={policy.visibility} />
      </footer>
    </article>
  );
}
