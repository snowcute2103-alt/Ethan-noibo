'use client';

import { useState } from 'react';
import Image from 'next/image';
import ImageLightbox from '@/components/dashboard/image-lightbox';
import {
  ContainerAnimated,
  ContainerScroll,
  ContainerStagger,
  ContainerSticky,
  GalleryCol,
  GalleryContainer,
} from '@/components/ui/animated-gallery';

interface GalleryImage {
  id: string;
  thumbnailSrc: string;
  fullSrc: string;
  width: number;
  height: number;
}

const GALLERY_IMAGE_DIMENSIONS = [
  { width: 1500, height: 2000 },
  { width: 1500, height: 2000 },
  { width: 555, height: 555 },
  { width: 1448, height: 1086 },
  { width: 1500, height: 2000 },
  { width: 1086, height: 1448 },
  { width: 1126, height: 2000 },
  { width: 2000, height: 1126 },
  { width: 1126, height: 2000 },
  { width: 1126, height: 2000 },
  { width: 2000, height: 1126 },
  { width: 2000, height: 1126 },
  { width: 2000, height: 1126 },
  { width: 1126, height: 2000 },
  { width: 1126, height: 2000 },
  { width: 2000, height: 1126 },
  { width: 1126, height: 2000 },
  { width: 1126, height: 2000 },
  { width: 1126, height: 2000 },
  { width: 2000, height: 1126 },
  { width: 2000, height: 1126 },
  { width: 1126, height: 2000 },
  { width: 2000, height: 1126 },
  { width: 1126, height: 2000 },
  { width: 1126, height: 2000 },
] as const;

const GALLERY_IMAGES: GalleryImage[] = GALLERY_IMAGE_DIMENSIONS.map((dimensions, index) => {
  const id = `noi-bo-${String(index + 1).padStart(2, '0')}`;
  return {
    id,
    thumbnailSrc: `/images/van-hoa/noi-bo/thumbnails/${id}.webp`,
    fullSrc: `/images/van-hoa/noi-bo/full/${id}.webp`,
    ...dimensions,
  };
});

const GALLERY_SCROLL_IMAGES = [...GALLERY_IMAGES, ...GALLERY_IMAGES.slice(0, 5)];

const GALLERY_COLUMNS = Array.from({ length: 5 }, (_, columnIndex) =>
  GALLERY_SCROLL_IMAGES.filter((_, imageIndex) => imageIndex % 5 === columnIndex),
);

const COLUMN_MOTION = [
  { className: '-mt-2', yRange: ['-18%', '2%'] },
  { className: 'mt-[-50%]', yRange: ['12%', '4%'] },
  { className: '-mt-2', yRange: ['-18%', '2%'] },
  { className: 'mt-[-50%]', yRange: ['12%', '4%'] },
  { className: '-mt-2', yRange: ['-18%', '2%'] },
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
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  function preloadFullImage(src: string) {
    const image = new window.Image();
    image.src = src;
  }

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
            <GalleryContainer className="-top-[8vh] grid-cols-5">
              {GALLERY_COLUMNS.map((images, columnIndex) => (
                <GalleryCol
                  key={columnIndex}
                  className={COLUMN_MOTION[columnIndex].className}
                  yRange={[...COLUMN_MOTION[columnIndex].yRange]}
                >
                  {images.map((img, imageIndex) => (
                    <button
                      key={`${img.id}-${imageIndex}`}
                      type="button"
                      aria-label={`Mở ảnh văn hoá ${imageIndex * 5 + columnIndex + 1}`}
                      onPointerEnter={() => preloadFullImage(img.fullSrc)}
                      onFocus={() => preloadFullImage(img.fullSrc)}
                      onClick={() => setSelectedImage(img)}
                      className="relative block aspect-video h-auto max-h-full w-full cursor-zoom-in overflow-hidden rounded-md shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
                    >
                      <Image src={img.thumbnailSrc} alt="" fill sizes="20vw" unoptimized className="object-cover" />
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
            key={img.id}
            type="button"
            aria-label={`Mở ảnh văn hoá ${index + 1}`}
            onPointerEnter={() => preloadFullImage(img.fullSrc)}
            onFocus={() => preloadFullImage(img.fullSrc)}
            onClick={() => setSelectedImage(img)}
            className="relative aspect-[4/3] cursor-zoom-in overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
          >
            <Image
              src={img.thumbnailSrc}
              alt=""
              fill
              sizes="(max-width: 1024px) 33vw, 100vw"
              unoptimized
              className="object-cover"
            />
          </button>
        ))}
      </div>
      <ImageLightbox
        src={selectedImage?.fullSrc ?? null}
        previewSrc={selectedImage?.thumbnailSrc}
        alt="Ảnh văn hoá Ethan"
        aspectRatio={selectedImage ? selectedImage.width / selectedImage.height : undefined}
        viewportScale={0.5}
        unoptimized
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
}
