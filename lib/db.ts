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

export const sql = neon(connectionString);
