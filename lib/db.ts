import { neon } from '@neondatabase/serverless';

// Biến chuẩn là DATABASE_URL, nhưng tích hợp Storage trên Vercel có thể tạo ra
// biến có prefix tuỳ theo "Custom Prefix" lúc connect (vd STORAGE_URL_DATABASE_URL) —
// đọc đủ các dạng để không phụ thuộc việc prefix có bị xoá lúc setup hay không.
const connectionString =
  process.env.DATABASE_URL ?? process.env.STORAGE_URL_DATABASE_URL ?? process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    'Không tìm thấy connection string Postgres (DATABASE_URL / STORAGE_URL_DATABASE_URL / POSTGRES_URL). Chạy `vercel env pull .env.local` sau khi đã tạo Postgres database cho project trên Vercel.'
  );
}

const neonSql = neon(connectionString);
const neonQuery = neonSql.query.bind(neonSql) as typeof neonSql.query;

const READ_QUERY_RE = /^\s*(?:SELECT|WITH)\b/i;
const MAX_READ_ATTEMPTS = 2;
const RETRY_DELAY_MS = 300;

function isTransientConnectionError(error: unknown): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < 4 && current instanceof Error; depth += 1) {
    const candidate = current as Error & {
      code?: string;
      cause?: unknown;
      sourceError?: unknown;
    };

    if (
      candidate.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      candidate.message.includes('fetch failed') ||
      candidate.message.includes('Error connecting to database')
    ) {
      return true;
    }

    current = candidate.sourceError ?? candidate.cause;
  }

  return false;
}

const queryWithReadRetry = (async (...args: Parameters<typeof neonSql.query>) => {
  const [query] = args;
  const canRetry = typeof query === 'string' && READ_QUERY_RE.test(query);

  for (let attempt = 1; ; attempt += 1) {
    try {
      return await neonQuery(...args);
    } catch (error) {
      if (!canRetry || attempt >= MAX_READ_ATTEMPTS || !isTransientConnectionError(error)) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}) as typeof neonSql.query;

/**
 * Neon HTTP đôi lúc timeout ở bước mở kết nối. Chỉ truy vấn đọc được thử lại
 * một lần; lệnh ghi luôn chạy đúng một lần để không tạo dữ liệu trùng nếu phản
 * hồi bị mất sau khi database đã xử lý.
 */
export const sql = Object.assign(neonSql, { query: queryWithReadRetry });
