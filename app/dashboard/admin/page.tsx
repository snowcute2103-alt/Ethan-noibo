import { listUsers } from '@/lib/users';
import UserTable from '@/components/dashboard/admin/user-table';

export default async function AdminUsersPage() {
  const users = await listUsers();
  return <UserTable users={users} />;
}
