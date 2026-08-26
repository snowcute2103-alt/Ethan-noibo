'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import flipbookConnectionImg from '@/public/images/van-hoa/flipbook-story-connection.webp';
import flipbookHopeImg from '@/public/images/van-hoa/flipbook-story-hope.webp';
import flipbookGiftImg from '@/public/images/van-hoa/flipbook-story-gift.jpg';
import flipbookShirtImg from '@/public/images/van-hoa/flipbook-story-shirt.jpg';

/** CSS "lật sách" 3D (kỹ thuật gốc: mỗi tờ `.leaf` chứa 2 mặt front/back dán lưng nhau, tự xoay quanh
 *  gáy sách; vị trí xếp chồng canh bằng translate3d z-offset tính từ chỉ số tờ — xem hàm `leafTransform`
 *  bên dưới). Scoped dưới `.fsb-flipbook`/`.fsb-controls` nên không rò CSS ra ngoài. */
const FSB_CSS = `
.fsb-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.fsb-intro {
  max-width: 520px;
  margin: 0 0 4px;
  text-align: center;
  font-family: var(--font-heading), serif;
  font-size: 1.05rem;
  font-style: italic;
  font-weight: 300;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.75);
}
.fsb-flipbook {
  position: relative;
  width: 520px;
  max-width: 100%;
  height: 380px;
  transform-style: preserve-3d;
  perspective: 1400px;
}
.fsb-leaf {
  position: absolute;
  transform-style: preserve-3d;
  height: 100%;
  width: 50%;
  left: 50%;
  transition: transform 0.9s cubic-bezier(0.65, 0, 0.35, 1);
  transform-origin: left 0px;
}
.fsb-page {
  transform-style: preserve-3d;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  padding: 1.3em 1.4em;
  overflow-y: auto;
  color: #241608;
  font-family: var(--font-body), sans-serif;
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.55);
}
.fsb-front {
  transform: rotate3d(0, 1, 0, 0deg) translate3d(0, 0, 0.1px);
  border-radius: 0 1em 1em 0;
}
.fsb-front:not(.fsb-external) { box-shadow: inset 5px 0 5px -5px rgba(0, 0, 0, 0.35); }
.fsb-back {
  transform: rotate3d(0, 1, 0, 180deg) translate3d(0, 0, 0.1px);
  border-radius: 1em 0 0 1em;
}
.fsb-back:not(.fsb-external) { box-shadow: inset -5px 0 5px -5px rgba(0, 0, 0, 0.35); }
.fsb-page.fsb-image-page { padding: 0; overflow: hidden; }
.fsb-page-number { position: absolute; z-index: 2; bottom: 0.6em; font-size: 0.72em; opacity: 0.55; font-family: var(--font-heading), serif; }
.fsb-image-page .fsb-page-number { color: #fff; opacity: 1; background: rgba(0, 0, 0, 0.4); padding: 2px 8px; border-radius: 999px; }
.fsb-num-front { right: 0.9em; }
.fsb-num-back { left: 0.9em; }
.fsb-kicker { font-family: var(--font-heading), serif; font-size: 0.68rem; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.8; margin: 0 0 0.9em; }
.fsb-cover-image { position: relative; width: 100%; height: 100%; }
.fsb-cover-scrim { position: absolute; inset: 0; z-index: 1; background: linear-gradient(180deg, rgba(20, 8, 2, 0.1) 0%, rgba(20, 8, 2, 0.35) 55%, rgba(20, 8, 2, 0.85) 100%); }
.fsb-cover-bow { position: absolute; left: 0; top: 38%; width: 100%; height: auto; z-index: 1; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4)); }
.fsb-cover-text { position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; text-align: center; padding: 1.6em 1.4em; color: #fff; }
.fsb-cover-text .fsb-kicker { color: rgba(255, 255, 255, 0.85); }
.fsb-cover-text h1 { font-family: var(--font-heading), serif; font-size: 1.55rem; font-weight: 600; line-height: 1.3; margin: 0; text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5); }
.fsb-page h2 { font-family: var(--font-heading), serif; font-size: 1rem; font-weight: 600; margin: 0 0 0.6em; }
.fsb-page p { font-size: 0.82rem; line-height: 1.65; margin: 0 0 0.85em; }
.fsb-page p:last-child { margin-bottom: 0; }
.fsb-page blockquote { font-style: italic; font-size: 0.86rem; line-height: 1.65; margin: 0 0 0.9em; padding-left: 0.8em; border-left: 2px solid rgba(36, 22, 8, 0.35); }
.fsb-lead { font-size: 0.92rem; font-weight: 600; line-height: 1.5; margin: 0 0 0.9em; }
.fsb-signoff { text-align: right; font-size: 0.75rem; font-style: italic; opacity: 0.7; margin-top: 1em; }
.fsb-controls { display: flex; gap: 12px; }
.fsb-controls button {
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: transparent;
  color: #fff;
  font-family: var(--font-heading), sans-serif;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.fsb-controls button:hover:not(:disabled) { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.6); }
.fsb-controls button:disabled { opacity: 0.4; cursor: not-allowed; }
`;

