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
  /** true khi người xem là đồng đội (chỉ xem), false/mặc định là BGĐ xem hộ
   *  (toàn quyền quản lý) — xem requirePeerReadContext vs requirePersonalTaskContext. */
  readOnly?: boolean;
}

/** BGĐ (hoặc đồng đội, readOnly) xem Kanban cá nhân của người khác qua URL
 *  thật (/dashboard/giao-task/{slug-tên}) — cần wrapper 'use client' riêng vì
 *  nút "Bộ phận khác"/"Quay lại" của PersonalTaskBoard dùng router.push,
 *  không truyền được callback từ server component (page.tsx) sang thẳng
 *  client component. */
export default function PersonalBoardRoute({
  today,
  ownerUserId,
  ownerName,
  ownerAvatarUrl,
  initialBoard,
  readOnly = false,
}: PersonalBoardRouteProps) {
  const router = useRouter();
  return (
    <PersonalTaskBoard
      today={today}
      ownerUserId={ownerUserId}
      viewerIsBgd={!readOnly}
      readOnly={readOnly}
      ownerName={ownerName}
      ownerAvatarUrl={ownerAvatarUrl}
      initialBoard={initialBoard}
      onBack={() => router.push('/dashboard/giao-task')}
    />
  );
}
