import assert from 'node:assert/strict';
import test from 'node:test';
import { canViewWebsiteReports } from '../../lib/report-access';

test('chỉ cho phép tài khoản của Minh Nguyệt và Nguyễn Đình Duy xem báo cáo', () => {
  assert.equal(canViewWebsiteReports(17), true);
  assert.equal(canViewWebsiteReports(19), true);

  assert.equal(canViewWebsiteReports(16), false);
  assert.equal(canViewWebsiteReports(18), false);
  assert.equal(canViewWebsiteReports(20), false);
});
