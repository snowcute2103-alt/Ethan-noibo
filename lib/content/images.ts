import type { StaticImageData } from 'next/image';
import heroBg from '@/public/images/hub/hero-bg.jpg';
import officePhoto from '@/public/images/thongbao/office.jpg';
import teamPhoto from '@/public/images/khenthuong/doingu.jpg';
import visionImg from '@/public/images/van-hoa/connguoi.jpg';
import founderImg from '@/public/images/van-hoa/hanhtrinh.jpg';
import orgImg from '@/public/images/van-hoa/office.jpg';
import orgChartImg from '@/public/images/van-hoa/so-do-to-chuc.svg';
import cultureImg from '@/public/images/van-hoa/team-building.jpg';
import sopPrintImg from '@/public/images/rule/ingiay.jpg';
import sopPreparingImg from '@/public/images/rule/preparing-embroidery-machine.webp';
import sopQcImg from '@/public/images/rule/qc-patch-finishing.webp';
import coreValueDongLong from '@/public/images/gia-tri-cot-loi/dong-long.webp';
import coreValueTuTe from '@/public/images/gia-tri-cot-loi/tu-te.webp';
import coreValueTrachNhiem from '@/public/images/gia-tri-cot-loi/trach-nhiem.webp';
import coreValueCaiTien from '@/public/images/gia-tri-cot-loi/cai-tien.webp';
import coreValueBenBi from '@/public/images/gia-tri-cot-loi/ben-bi.jpg';

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

/** Sơ đồ tổ chức Ethan — dùng ở khối "Con người & văn hoá" trang chủ, ngay dưới bài Cơ cấu tổ chức. */
export const ORG_CHART_IMAGE: StaticImageData = orgChartImg;

/** Ảnh nền cho slider "5 giá trị cốt lõi" ở trang chủ, lấy từ ethanecom.com — đúng thứ tự
 *  với culture.ts blocks['5 giá trị cốt lõi'].list: Đồng lòng, Tử tế, Trách nhiệm, Cải tiến, Bền bỉ. */
export const CORE_VALUE_IMAGES: StaticImageData[] = [
  coreValueDongLong,
  coreValueTuTe,
  coreValueTrachNhiem,
  coreValueCaiTien,
  coreValueBenBi,
];

/** Ảnh riêng theo từng tài liệu SOP/rule — dùng trong danh sách "Nội dung khác" ở trang chủ. */
export const RULE_DOC_IMAGE: Record<string, StaticImageData> = {
  'sop-all-print-product': sopPrintImg,
  'sop-preparing': sopPreparingImg,
  'sop-qc': sopQcImg,
};

/** Ảnh riêng theo từng Notice — khác CATEGORY_IMAGE['Thông báo'] (ảnh mặc định dùng chung) để tránh trùng ảnh
 *  khi 1 trang hiện nhiều thông báo cạnh nhau. Hiện chỉ có thông báo "lên đồ", dùng ảnh team mặc áo đồng phục. */
export const NOTICE_IMAGE: Record<string, StaticImageData> = {
  'quy-dinh-len-do-thu-2-thu-6': teamPhoto,
};
