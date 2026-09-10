import { put, del } from '@vercel/blob';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

/** STORAGE_DRIVER chọn nơi lưu file upload mới: 'vercel-blob' (mặc định) hoặc 's3'
 *  (endpoint S3-compatible tự host, xem S3_* trong .env.local). Đổi driver không ảnh hưởng
 *  file cũ — xoá vẫn nhận diện theo URL, không theo driver hiện tại. */
const STORAGE_DRIVER = process.env.STORAGE_DRIVER ?? 'vercel-blob';

let cachedS3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (cachedS3Client) return cachedS3Client;
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Thiếu cấu hình S3 (S3_ENDPOINT/S3_ACCESS_KEY/S3_SECRET_KEY) trong .env.local.');
  }
  cachedS3Client = new S3Client({
    endpoint,
    region: process.env.S3_REGION || 'us-east-1',
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  });
  return cachedS3Client;
}

function s3PublicUrl(key: string): string {
  const endpoint = (process.env.S3_ENDPOINT ?? '').replace(/\/+$/, '');
  const bucket = process.env.S3_BUCKET ?? '';
  return `${endpoint}/${bucket}/${key}`;
}

/** Upload 1 file lên storage driver đang cấu hình (STORAGE_DRIVER), trả về URL public. */
export async function uploadStorageFile(
  key: string,
  data: Blob,
  contentType: string
): Promise<{ url: string }> {
  if (STORAGE_DRIVER === 's3') {
    const buffer = Buffer.from(await data.arrayBuffer());
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return { url: s3PublicUrl(key) };
  }
  const blob = await put(key, data, { access: 'public' });
  return { url: blob.url };
}

/** Xoá 1 file theo URL đã lưu trong DB — nhận diện driver gốc qua URL (Vercel Blob hay
 *  S3 endpoint đang cấu hình), không theo STORAGE_DRIVER hiện tại, để xoá đúng cả file
 *  upload từ trước khi đổi driver. Bỏ qua URL không thuộc storage nào đã biết (ảnh local/static). */
export async function deleteStorageFile(url: string): Promise<void> {
  if (url.includes('.public.blob.vercel-storage.com')) {
    await del(url).catch(() => {});
    return;
  }
  const endpoint = (process.env.S3_ENDPOINT ?? '').replace(/\/+$/, '');
  const bucket = process.env.S3_BUCKET ?? '';
  if (!endpoint || !bucket) return;
  const prefix = `${endpoint}/${bucket}/`;
  if (!url.startsWith(prefix)) return;
  const key = url.slice(prefix.length);
  await getS3Client()
    .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    .catch(() => {});
}