interface FsbFace {
  bg: string;
  external?: boolean;
  image?: boolean;
  pageNumber?: string;
  content: ReactNode;
}
interface FsbLeaf {
  front: FsbFace;
  back: FsbFace;
}

/** Mặt bìa dùng chung cho bìa trước và trang i (cùng ảnh + tiêu đề) — thêm dải nơ ruy băng buộc ngang giữa
 *  sách, gợi cảm giác "món quà được gói", khớp chủ đề "Món quà nhỏ, yêu thương lớn". */
function renderCoverFace() {
  return (
    <div className="fsb-cover-image">
      <Image
        src={flipbookConnectionImg}
        alt="Hai bàn tay vươn tới nhau trên nền trời — biểu tượng kết nối và yêu thương"
        fill
        sizes="260px"
        className="object-cover"
      />
      <div className="fsb-cover-scrim" />
      <svg className="fsb-cover-bow" viewBox="0 0 400 90" aria-hidden="true">
        <line x1="0" y1="45" x2="205" y2="45" stroke="#e76f51" strokeWidth="3" strokeLinecap="round" />
        <line x1="195" y1="45" x2="400" y2="45" stroke="#e9c46a" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M200,46 C186,25 160,22 148,34 C142,40 146,50 156,52 C172,55 190,52 200,46 Z"
          fill="#e76f51"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M200,46 C214,25 240,22 252,34 C258,40 254,50 244,52 C228,55 210,52 200,46 Z"
          fill="#e9c46a"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M197,50 L188,66 L200,54 Z" fill="#e76f51" />
        <path d="M203,50 L212,66 L200,54 Z" fill="#e9c46a" />
        <circle cx="200" cy="46" r="4" fill="#fff" stroke="#241608" strokeWidth="1" />
      </svg>
      <div className="fsb-cover-text">
        <p className="fsb-kicker">★ Câu chuyện của Ethan</p>
        <h1>
          Món quà nhỏ,
          <br />
          yêu thương lớn
        </h1>
      </div>
    </div>
  );
}

/** Bài "Món quà nhỏ, yêu thương lớn" (nguồn: ethanecom.com/gioi-thieu), rút gọn văn cho súc tích, chia thành
 *  5 tờ (10 mặt), mỗi trang chỉ 1 đoạn để không tràn khung. Ảnh "hai bàn tay" dùng làm bìa sách (đúng vị trí
 *  "ngay dưới tiêu đề phần câu chuyện" trên trang gốc) và lặp lại ở trang i như ảnh dẫn nhập; ảnh "bình minh"
 *  đặt ngay trước tiêu đề phụ "Sức mạnh của sự thấu cảm" — đúng vị trí trên trang gốc. */
