'use client';

import { useRouter } from 'next/navigation';
import PersonalTaskBoard from '@/components/dashboard/personal-task-board';
import type { PersonalBoardCore } from '../team-board-data';

interface PersonalBoardRouteProps {
  today: string;
  ownerUserId: number;
  ownerName: string;
  ownerAvatarUrl: string | null;
  initialBoard: PersonalBoardCore;
}

/** BGĐ xem Kanban cá nhân của người khác qua URL thật
 *  (/dashboard/giao-task/{slug-tên}) — cần wrapper 'use client' riêng vì nút
 *  "Bộ phận khác" của PersonalTaskBoard dùng router.push, không truyền được
 *  callback từ server component (page.tsx) sang thẳng client component. */
export default function PersonalBoardRoute({ today, ownerUserId, ownerName, ownerAvatarUrl, initialBoard }: PersonalBoardRouteProps) {
  const router = useRouter();
  return (
    <PersonalTaskBoard
      today={today}
      ownerUserId={ownerUserId}
      viewerIsBgd
      ownerName={ownerName}
      ownerAvatarUrl={ownerAvatarUrl}
      initialBoard={initialBoard}
      onBack={() => router.push('/dashboard/giao-task')}
    />
  );
}
