const RECOVERY_MARKER_KEY = 'noibo:server-action-recovery';
const RECOVERY_PENDING = 'pending';

interface ServerActionRecoveryRuntime {
  getMarker(): string | null;
  setMarker(value: string): void;
  clearMarker(): void;
  reload(): void;
}

let recoveryRequested = false;

function browserRuntime(): ServerActionRecoveryRuntime | null {
  if (typeof window === 'undefined') return null;

  return {
    getMarker: () => window.sessionStorage.getItem(RECOVERY_MARKER_KEY),
    setMarker: (value) => window.sessionStorage.setItem(RECOVERY_MARKER_KEY, value),
    clearMarker: () => window.sessionStorage.removeItem(RECOVERY_MARKER_KEY),
    reload: () => window.location.reload(),
  };
}

function isStaleServerActionResponse(error: unknown): error is Error {
  if (!(error instanceof Error)) return false;
  const code = (error as Error & { __NEXT_ERROR_CODE?: string }).__NEXT_ERROR_CODE;
  return (
    code === 'E394' ||
    code === 'E715' ||
    error.message === 'An unexpected response was received from the server.' ||
    error.message.includes('Failed to find Server Action')
  );
}

/**
 * Một tab còn giữ Server Action ID của bản build cũ không thể tự hồi phục bằng
 * polling vì mọi lần gọi tiếp theo vẫn dùng cùng ID đó. Reload toàn trang đúng
 * một lần để lấy client manifest mới; sessionStorage chặn vòng lặp nếu response
 * vẫn lỗi vì nguyên nhân hạ tầng khác.
 */
export function recoverFromStaleServerActionResponse(
  error: unknown,
  runtime: ServerActionRecoveryRuntime | null = browserRuntime()
): boolean {
  if (!isStaleServerActionResponse(error)) return false;
  if (!runtime) return true;

  let alreadyRequested = recoveryRequested;
  try {
    alreadyRequested ||= runtime.getMarker() === RECOVERY_PENDING;
  } catch {
    // sessionStorage có thể bị chặn; cờ trong module vẫn ngăn reload lặp ở tab hiện tại.
  }
  if (alreadyRequested) return true;

  recoveryRequested = true;
  try {
    runtime.setMarker(RECOVERY_PENDING);
  } catch {
    // Reload vẫn là đường hồi phục đúng dù trình duyệt không cho ghi storage.
  }
  runtime.reload();
  return true;
}

/** Xoá chốt sau khi một Server Action nền đã trả response hợp lệ. */
export function clearServerActionRecoveryMarker(
  runtime: ServerActionRecoveryRuntime | null = browserRuntime()
): void {
  recoveryRequested = false;
  if (!runtime) return;
  try {
    runtime.clearMarker();
  } catch {
    // Không ảnh hưởng tới dữ liệu; lần reload kế tiếp vẫn có cờ trong module.
  }
}
