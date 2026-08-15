import 'server-only';
import type { Department, Tier } from './roles';

export interface Account {
  username: string;
  department: Department;
  tier: Tier;
  /** Tên biến môi trường chứa mật khẩu của tài khoản này. */
  passwordEnvVar: string;
}

/**
 * Tài khoản dùng chung theo khối/cấp (không phải tài khoản cá nhân).
 * Mật khẩu KHÔNG nằm trong code — set qua biến môi trường (xem .env.example),
 * để không lộ khi push code lên GitHub.
 */
export const ACCOUNTS: Account[] = [
  { username: 'bgd', department: 'bgd', tier: 'full', passwordEnvVar: 'AUTH_PASSWORD_BGD' },

  { username: 'kd-staff', department: 'kinh-doanh', tier: 'staff', passwordEnvVar: 'AUTH_PASSWORD_KD_STAFF' },
  { username: 'kd-leader', department: 'kinh-doanh', tier: 'leader', passwordEnvVar: 'AUTH_PASSWORD_KD_LEADER' },

  { username: 'sxtheu-staff', department: 'sx-theu', tier: 'staff', passwordEnvVar: 'AUTH_PASSWORD_SXTHEU_STAFF' },
  { username: 'sxtheu-leader', department: 'sx-theu', tier: 'leader', passwordEnvVar: 'AUTH_PASSWORD_SXTHEU_LEADER' },

  { username: 'sxin-staff', department: 'sx-in', tier: 'staff', passwordEnvVar: 'AUTH_PASSWORD_SXIN_STAFF' },
  { username: 'sxin-leader', department: 'sx-in', tier: 'leader', passwordEnvVar: 'AUTH_PASSWORD_SXIN_LEADER' },

  { username: 'rnd-staff', department: 'rnd', tier: 'staff', passwordEnvVar: 'AUTH_PASSWORD_RND_STAFF' },
  { username: 'rnd-leader', department: 'rnd', tier: 'leader', passwordEnvVar: 'AUTH_PASSWORD_RND_LEADER' },

  { username: 'it-staff', department: 'it', tier: 'staff', passwordEnvVar: 'AUTH_PASSWORD_IT_STAFF' },
  { username: 'it-leader', department: 'it', tier: 'leader', passwordEnvVar: 'AUTH_PASSWORD_IT_LEADER' },

  { username: 'fulfillment-staff', department: 'fulfillment', tier: 'staff', passwordEnvVar: 'AUTH_PASSWORD_FULFILLMENT_STAFF' },
  { username: 'fulfillment-leader', department: 'fulfillment', tier: 'leader', passwordEnvVar: 'AUTH_PASSWORD_FULFILLMENT_LEADER' },
];

export function findAccount(username: string): Account | undefined {
  return ACCOUNTS.find((a) => a.username === username);
}
