import { listUsers } from '@/lib/users';
import { listPendingResetRequests } from '@/lib/reset-requests';
import UserTable from '@/components/dashboard/admin/user-table';
import ResetRequestsPanel from '@/components/dashboard/admin/reset-requests-panel';

export default async function AdminUsersPage() {
  const [users, resetRequests] = await Promise.all([listUsers(), listPendingResetRequests()]);
  return (
    <>
      <ResetRequestsPanel requests={resetRequests} />
      <UserTable users={users} />
    </>
  );
}
