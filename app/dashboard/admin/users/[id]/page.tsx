import { notFound } from 'next/navigation';
import { findUserById } from '@/lib/users';
import UserForm from '@/components/dashboard/admin/user-form';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) notFound();

  const user = await findUserById(userId);
  if (!user) notFound();

  // Bỏ password_hash trước khi truyền cho UserForm ('use client') — Next.js serialize
  // nguyên props xuống trình duyệt, không được để mật khẩu đã băm lọt vào đó.
  const { passwordHash: _passwordHash, ...safeUser } = user;

  return <UserForm mode="edit" user={safeUser} />;
}
