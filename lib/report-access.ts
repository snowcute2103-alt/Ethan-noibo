const REPORT_VIEWER_USER_IDS = new Set([17, 19]);

/** Báo cáo website chỉ dành cho Minh Nguyệt và Nguyễn Đình Duy. */
export function canViewWebsiteReports(userId: number): boolean {
  return REPORT_VIEWER_USER_IDS.has(userId);
}
