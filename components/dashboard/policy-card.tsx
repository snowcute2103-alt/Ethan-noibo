import { CircleAlert, OctagonAlert, Info } from 'lucide-react';
import type { Policy, PolicyRule } from '@/lib/content';
import VisibilityBadge from '@/components/visibility-badge';

function severityStyles(severity?: PolicyRule['severity']) {
  if (severity === 'critical') return { icon: OctagonAlert, badge: 'bg-red-50 text-red-600', dot: 'text-red-600' };
  if (severity === 'warning') return { icon: CircleAlert, badge: 'bg-[#FFF3D6] text-[#B5720A]', dot: 'text-gold-2' };
  return { icon: Info, badge: 'bg-[#E7F0FF] text-blue', dot: 'text-blue' };
}

function RuleRow({ rule }: { rule: PolicyRule }) {
  const s = severityStyles(rule.severity);
  const Icon = s.icon;

  return (
    <li className="flex items-start gap-4 rounded-2xl px-4 py-4 transition-colors hover:bg-surface-2">
      <Icon size={20} strokeWidth={2.25} className={`mt-0.5 shrink-0 ${s.dot}`} aria-hidden="true" />
      <div className="flex-1">
        <p className="text-base leading-relaxed text-ink">{rule.text}</p>
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
    <article className="overflow-hidden rounded-[28px] border border-[#eef1f8] bg-white shadow-[0_10px_30px_-18px_rgba(26,39,69,0.25)]">
      <header className="rounded-t-[28px] bg-navy px-9 py-10 sm:px-12 sm:py-11">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-heading text-2xl font-medium tracking-wide text-white sm:text-3xl">{policy.title}</h3>
          <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white/70">
            Hiệu lực {policy.effectiveDate}
          </span>
        </div>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">{policy.intro}</p>
      </header>

      <div className="flex flex-col gap-11 px-9 py-11 sm:px-12 sm:py-12">
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

      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-b-[28px] bg-surface-2 px-9 py-7 sm:px-12">
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
