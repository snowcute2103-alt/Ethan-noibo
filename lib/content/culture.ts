import type { Visibility } from './types';

export interface CultureBlock {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

/** Nội dung văn hoá/"blog nội bộ", chỉ phần [Đối nội]/[Cả hai], phần [Đối ngoại] đã public trên ethanecom.com nên không lặp lại ở đây. */
export interface CultureArticle {
  id: string;
  title: string;
  kicker: string;
  intro: string;
  blocks: CultureBlock[];
  visibility: Visibility;
}

export const CULTURE_ARTICLES: CultureArticle[] = [
  {
    id: 'tam-nhin-su-menh-gia-tri',
    title: 'Tầm nhìn, sứ mệnh & giá trị cốt lõi',
    kicker: 'Về Ethan',
    intro: 'Đồng lòng đồng sức, bứt phá gặt thành công. Nền tảng định hướng mọi quyết định hằng ngày của Ethan.',
    blocks: [
      {
        heading: 'Tầm nhìn 3–5 năm tới',
        paragraphs: [
          'Ethan hướng tới trở thành công ty e-commerce vận hành bài bản, từ nghiên cứu sản phẩm, marketing, bán hàng đến sản xuất. Mục tiêu: đội ngũ đủ mạnh, tự chủ sản phẩm và sản xuất, phát triển bền vững trên thị trường quốc tế.',
        ],
      },
      {
        heading: 'Sứ mệnh',
        paragraphs: [
          'Tạo sản phẩm chất lượng, giá trị thật cho khách hàng quốc tế, và xây dựng môi trường để anh em cùng phát triển năng lực, học hỏi và nhìn thấy tương lai của mình trong công việc.',
        ],
      },
      {
        heading: 'Giá trị thể hiện bằng hành vi cụ thể',
        list: [
          'Sẵn sàng hỗ trợ đồng đội khi cần.',
          'Không đổ lỗi, không bè phái, không làm việc kiểu "việc ai người đó lo".',
          'Khi công ty hoặc team có mục tiêu chung, biết cùng nhau cố gắng để đạt kết quả.',
          'Góp ý thẳng thắn nhưng với tinh thần xây dựng, không nói sau lưng.',
        ],
      },
    ],
    visibility: { departments: 'all' },
  },
  {
    id: 'cau-chuyen-founder',
    title: 'Câu chuyện Founder, từ chợ đầu mối đến Ethan Ecom',
    kicker: 'Về Ethan',
    intro: 'Hành trình cá nhân của founder Duy Nguyễn. Chất liệu không thể bịa cho câu chuyện thương hiệu Ethan.',
    blocks: [
      {
        heading: 'Cái duyên đến với ngành',
        paragraphs: [
          'Trước khi lập Ethan, founder buôn heo ở chợ đầu mối, đêm thức ở chợ, ngày nghe anh trai kể chuyện Facebook ads, camp, profit. Năm 2016, anh trai đưa founder đến với MMO, ban đầu nghe cho vui rồi cuốn dần theo những con số profit. Vừa làm vừa học, có ngày win có ngày lỗ, nhưng càng làm càng thấy nhiều cơ hội.',
        ],
      },
      {
        heading: 'Bước ngoặt khó khăn nhất (2018–2019)',
        paragraphs: [
          'Team lúc đó chỉ 4 người, vận hành trên Merch by Amazon. Một ngày, gần như toàn bộ tài khoản bị suspend cùng lúc, mất gần hết tài nguyên. Founder từng nghĩ đến chuyện giải tán team, nhưng 2 người đồng hành được mời sang team khác đã từ chối, nói nếu founder nghỉ thì họ cũng nghỉ theo chứ không qua chỗ khác.',
          'Câu nói đó khiến founder nhận ra phía sau mình còn người tin tưởng, đồng hành. Đây là bước ngoặt lớn nhất của Ethan, không phải vì khó khăn, mà vì giúp hiểu rõ hơn ý nghĩa hai chữ "đồng đội".',
        ],
      },
    ],
    visibility: { departments: 'all' },
  },
  {
    id: 'co-cau-to-chuc',
    title: 'Cơ cấu tổ chức Ethan',
    kicker: 'Vận hành',
    intro: 'Theo mô hình tổ chức chuẩn 14/06/2026, đối chiếu report nhân sự 18/06/2026. 88 nhân sự, 56 nữ / 32 nam.',
    blocks: [
      {
        heading: 'Sơ đồ khối',
        list: [
          'Ban Giám Đốc, Duy Nguyễn (Founder) · Đoàn Thị Minh Nguyệt (CEO), đồng điều hành, định hướng chung.',
          'Kinh Doanh, 32 người (KD1–KD6: Manager + Team Leader + Seller), nguồn thu duy nhất của công ty.',
          'Sản Xuất, 49 người (CPO: Trần Vũ Quốc Bảo), SX1 Thêu · SX2 Giấy · SX3 Nhựa · Design EMB (21) / POD (8) · R&D (2).',
          'Fulfillment, 2 người (TL: Trần Thị Bích Ngọc), xử lý đơn nguồn ngoài (Printify, Gearment…).',
          'Logistics US (*), điểm gom & giao cuối, hiện CHƯA có nhân sự chuyên trách.',
          'Dùng chung: IT/Development (3) · Marketing & Thương hiệu (mới, chưa có người) · Kế toán (chưa có) · HR (chưa có).',
        ],
      },
      {
        heading: 'Lưu ý vận hành thực tế',
        paragraphs: [
          '4 mảng CHƯA có nhân sự chuyên trách: Logistics US (sản xuất kiêm gom hàng), Marketing & Thương hiệu, Kế toán, HR (2 mảng sau BGĐ đang tạm xử lý). Đây là các ô ưu tiên tuyển tiếp theo.',
        ],
      },
    ],
    visibility: { departments: 'all' },
  },
  {
    id: 'van-hoa-gan-ket-dai-ngo',
    title: 'Văn hoá, gắn kết & đãi ngộ',
    kicker: 'Đời sống Ethan',
    intro: 'Những gì thật sự diễn ra ở Ethan mỗi tháng, mỗi năm. Không phải slogan tuyển dụng.',
    blocks: [
      {
        heading: 'Hoạt động gắn kết',
        list: [
          'Team building thường niên (biển hoặc Đà Lạt, tuỳ tình hình kinh doanh) + tiệc Christmas cuối năm.',
          'Sinh nhật tổ chức vào cuối tháng, mỗi bạn có bánh riêng, kèm rút thăm thưởng tiền mặt từ 100k–100$.',
          'Công ty hỗ trợ ăn trưa tại công ty (không hỗ trợ mang về), để mọi người gần gũi, kết nối hơn.',
          'Hiện chưa có thi đua giữa các tổ, chỉ có KPI riêng của từng đội.',
        ],
      },
      {
        heading: 'Ghi nhận & khen thưởng',
        list: [
          'Làm tốt → thưởng trực tiếp bằng tiền mặt, thường từ 1–10 triệu.',
          'Thăng chức theo lộ trình Seller → Team Leader → Manager, sau khi đánh giá phù hợp.',
          '2 mốc thăng tiến mỗi năm: cuối Q2 và cuối Q4, dựa trên năng lực, kết quả thực tế; hoặc BGĐ đề xuất trực tiếp khi thấy tiềm năng.',
        ],
      },
      {
        heading: 'Lắng nghe & minh bạch nội bộ',
        list: [
          'Khảo sát cuối năm + BGĐ chủ động hẹn gặp riêng khi thấy nhân sự gặp vấn đề trong công việc.',
          'Chưa có lộ trình onboarding chuẩn cho nhân sự mới, hiện đội trưởng/đồng cấp kèm tay, khá tốn thời gian và năng lượng của quản lý.',
        ],
      },
      {
        heading: 'Vì sao nhân sự gắn bó lâu',
        list: [
          'Môi trường lành mạnh, tự do sáng tạo và phát triển, không rập khuôn.',
          'Mọi cấp bậc đều được tôn trọng, cấp trên không được trịnh thượng, dùng chức vụ lấn lướt cấp dưới.',
          'BGĐ chủ động đề bạt và ủng hộ việc học tập, phát triển của tất cả nhân sự.',
        ],
      },
    ],
    visibility: { departments: 'all' },
  },
];