const LEAVES: FsbLeaf[] = [
  {
    front: {
      bg: '#e76f51',
      external: true,
      image: true,
      content: renderCoverFace(),
    },
    back: {
      bg: '#2a9d8f',
      image: true,
      pageNumber: 'i',
      content: renderCoverFace(),
    },
  },
  {
    front: {
      bg: '#2a9d8f',
      pageNumber: 'ii',
      content: (
        <>
          <p className="fsb-lead">Khi một chiếc áo chạm đến ai đó đúng lúc họ cần nhất.</p>
          <p>
            Tại Ethan, thiết kế không chỉ để đẹp mắt, mà là ngôn ngữ không lời, là cách chúng tôi trao gửi yêu
            thương. Giá trị thật của nó đôi khi vượt xa mọi con số kinh doanh, chạm đến phần sâu thẳm nhất trong tâm
            hồn con người.
          </p>
        </>
      ),
    },
    back: {
      bg: '#e9c46a',
      image: true,
      pageNumber: '1',
      content: (
        <Image
          src={flipbookGiftImg}
          alt="Món quà nhỏ gói bằng giấy kraft, buộc nơ hồng"
          fill
          sizes="260px"
          className="object-cover"
        />
      ),
    },
  },
  {
    front: {
      bg: '#e9c46a',
      pageNumber: '2',
      content: (
        <p>
          Một khách hàng kể về cô con gái nhỏ đang điều trị ung thư. Nhìn thấy chiếc áo trong bộ sưu tập, cô bé mỉm
          cười, thấy được an ủi. Một chiếc áo nhỏ lại trở thành nguồn động viên lớn cho một tâm hồn đang kiên cường
          chống chọi với nỗi đau.
        </p>
      ),
    },
    back: {
      bg: '#f4a261',
      image: true,
      pageNumber: '3',
      content: (
        <Image
          src={flipbookShirtImg}
          alt="Áo thun trắng gấp gọn, tượng trưng cho chiếc áo trong câu chuyện"
          fill
          sizes="260px"
          className="object-cover"
        />
      ),
    },
  },
  {
    front: {
      bg: '#f4a261',
      pageNumber: '4',
      content: (
        <p>
          Đọc những dòng chia sẻ ấy, chúng tôi lặng người. Lần đầu tiên, Ethan thấm thía sức mạnh của những gì mình
          tạo ra: một sản phẩm nhỏ bé, đôi khi xuất hiện đúng lúc người ta cần nhất, như một cái ôm ấm áp giữa mùa
          đông lạnh giá.
        </p>
      ),
    },
    back: {
      bg: '#2a9d8f',
      image: true,
      pageNumber: '5',
      content: (
        <Image
          src={flipbookHopeImg}
          alt="Bóng người dang tay đón bình minh trên biển mây — biểu tượng hy vọng"
          fill
          sizes="260px"
          className="object-cover"
        />
      ),
    },
  },
  {
    front: {
      bg: '#2a9d8f',
      pageNumber: '6',
      content: (
        <>
          <h2>Sức mạnh của sự thấu cảm</h2>
          <p>
            Thiết kế thực sự có sức mạnh chữa lành. Một món quà nhỏ, kết tinh từ sự thấu cảm, có thể giúp yêu thương
            lan toả vô tận, mang giá trị lớn hơn bất kỳ thành tựu kinh doanh nào.
          </p>
        </>
      ),
    },
    back: {
      bg: '#e76f51',
      external: true,
      content: (
        <>
          <p>
            <strong>Câu chuyện năm 2022 đã trở thành kim chỉ nam cho mọi thiết kế của Ethan sau này.</strong> Chúng
            tôi thiết kế bằng cả trái tim, luôn khao khát tạo ra sản phẩm vừa đẹp vừa mang đậm tính nhân văn, chạm
            đến cảm xúc thật nhất của mỗi người.
          </p>
          <p className="fsb-signoff">— Ethan Ecom</p>
        </>
      ),
    },
  },
];

