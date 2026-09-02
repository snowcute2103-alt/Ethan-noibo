/** Fallback tức thì khi Next.js đang chờ server loader của trang Giao Task
 *  (page.tsx / [code]/page.tsx) — layout dashboard dùng chung vẫn tương tác
 *  được trong lúc này. Cùng padding/bo góc/màu nền với TaskBoard và
 *  PersonalTaskBoard để không tạo layout shift lớn khi nội dung thật thay vào. */
export default function GiaoTaskLoading() {
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10" aria-busy="true" aria-live="polite">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 animate-pulse rounded-full bg-surface-2" />
          <div className="h-9 w-56 animate-pulse rounded-[10px] bg-surface-2" />
        </div>
        <div className="h-9 w-40 animate-pulse rounded-[10px] bg-surface-2" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-[16px] border border-[#e8edf5] bg-white" />
        ))}
      </div>

      <div className="mt-6 h-64 animate-pulse rounded-[16px] border border-[#e8edf5] bg-white" />
    </div>
  );
}
