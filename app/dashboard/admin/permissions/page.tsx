import { listUsers } from '@/lib/users';
import { listPermissionsForDoc } from '@/lib/rule-permissions';
import { RULE_DOCUMENTS } from '@/lib/content';
import PermissionChecklist from '@/components/dashboard/admin/permission-checklist';

export default async function AdminPermissionsPage() {
  const users = await listUsers();
  const grantsByDoc: Record<string, number[]> = {};
  for (const doc of RULE_DOCUMENTS) {
    grantsByDoc[doc.id] = await listPermissionsForDoc(doc.id);
  }

  return (
    <PermissionChecklist
      docs={RULE_DOCUMENTS.map((d) => ({ id: d.id, title: d.title }))}
      users={users.filter((u) => u.isActive)}
      grantsByDoc={grantsByDoc}
    />
  );
}
