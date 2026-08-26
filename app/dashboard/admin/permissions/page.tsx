import { listUsers } from '@/lib/users';
import { listPermissionsForDoc } from '@/lib/rule-permissions';
import { listRules } from '@/lib/rules';
import { RULE_DOCUMENTS } from '@/lib/content';
import PermissionChecklist from '@/components/dashboard/admin/permission-checklist';
import {
  grantPermissionAction,
  revokePermissionAction,
  bulkGrantPermissionAction,
  bulkRevokePermissionAction,
} from '@/app/dashboard/admin/actions';

export default async function AdminPermissionsPage() {
  const [users, dbRules] = await Promise.all([listUsers(), listRules()]);
  const allDocs = [...RULE_DOCUMENTS, ...dbRules];
  const grantsByDoc: Record<string, number[]> = {};
  for (const doc of allDocs) {
    grantsByDoc[doc.id] = await listPermissionsForDoc(doc.id);
  }

  return (
    <PermissionChecklist
      docs={allDocs.map((d) => ({ id: d.id, title: d.title }))}
      users={users.filter((u) => u.isActive)}
      grantsByDoc={grantsByDoc}
      actions={{
        grant: grantPermissionAction,
        revoke: revokePermissionAction,
        bulkGrant: bulkGrantPermissionAction,
        bulkRevoke: bulkRevokePermissionAction,
      }}
    />
  );
}
