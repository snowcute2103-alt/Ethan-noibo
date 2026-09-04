import { Skeleton } from '@/components/ui/skeleton';

/** Fallback tức thì khi Next.js đang chờ server loader của trang Giao Task
 *  (page.tsx / [code]/page.tsx) — layout dashboard dùng chung vẫn tương tác
 *  được trong lúc này. Cùng padding/bo góc/màu nền với TaskBoard và
 *  PersonalTaskBoard để không tạo layout shift lớn khi nội dung thật thay vào. */
export default function GiaoTaskLoading() {
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10" aria-busy="true" aria-live="polite">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-9 w-56" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-[var(--ui-radius-card)]" />
        ))}
      </div>

      <Skeleton className="mt-6 h-64 rounded-[var(--ui-radius-card)]" />
    </div>
  );
}
