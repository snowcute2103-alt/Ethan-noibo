'use client';

import { useState } from 'react';
import Image, { type StaticImageData } from 'next/image';
import ImageLightbox from '@/components/dashboard/image-lightbox';
import {
  ContainerAnimated,
  ContainerScroll,
  ContainerStagger,
  ContainerSticky,
  GalleryCol,
  GalleryContainer,
} from '@/components/ui/animated-gallery';

import internal01Img from '@/Nội bộ/1786086025559_900965337956762677_g247357382052095451_1eb790578c485155f2cc31dcf62b0961.jpg';
import internal02Img from '@/Nội bộ/1787294983889_1957465395561920927_g7902987228796225560_531d37ff2a1091afaea5a32d055ea5c8.jpg';
import internal03Img from '@/Nội bộ/1787388171449_3257055127887173254_g247357382052095451_cc02cf5895da31fdb7e74472b783b8a3.jpg';
import internal04Img from '@/Nội bộ/1787390150166_1870493162060784704_g247357382052095451_405a0e4df13fa91ee1b53d5e25ad7e13.jpg';
import internal05Img from '@/Nội bộ/1787634497861_7660392195884805626_g7902987228796225560_95cb50b9352530bdd690f7ad81376ce0.jpg';
import internal06Img from '@/Nội bộ/1787714188737_900965337956762677_g247357382052095451_060cb339526ddb4bb90e915846fde2e8.jpg';
import internal07Img from '@/Nội bộ/DSC07044.jpg';
import internal08Img from '@/Nội bộ/DSC07062.jpg';
import internal09Img from '@/Nội bộ/DSC07072.jpg';
import internal10Img from '@/Nội bộ/DSC07076.jpg';
import internal11Img from '@/Nội bộ/DSC07156.jpg';
import internal12Img from '@/Nội bộ/DSC07201.jpg';
import internal13Img from '@/Nội bộ/DSC07315.jpg';
import internal14Img from '@/Nội bộ/DSC07323.jpg';
import internal15Img from '@/Nội bộ/DSC07575.jpg';
import internal16Img from '@/Nội bộ/DSC07917.jpg';
import internal17Img from '@/Nội bộ/DSC08045.jpg';
import internal18Img from '@/Nội bộ/DSC08134.jpg';
import internal19Img from '@/Nội bộ/DSC08331.jpg';
import internal20Img from '@/Nội bộ/DSC08492.jpg';
import internal21Img from '@/Nội bộ/DSC08512.jpg';
import internal22Img from '@/Nội bộ/DSC08574.jpg';
import internal23Img from '@/Nội bộ/DSC08901.jpg';
import internal24Img from '@/Nội bộ/DSC09167.jpg';
import internal25Img from '@/Nội bộ/DSC09418.jpg';

const GALLERY_IMAGES: StaticImageData[] = [
  internal01Img,
  internal02Img,
  internal03Img,
  internal04Img,
  internal05Img,
  internal06Img,
  internal07Img,
  internal08Img,
  internal09Img,
  internal10Img,
  internal11Img,
  internal12Img,
  internal13Img,
  internal14Img,
  internal15Img,
  internal16Img,
  internal17Img,
  internal18Img,
  internal19Img,
  internal20Img,
  internal21Img,
  internal22Img,
  internal23Img,
  internal24Img,
  internal25Img,
];

const GALLERY_COLUMNS = Array.from({ length: 4 }, (_, columnIndex) =>
  GALLERY_IMAGES.filter((_, imageIndex) => imageIndex % 4 === columnIndex),
);

const COLUMN_MOTION = [
  { className: '-mt-2', yRange: ['-10%', '2%'] },
  { className: 'mt-[-50%]', yRange: ['15%', '5%'] },
  { className: 'mt-[-50%]', yRange: ['15%', '5%'] },
  { className: '-mt-2', yRange: ['-10%', '2%'] },
] as const;

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
  const [selectedImage, setSelectedImage] = useState<StaticImageData | null>(null);

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

      <ContainerStagger className="culture-gallery-heading relative z-20 -mb-12 place-self-center px-4 pt-8 text-center sm:px-6 sm:pt-10 min-[1025px]:pt-12">
        <ContainerAnimated>
          <p className="font-heading text-xs font-medium uppercase tracking-[0.2em] text-cyan min-[1025px]:text-sm min-[1025px]:tracking-[0.3em]">Câu chuyện Ethan</p>
        </ContainerAnimated>
        <ContainerAnimated>
          <h2 className="title-glow mt-3 font-heading text-[clamp(2.25rem,6.5vw,4rem)] font-light uppercase tracking-wide leading-[1.02] text-white min-[1025px]:mt-6 min-[1025px]:text-[clamp(2.5rem,6.5vw,5.5rem)]">
            Văn hoá
          </h2>
        </ContainerAnimated>
        <ContainerAnimated className="my-3 min-[1025px]:my-4">
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base min-[1025px]:text-lg">
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
            <GalleryContainer className="grid-cols-4">
              {GALLERY_COLUMNS.map((images, columnIndex) => (
                <GalleryCol
                  key={columnIndex}
                  className={COLUMN_MOTION[columnIndex].className}
                  yRange={[...COLUMN_MOTION[columnIndex].yRange]}
                >
                  {images.map((img, imageIndex) => (
                    <button
                      key={imageIndex}
                      type="button"
                      aria-label={`Mở ảnh văn hoá ${imageIndex * 4 + columnIndex + 1}`}
                      onClick={() => setSelectedImage(img)}
                      className="relative block aspect-video h-auto max-h-full w-full cursor-zoom-in overflow-hidden rounded-md shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
                    >
                      <Image src={img} alt="" fill sizes="25vw" className="object-cover" />
                    </button>
                  ))}
                </GalleryCol>
              ))}
            </GalleryContainer>
          </ContainerSticky>
        </ContainerScroll>
      </div>

      <div className="culture-gallery-static" aria-label="Hình ảnh văn hoá Ethan">
        {GALLERY_IMAGES.map((img, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Mở ảnh văn hoá ${index + 1}`}
            onClick={() => setSelectedImage(img)}
            className="relative aspect-[4/3] cursor-zoom-in overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
          >
            <Image src={img} alt="" fill sizes="(max-width: 1024px) 33vw, 100vw" className="object-cover" />
          </button>
        ))}
      </div>
      <ImageLightbox
        src={selectedImage?.src ?? null}
        alt="Ảnh văn hoá Ethan"
        aspectRatio={selectedImage ? selectedImage.width / selectedImage.height : undefined}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
}
