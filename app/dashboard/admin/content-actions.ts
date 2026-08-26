'use server';

import { requireAdmin } from './actions';
import { createRule, updateRule, deleteRule, type RuleInput } from '@/lib/rules';
import { createAnnouncement, updateAnnouncement, deleteAnnouncement, type AnnouncementInput } from '@/lib/announcements';
import {
  grantAnnouncementPermission,
  revokeAnnouncementPermission,
} from '@/lib/announcement-permissions';
import { extractTextFromFile } from '@/lib/file-extract';
import { logAdminAction } from '@/lib/audit';
import type { RuleDocument } from '@/lib/content/sop';
import type { Announcement } from '@/lib/content/announcements';

export async function createRuleAction(input: RuleInput): Promise<RuleDocument> {
  const admin = await requireAdmin();
  const rule = await createRule(input, admin.userId);
  await logAdminAction(admin.userId, 'rule.create', null, { note: rule.id });
  return rule;
}

export async function updateRuleAction(id: string, input: RuleInput): Promise<RuleDocument> {
  const admin = await requireAdmin();
  const rule = await updateRule(id, input);
  await logAdminAction(admin.userId, 'rule.update', null, { note: id });
  return rule;
}

export async function deleteRuleAction(id: string): Promise<{ ok: true }> {
  const admin = await requireAdmin();
  await deleteRule(id);
  await logAdminAction(admin.userId, 'rule.delete', null, { note: id });
  return { ok: true };
}

export async function extractRuleFileAction(formData: FormData): Promise<{ text: string; fileName: string }> {
  await requireAdmin();
  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('Thiếu file.');
  const text = await extractTextFromFile(file);
  return { text, fileName: file.name.replace(/\.[^.]+$/, '') };
}

export async function createAnnouncementAction(input: AnnouncementInput): Promise<Announcement> {
  const admin = await requireAdmin();
  const announcement = await createAnnouncement(input, admin.userId);
  await logAdminAction(admin.userId, 'announcement.create', null, { note: announcement.id });
  return announcement;
}

export async function updateAnnouncementAction(id: number, input: AnnouncementInput): Promise<Announcement> {
  const admin = await requireAdmin();
  const announcement = await updateAnnouncement(id, input);
  await logAdminAction(admin.userId, 'announcement.update', null, { note: String(id) });
  return announcement;
}

export async function deleteAnnouncementAction(id: number): Promise<{ ok: true }> {
  const admin = await requireAdmin();
  await deleteAnnouncement(id);
  await logAdminAction(admin.userId, 'announcement.delete', null, { note: String(id) });
  return { ok: true };
}

export async function grantAnnouncementPermissionAction(userId: number, announcementId: string): Promise<{ ok: true }> {
  const admin = await requireAdmin();
  await grantAnnouncementPermission(userId, Number(announcementId), admin.userId);
  await logAdminAction(admin.userId, 'announcement_permission.grant', userId, { docId: announcementId });
  return { ok: true };
}

export async function revokeAnnouncementPermissionAction(userId: number, announcementId: string): Promise<{ ok: true }> {
  const admin = await requireAdmin();
  await revokeAnnouncementPermission(userId, Number(announcementId));
  await logAdminAction(admin.userId, 'announcement_permission.revoke', userId, { docId: announcementId });
  return { ok: true };
}

export async function bulkGrantAnnouncementPermissionAction(
  userIds: number[],
  announcementId: string
): Promise<{ ok: true }> {
  const admin = await requireAdmin();
  for (const userId of userIds) {
    await grantAnnouncementPermission(userId, Number(announcementId), admin.userId);
    await logAdminAction(admin.userId, 'announcement_permission.grant', userId, { docId: announcementId });
  }
  return { ok: true };
}

export async function bulkRevokeAnnouncementPermissionAction(
  userIds: number[],
  announcementId: string
): Promise<{ ok: true }> {
  const admin = await requireAdmin();
  for (const userId of userIds) {
    await revokeAnnouncementPermission(userId, Number(announcementId));
    await logAdminAction(admin.userId, 'announcement_permission.revoke', userId, { docId: announcementId });
  }
  return { ok: true };
}
