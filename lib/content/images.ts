import type { StaticImageData } from 'next/image';
import heroBg from '@/public/images/hub/hero-bg.jpg';
import officePhoto from '@/public/images/thongbao/office.jpg';
import teamPhoto from '@/public/images/khenthuong/doingu.jpg';
import visionImg from '@/public/images/van-hoa/connguoi.jpg';
import founderImg from '@/public/images/van-hoa/hanhtrinh.jpg';
import orgImg from '@/public/images/van-hoa/office.jpg';
import cultureImg from '@/public/images/van-hoa/team-building.jpg';

/** Ảnh mặc định theo category — dùng khi nội dung không có ảnh riêng (Thông báo/Chính sách/Khen thưởng). */
export const CATEGORY_IMAGE: Record<string, StaticImageData> = {
  'Thông báo': officePhoto,
  'Chính sách': officePhoto,
  'Khen thưởng': teamPhoto,
};

/** Ảnh riêng theo từng bài Văn hoá — cũng được components/dashboard/culture-articles.tsx dùng lại. */
export const CULTURE_ARTICLE_IMAGE: Record<string, StaticImageData> = {
  'tam-nhin-su-menh-gia-tri': visionImg,
  'cau-chuyen-founder': founderImg,
  'co-cau-to-chuc': orgImg,
  'van-hoa-gan-ket-dai-ngo': cultureImg,
};

/** Ảnh fallback chung — phòng khi thêm nội dung mới mà quên gán ảnh riêng. */
export const FALLBACK_IMAGE: StaticImageData = heroBg;
