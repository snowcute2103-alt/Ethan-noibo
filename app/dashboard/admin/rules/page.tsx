import { listUsers } from '@/lib/users';
import { listRules } from '@/lib/rules';
import { listPermissionsForDoc } from '@/lib/rule-permissions';
import { RULE_DOCUMENTS } from '@/lib/content';
import RuleManager from '@/components/dashboard/admin/rule-manager';

export default async function AdminRulesPage() {
  const [users, rules] = await Promise.all([listUsers(), listRules()]);
  const grantsByRule: Record<string, number[]> = {};
  for (const rule of rules) {
    grantsByRule[rule.id] = await listPermissionsForDoc(rule.id);
  }

  return (
    <RuleManager
      rules={rules}
      staticRules={RULE_DOCUMENTS}
      users={users.filter((u) => u.isActive)}
      grantsByRule={grantsByRule}
    />
  );
}