/** position<0 (tờ đã lật sang trái): z tiến về phía người xem theo |index| — tờ lật sau cùng nổi trên
 *  cùng. position>=0 (tờ còn nằm bên phải): z lùi vào trong theo |index| — bìa (index 0) luôn trên cùng. */
function leafTransform(index: number, currentPage: number) {
  const position = index - currentPage;
  const z = (position < 0 ? 1 : -1) * Math.abs(index);
  return position < 0 ? `translate3d(0,0,${z}px) rotate3d(0,1,0,-180deg)` : `translate3d(0,0,${z}px)`;
}

/** Flipbook 3D kể câu chuyện "Món quà nhỏ, yêu thương lớn" (ethanecom.com/gioi-thieu) — đặt cạnh khối
 *  văn bản chương 2 (Câu chuyện Founder) của trang Văn hoá. */
export default function FounderStoryFlipbook() {
  const [currentPage, setCurrentPage] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const hasAutoFlippedRef = useRef(false);
  const userInteractedRef = useRef(false);

  // Mở hờ trang bìa 3s sau khi sách lọt vào khung nhìn — mời gọi tương tác, chỉ chạy 1 lần và huỷ ngay
  // nếu người dùng đã tự bấm trước đó hoặc trình duyệt bật prefers-reduced-motion.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        if (hasAutoFlippedRef.current || !entries.some((e) => e.isIntersecting)) return;
        hasAutoFlippedRef.current = true;
        timer = setTimeout(() => {
          if (!userInteractedRef.current) setCurrentPage((p) => (p === 0 ? 1 : p));
        }, 3000);
      },
      { threshold: 0.5 },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={rootRef} className="fsb-wrap">
      <style dangerouslySetInnerHTML={{ __html: FSB_CSS }} />
      <p className="fsb-intro">
        Câu chuyện về một món quà nhỏ đã đưa yêu thương chạm đến trái tim của biết bao người.
      </p>
      <div className="fsb-flipbook" role="group" aria-label="Câu chuyện Món quà nhỏ, yêu thương lớn — lật xem từng trang">
        {LEAVES.map((leaf, i) => (
          <div key={i} className="fsb-leaf" style={{ transform: leafTransform(i, currentPage) }}>
            <div
              className={`fsb-page fsb-front${leaf.front.external ? ' fsb-external' : ''}${leaf.front.image ? ' fsb-image-page' : ''}`}
              style={{ backgroundColor: leaf.front.bg }}
            >
              {leaf.front.pageNumber && <div className="fsb-page-number fsb-num-front">{leaf.front.pageNumber}</div>}
              {leaf.front.content}
            </div>
            <div
              className={`fsb-page fsb-back${leaf.back.external ? ' fsb-external' : ''}${leaf.back.image ? ' fsb-image-page' : ''}`}
              style={{ backgroundColor: leaf.back.bg }}
            >
              {leaf.back.pageNumber && <div className="fsb-page-number fsb-num-back">{leaf.back.pageNumber}</div>}
              {leaf.back.content}
            </div>
          </div>
        ))}
      </div>
      <div className="fsb-controls">
        <button
          type="button"
          onClick={(e) => {
            userInteractedRef.current = true;
            setCurrentPage((p) => Math.max(0, p - 1));
            e.currentTarget.blur();
          }}
          disabled={currentPage === 0}
        >
          ‹ Trang trước
        </button>
        <button
          type="button"
          onClick={(e) => {
            userInteractedRef.current = true;
            setCurrentPage((p) => Math.min(LEAVES.length, p + 1));
            e.currentTarget.blur();
          }}
          disabled={currentPage === LEAVES.length}
        >
          Trang sau ›
        </button>
      </div>
    </div>
  );
}
