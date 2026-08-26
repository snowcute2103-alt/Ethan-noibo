import AirHockeyGame from '@/components/dashboard/air-hockey-game';

export default function DevPreviewAirHockeyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#04060a] p-10">
      <div className="w-full max-w-6xl">
        <AirHockeyGame />
      </div>
    </div>
  );
}
