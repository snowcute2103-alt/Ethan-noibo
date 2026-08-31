'use client';

import { useRouter } from 'next/navigation';
import PersonalTaskBoard from '@/components/dashboard/personal-task-board';

interface PersonalBoardRouteProps {
  today: string;
  ownerUserId: number;
  ownerName: string;
}

/** BGĐ xem Kanban cá nhân của người khác qua URL thật
 *  (/dashboard/giao-task/{slug-tên}) — cần wrapper 'use client' riêng vì nút
 *  "Bộ phận khác" của PersonalTaskBoard dùng router.push, không truyền được
 *  callback từ server component (page.tsx) sang thẳng client component. */
export default function PersonalBoardRoute({ today, ownerUserId, ownerName }: PersonalBoardRouteProps) {
  const router = useRouter();
  return (
    <PersonalTaskBoard
      today={today}
      ownerUserId={ownerUserId}
      viewerIsBgd
      ownerName={ownerName}
      onBack={() => router.push('/dashboard/giao-task')}
    />
  );
}
