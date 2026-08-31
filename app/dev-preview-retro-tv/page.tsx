import RetroTv from '@/components/dashboard/retro-tv';

export default function DevPreviewRetroTvPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#04060a] p-10"
      style={{ containerType: 'size' }}
    >
      <div className="w-full max-w-6xl">
        <RetroTv />
      </div>
    </div>
  );
}
