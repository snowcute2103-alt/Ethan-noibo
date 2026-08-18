import { Building2 } from 'lucide-react';
import { departmentLabel, tierLabel } from '@/lib/roles';
import type { Visibility } from '@/lib/content';

/** Nhãn "nội dung này dành cho khối nào" — giúp người dùng hiểu vì sao họ thấy/không thấy một mục. */
export default function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  const scope =
    visibility.departments === 'all'
      ? 'Toàn công ty'
      : visibility.departments.map(departmentLabel).join(' · ');
  const tier = visibility.minTier && visibility.minTier !== 'staff' ? tierLabel(visibility.minTier) : null;

  return (
    <span className="inline-flex items-center gap-2 border border-[#d5dfef] bg-surface-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
      <Building2 size={13} strokeWidth={2} aria-hidden="true" />
      {scope}
      {tier && <span className="text-blue">· {tier} trở lên</span>}
    </span>
  );
}
