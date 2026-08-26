import BirthdayTicket from '@/components/dashboard/birthday-ticket';

export default function DevPreviewTicketPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-2 p-10">
      <div className="w-full max-w-6xl">
        <BirthdayTicket />
      </div>
    </div>
  );
}
