import { notFound } from 'next/navigation';
import { findUserById } from '@/lib/users';
import UserForm from '@/components/dashboard/admin/user-form';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) notFound();

  const user = await findUserById(userId);
  if (!user) notFound();

  return <UserForm mode="edit" user={user} />;
}
