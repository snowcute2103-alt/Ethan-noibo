'use client';

import { useRouter } from 'next/navigation';
import PersonalTaskBoard from '@/components/dashboard/personal-task-board';
import type { PersonalBoardCore } from '../team-board-data';

interface PersonalBoardRouteProps {
  today: string;
  ownerUserId: number;
  /** Id người đang đăng nhập xem board này (BGĐ hoặc đồng đội) — quyết định
   *  quyền xoá task ở PersonalTaskDetailDrawer (chỉ người tạo/giao mới xoá được). */
  viewerUserId: number;
  ownerName: string;
  ownerAvatarUrl: string | null;
  initialBoard: PersonalBoardCore;
  /** Không còn dùng cho đồng đội (giờ cả nhóm ngang quyền, xem toàn bộ như
   *  BGĐ) — giữ lại cho các chế độ chỉ-xem khác trong tương lai nếu cần. */
  readOnly?: boolean;
}

/** BGĐ hoặc đồng đội (cùng team_label) xem VÀ giao task hộ Kanban cá nhân
 *  của người khác qua URL thật (/dashboard/giao-task/{slug-tên}) — cần
 *  wrapper 'use client' riêng vì
 *  nút "Bộ phận khác"/"Quay lại" của PersonalTaskBoard dùng router.push,
 *  không truyền được callback từ server component (page.tsx) sang thẳng
 *  client component. */
export default function PersonalBoardRoute({
  today,
  ownerUserId,
  viewerUserId,
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
      viewerUserId={viewerUserId}
      viewerIsBgd={!readOnly}
      readOnly={readOnly}
      ownerName={ownerName}
      ownerAvatarUrl={ownerAvatarUrl}
      initialBoard={initialBoard}
      onBack={() => router.push('/dashboard/giao-task')}
    />
  );
}
