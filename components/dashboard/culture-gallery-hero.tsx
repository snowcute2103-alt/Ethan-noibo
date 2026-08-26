'use client';

import Image, { type StaticImageData } from 'next/image';
import {
  ContainerAnimated,
  ContainerScroll,
  ContainerStagger,
  ContainerSticky,
  GalleryCol,
  GalleryContainer,
} from '@/components/ui/animated-gallery';

import officeImg from '@/public/images/van-hoa/office.jpg';
import teamBuildingImg from '@/public/images/van-hoa/team-building.jpg';
import passionImg from '@/public/images/van-hoa/passion.jpg';
import dongLongImg from '@/public/images/van-hoa/dong-long.jpg';
import connguoiImg from '@/public/images/van-hoa/connguoi.jpg';
import hanhtrinhImg from '@/public/images/van-hoa/hanhtrinh.jpg';
import storyHopeImg from '@/public/images/van-hoa/story-hope.jpg';
import caitienImg from '@/public/images/van-hoa/caitien.jpg';
import benbiImg from '@/public/images/van-hoa/benbi.jpg';
import trachnhiemImg from '@/public/images/van-hoa/trachnhiem.jpg';
import tuTeImg from '@/public/images/van-hoa/tu-te.jpg';
import christmas2025AImg from '@/public/images/van-hoa/christmas-2025-a.webp';
import christmas2025BImg from '@/public/images/van-hoa/christmas-2025-b.webp';
import tet2026AImg from '@/public/images/van-hoa/tet-2026-a.webp';
import tet2026BImg from '@/public/images/van-hoa/tet-2026-b.webp';
import trungThu2025AImg from '@/public/images/van-hoa/trung-thu-2025-a.jpg';
import trungThu2025BImg from '@/public/images/van-hoa/trung-thu-2025-b.webp';
import overLimitation2025AImg from '@/public/images/van-hoa/over-limitation-2025-a.webp';
import overLimitation2025BImg from '@/public/images/van-hoa/over-limitation-2025-b.webp';

const IMAGES_1: StaticImageData[] = [officeImg, teamBuildingImg, passionImg, christmas2025AImg, tet2026AImg, trungThu2025AImg];
const IMAGES_2: StaticImageData[] = [dongLongImg, connguoiImg, hanhtrinhImg, storyHopeImg, christmas2025BImg, tet2026BImg, overLimitation2025AImg];
const IMAGES_3: StaticImageData[] = [caitienImg, benbiImg, trachnhiemImg, tuTeImg, trungThu2025BImg, overLimitation2025BImg];

const STARS = [
  { top: '6%', left: '4%', size: 2, duration: 3.2, delay: 0 },
  { top: '14%', left: '12%', size: 3, duration: 4.1, delay: 0.6 },
  { top: '9%', left: '22%', size: 2, duration: 3.6, delay: 1.4 },
  { top: '20%', left: '30%', size: 2, duration: 3, delay: 0.3 },
  { top: '5%', left: '40%', size: 3, duration: 4.6, delay: 2.1 },
  { top: '16%', left: '52%', size: 2, duration: 3.4, delay: 1 },
  { top: '8%', left: '61%', size: 2, duration: 3.9, delay: 2.6 },
  { top: '22%', left: '69%', size: 3, duration: 3.2, delay: 0.8 },
  { top: '11%', left: '78%', size: 2, duration: 4.3, delay: 1.7 },
  { top: '18%', left: '88%', size: 2, duration: 3.7, delay: 0.4 },
  { top: '28%', left: '17%', size: 2, duration: 4, delay: 2.3 },
  { top: '32%', left: '46%', size: 3, duration: 3.3, delay: 1.2 },
  { top: '26%', left: '75%', size: 2, duration: 4.5, delay: 0.9 },
  { top: '38%', left: '8%', size: 2, duration: 3.5, delay: 1.9 },
  { top: '40%', left: '94%', size: 2, duration: 3.8, delay: 0.2 },
];

/**
 * Hero mở đầu trang Văn hoá, dùng nguyên các primitive ContainerScroll/ContainerSticky/
 * GalleryContainer/GalleryCol từ components/ui/animated-gallery.tsx, giữ đúng cấu trúc và
 * thông số của DemoVariant1 gốc, chỉ đổi nội dung chữ/ảnh sang theme Văn hoá Ethan.
 */
export default function CultureGalleryHero() {
  return (
    <div className="relative bg-navy-deep">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] overflow-hidden" aria-hidden="true">
        {STARS.map((star, i) => (
          <span
            key={i}
            className="animate-twinkle absolute rounded-full bg-white"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <ContainerStagger className="culture-gallery-heading relative z-20 -mb-12 place-self-center px-4 pt-12 text-center sm:px-6">
        <ContainerAnimated>
          <p className="font-heading text-sm font-medium uppercase tracking-[0.3em] text-cyan">Câu chuyện Ethan</p>
        </ContainerAnimated>
        <ContainerAnimated>
          <h2 className="title-glow mt-6 font-heading text-[clamp(2.5rem,6.5vw,5.5rem)] font-light uppercase tracking-wide leading-[1.02] text-white">
            Văn hoá
          </h2>
        </ContainerAnimated>
        <ContainerAnimated className="my-4">
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80">
            &ldquo;Đồng lòng đồng sức, bứt phá gặt thành công&rdquo;, tầm nhìn, con người và những câu chuyện làm nên
            Ethan, dành riêng cho nhân sự nội bộ.
          </p>
        </ContainerAnimated>
      </ContainerStagger>
      <div
        className="culture-gallery-glow pointer-events-none absolute z-10 h-[70vh] w-full"
        style={{
          background:
            'linear-gradient(to right, rgba(230,233,240,0.6) 0%, rgba(90,95,110,0.28) 20%, rgba(8,10,16,0) 42%, rgba(8,10,16,0) 58%, rgba(90,95,110,0.28) 80%, rgba(230,233,240,0.6) 100%)',
          filter: 'blur(84px)',
          mixBlendMode: 'screen',
        }}
      />

      <div className="culture-gallery-motion">
        <ContainerScroll className="relative h-[350vh]">
          <ContainerSticky className="h-svh">
            <GalleryContainer>
            <GalleryCol yRange={['-10%', '2%']} className="-mt-2">
              {IMAGES_1.map((img, index) => (
                <div key={index} className="relative aspect-video block h-auto max-h-full w-full overflow-hidden rounded-md shadow">
                  <Image src={img} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                </div>
              ))}
            </GalleryCol>
            <GalleryCol className="mt-[-50%]" yRange={['15%', '5%']}>
              {IMAGES_2.map((img, index) => (
                <div key={index} className="relative aspect-video block h-auto max-h-full w-full overflow-hidden rounded-md shadow">
                  <Image src={img} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                </div>
              ))}
            </GalleryCol>
            <GalleryCol yRange={['-10%', '2%']} className="-mt-2">
              {IMAGES_3.map((img, index) => (
                <div key={index} className="relative aspect-video block h-auto max-h-full w-full overflow-hidden rounded-md shadow">
                  <Image src={img} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                </div>
              ))}
            </GalleryCol>
            </GalleryContainer>
          </ContainerSticky>
        </ContainerScroll>
      </div>

      <div className="culture-gallery-static" aria-label="Hình ảnh văn hoá Ethan">
        {[officeImg, teamBuildingImg, passionImg, dongLongImg, connguoiImg, hanhtrinhImg].map((img, index) => (
          <div key={index} className="relative aspect-[4/3] overflow-hidden">
            <Image src={img} alt="" fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
