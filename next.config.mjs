// STORAGE_DRIVER=s3 (xem lib/storage.ts) trả về URL ảnh trên host S3_ENDPOINT thay vì
// *.public.blob.vercel-storage.com — thiếu host này trong remotePatterns thì next/image
// báo lỗi runtime "hostname not configured" cho MỌI ảnh task upload khi bật driver s3.
function s3RemotePattern() {
  if (!process.env.S3_ENDPOINT) return null;
  try {
    const { protocol, hostname } = new URL(process.env.S3_ENDPOINT);
    return { protocol: protocol.replace(':', ''), hostname };
  } catch {
    return null;
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '21mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      ...(s3RemotePattern() ? [s3RemotePattern()] : []),
    ],
  },
};

export default nextConfig;
