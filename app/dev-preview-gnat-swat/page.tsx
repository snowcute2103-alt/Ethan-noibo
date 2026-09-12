import GnatSwatGame from '@/components/dashboard/gnat-swat-game';

export default function DevPreviewGnatSwatPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05080f] p-10">
      <div className="w-full max-w-4xl">
        <GnatSwatGame />
      </div>
    </div>
  );
}
