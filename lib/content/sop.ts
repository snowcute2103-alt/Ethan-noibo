export interface SopTable {
  headers: string[];
  rows: string[][];
}

export interface SopSection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: SopTable;
}

/**
 * Tài liệu SOP/rule nội bộ — cần mục lục + tra cứu, khác hẳn feed thông báo.
 * Quyền đọc KHÔNG khai báo ở đây nữa — BGĐ gán theo từng người qua trang admin,
 * lưu trong bảng rule_permissions (xem lib/rule-permissions.ts).
 */
export interface RuleDocument {
  id: string;
  title: string;
  subtitle: string;
  version: string;
  effectiveDate: string;
  status: string;
  goldenRule: { title: string; points: string[] };
  sections: SopSection[];
}

export const RULE_DOCUMENTS: RuleDocument[] = [
  {
    id: 'sop-all-print-product',
    title: 'SOP ALL PRINT PRODUCT',
    subtitle: 'Quy tắc SKU · Đặt tên file · Lưu trữ NAS · Luồng đồng bộ & chốt chặn',
    version: '2.1',
    effectiveDate: 'Hiệu lực 07/08/2026 · Áp dụng từ 13/08/2026',
    status: 'Đang hoàn thiện — chưa phổ biến với Design',
    goldenRule: {
      title: 'Quy định vàng — đọc trước tiên: mọi trao đổi về đơn, file và lỗi PHẢI thực hiện trên hệ thống',
      points: [
        'Zalo / tin nhắn riêng không còn giá trị làm căn cứ. Đã trao đổi ở đó = coi như chưa trao đổi.',
        'Trao đổi ngoài hệ thống mà phát sinh lỗi → xử lý cả hai bên, không xét ai đúng ai sai.',
        'Cần hỏi, cần báo lỗi, cần trả đơn → đều ghi trên hệ thống. Nhắn riêng thì không ai truy được.',
        'Áp dụng cho mọi sàn: TikTok, eBay, Amazon đều đi chung một luồng, chung một quy tắc SKU — không có ngoại lệ theo sàn.',
      ],
    },
    sections: [
      {
        id: 'cau-truc-sku',
        title: '1. Cấu trúc SKU',
        paragraphs: [
          'Công thức chuẩn: [Quy cách*]-[Mã custom*]-[Mã SP]-[Tên đội KD].[Mã Design]-[Ngày]-[STT] — dấu * là thành phần tuỳ chọn, chỉ có khi cần.',
        ],
        table: {
          headers: ['Khối', '#', 'Thành phần', 'Ví dụ', 'Đội chịu trách nhiệm'],
          rows: [
            ['ĐẦU (quy cách — chỉ thêm khi có đơn)', '1', 'Biến thể / quy cách (gia công trước, đóng gói sau)', 'M, BNW, W', 'Sản xuất'],
            ['ĐẦU', '2', 'Mã đơn custom', '30021', 'Designer / QC'],
            ['THÂN (SKU gốc — Design đặt ngay từ đầu)', '3', 'Mã sản phẩm', 'PLC', 'KD · SX · Design/QC'],
            ['THÂN', '4', 'Tên đội KD', 'KD1', 'Kinh doanh'],
            ['THÂN', '5', 'Mã Design', 'D3', 'Designer'],
            ['THÂN', '6', 'Ngày (định dạng YYMMDD)', '240726', 'Kinh doanh'],
            ['THÂN', '7', 'STT (2 chữ số)', '01', 'Kinh doanh'],
          ],
        },
        bullets: [
          'Các thành phần nối nhau bằng dấu gạch ngang "-".',
          'Tên đội KD và Mã Design viết liền bằng dấu chấm: KD1.D3 (không phải KD1-D3).',
          'Nhiều quy cách thì nối tiếp nhau ở đầu: M-BNW-…',
          'Mã đơn custom chỉ dùng cho đơn TikTok/eBay/Amazon custom hoặc sản phẩm mới.',
          'Ngày viết 6 số theo định dạng DDMMYY → 240726 = 26/07/2024.',
          'STT luôn 2 chữ số: 01, 02, … 10.',
          'Không dấu cách, không dấu tiếng Việt, viết HOA toàn bộ.',
          '⚠️ File import hệ thống là ngoại lệ duy nhất — giữ nguyên order name của nền tảng.',
        ],
      },
      {
        id: 'ten-file-giai-doan',
        title: '2. Tên file theo từng giai đoạn ⭐',
        paragraphs: [
          'Nguyên tắc: Design đặt tên KHỐI THÂN trước. Khi có đơn thật mới gắn thêm KHỐI ĐẦU vào phía trước.',
        ],
        table: {
          headers: ['Giai đoạn', 'Dùng cho ai', 'Tên file gồm', 'Ví dụ'],
          rows: [
            ['1 · New Design (chưa có đơn)', 'Kinh doanh', 'Chỉ từ Mã SP trở đi — không quy cách, không mã đơn', 'PLC-KD1.D3-240726-01'],
            ['2 · Có đơn — Custom', 'Sản xuất', 'Biến thể + Mã đơn', '1t-30001'],
            ['3 · Có đơn — mẫu cố định', 'Sản xuất', 'Quy cách (bắt buộc) + SKU gốc', 'M-BNB-PLC-KD1.D3-240726'],
            ['4 · File import hệ thống', 'Hệ thống', 'Order name đúng theo nền tảng — giữ nguyên 100%', '(theo TikTok / eBay / Amazon)'],
          ],
        },
        bullets: [
          'Ví dụ GĐ3: SKU gốc PLC-KD1.D3-240726-01 → đơn yêu cầu màng mờ + hộp nhựa đen → tên file: M-BNB-PLC-KD1.D3-240726.',
        ],
      },
      {
        id: 'bang-ma',
        title: '3. Bảng mã (tra cứu nhanh)',
        table: {
          headers: ['Nhóm mã', 'Mã', 'Ý nghĩa'],
          rows: [
            ['Quy cách — Sản xuất', 'M', 'Màng mờ'],
            ['Quy cách — Sản xuất', 'KT', 'Màng kim tuyến cát'],
            ['Quy cách — Sản xuất', 'BNW', 'Hộp nhựa trắng'],
            ['Quy cách — Sản xuất', 'BNB', 'Hộp nhựa đen'],
            ['Sản phẩm', 'PLC', 'Playing card'],
            ['Sản phẩm', 'SCARD', 'Skin card'],
            ['Sản phẩm', 'STICKER / CSTICKER', 'Sticker / Custom Sticker'],
            ['Sản phẩm', 'CAL-WALL', 'Calendar'],
            ['Sản phẩm', 'TATTOO', 'Tattoo'],
            ['Đội KD', 'KD1–KD6', 'Đội Tuyền · Thư · Duyên · Thảo · Tiến · Hân'],
            ['Designer', 'D1–D9', 'Hân · Ngọc · Mai · Nhi · Thạch · Hoà · Quý · Phương · Nga'],
          ],
        },
        bullets: [
          'Người phụ trách: Ngọc — đẩy đơn eBay/Amazon lên hệ thống, set SKU đơn cố định.',
          'Người phụ trách: Đội KD phụ trách — brief & chốt quy cách đơn custom.',
          'Người phụ trách: Đội trưởng KD — duyệt yêu cầu ưu tiên mẫu quay chụp (thành viên thường không được yêu cầu).',
          'Người phụ trách: Minh Thư — phân luồng & theo dõi tiến độ QC Print, báo cáo tuần.',
          'Người phụ trách: Hiệp — luồng báo lỗi trên hệ thống + xuất dữ liệu hiệu suất (đang xây).',
        ],
      },
      {
        id: 'cau-truc-nas',
        title: '4. Cấu trúc thư mục NAS',
        bullets: [
          '🔒 = khoá source / khoá chỉnh sửa, chỉ cho phép copy.',
          'Tên folder ngày: DD-MM (ví dụ 04-08). ⚠️ Khác định dạng ngày trong SKU (YYMMDD) — đừng nhầm.',
          'Folder cũ: bỏ, không dùng nữa — mọi đơn của Ethan đều theo đúng cây thư mục hiện hành.',
        ],
        table: {
          headers: ['Loại đơn', 'Lưu ở đâu', 'Ghi chú'],
          rows: [
            ['New Design', 'FILE SẢN PHẨM/[SP]/[KDx]/[Dx-TÊN]/[DD-MM] (kho nguồn) + copy vào ĐƠN SẢN XUẤT/Đơn Media/[DD-MM]', 'Bản trong Đơn Media để SX lấy sản xuất'],
            ['Đơn Custom', 'ĐƠN SẢN XUẤT/Đơn Hàng Custom/[DD-MM]', 'Không đưa vào FILE SẢN PHẨM (đơn dùng 1 lần)'],
            ['Đơn Cố Định', 'ĐƠN SẢN XUẤT/Đơn Hàng Cố Định', 'Đẩy 1 lần theo SKU, không chia ngày'],
            ['File import hệ thống', '(theo luồng hệ thống)', 'Ngoại lệ, không áp quy tắc SKU'],
          ],
        },
      },
      {
        id: 'quy-trinh-dong-bo',
        title: '5. Quy trình đồng bộ (Design ↔ Ngọc ↔ Sản xuất)',
        bullets: [
          '1. Mở Đơn Hàng Custom/[DD-MM] → biết SKU cần làm trong ngày.',
          '2. Đọc SKU → xác định loại: New Design (search trong Đơn Media/[DD-MM] đúng ngày) · Đơn Custom (lấy trực tiếp trong Đơn Hàng Custom/[DD-MM]) · Đơn Cố Định (mở Đơn Hàng Cố Định, không cần tra theo ngày).',
          '3. Copy file ra rồi mới sản xuất — không mở/sửa trực tiếp file gốc (source đang khoá).',
        ],
      },
      {
        id: 'dieu-kien-chuyen-don',
        title: '6. Điều kiện chuyển đơn (chốt chặn) ⭐',
        paragraphs: [
          'Vấn đề đang xảy ra: SX nhận được đơn nhưng không thấy file → đứng chờ, mất thời gian cả dây chuyền. 3 điều kiện đủ — thiếu 1 là KHÔNG được chuyển đơn.',
        ],
        table: {
          headers: ['#', 'Điều kiện', 'Kiểm ở đâu'],
          rows: [
            ['1', 'File đã nằm đúng thư mục theo loại đơn', 'Phần 4'],
            ['2', 'Tên file đúng giai đoạn (GĐ1/2/3/4)', 'Phần 2'],
            ['3', 'Đơn cố định: quy cách đã gắn ở đầu tên file', 'Phần 2 + 3'],
          ],
        },
        bullets: [
          'Người chuyển đơn (Design/Ngọc): tự kiểm đủ 3 điều kiện trước khi bấm chuyển — chuyển đơn = cam kết file đã sẵn sàng.',
          'QC Print: đối chiếu 3 điều kiện trước khi cho đơn đi tiếp.',
          'Sản xuất: thiếu bất kỳ điều kiện nào → trả đơn về trên hệ thống, ghi rõ thiếu gì. Không tự đoán, không nhắn riêng hỏi.',
          '⚠️ Không được "làm tạm rồi sửa sau". Đơn thiếu file mà vẫn chạy tiếp thì lỗi tính cho người chuyển đơn.',
        ],
      },
      {
        id: 'trach-nhiem-van-hanh',
        title: '7. Trách nhiệm & vận hành hằng ngày',
        bullets: [
          'Đầu vào eBay & Amazon, đầu vào TikTok, theo dõi & set SKU đơn cố định: Ngọc - Ngân.',
          'Đơn hàng custom — brief, chốt quy cách: đội KD phụ trách đơn.',
          'Cut-off mẫu quay chụp hằng ngày: 9:00 sáng — sau cut-off chuyển sang ngày kế tiếp.',
          'Ngoại lệ ưu tiên (mẫu đang chạy tốt nhưng design delay 2–3 ngày): chỉ đội trưởng Kinh doanh được gửi yêu cầu ưu tiên cho Sản xuất — thành viên KD thường không được yêu cầu trực tiếp.',
          'QC Print tách riêng, người phân luồng & theo dõi tiến độ: Minh Thư — báo cáo hằng tuần tình hình thực tế.',
        ],
      },
      {
        id: 'luong-bao-loi',
        title: '8. Luồng báo lỗi & phân định trách nhiệm',
        paragraphs: [
          'Luồng báo lỗi trên hệ thống: Hiệp đang xây, sẽ hiển thị đầy đủ như bên EMB. Trong lúc chờ: báo lỗi trên hệ thống (phần ghi chú đơn) — không dùng Zalo.',
        ],
        bullets: [
          '4 thông tin bắt buộc khi báo lỗi: (1) Mã SKU/mã đơn, (2) Ảnh hoặc file lỗi, (3) Sai chỗ nào — mô tả cụ thể, (4) So với brief/yêu cầu nào.',
          'Báo lỗi thiếu 1 trong 4 mục trên → bên nhận có quyền yêu cầu bổ sung, chưa tính là đã báo.',
        ],
        table: {
          headers: ['Tình huống', 'Lỗi của', 'Căn cứ đối chiếu'],
          rows: [
            ['KD brief sai → Design làm đúng theo brief', 'Kinh doanh', 'Brief trên hệ thống'],
            ['Brief đúng → Design làm sai', 'Design', 'File build đối chiếu brief'],
            ['Chuyển đơn khi file chưa đủ điều kiện', 'Người chuyển đơn', 'Phần 6'],
            ['Trao đổi ngoài hệ thống rồi phát sinh lỗi', 'Cả hai bên', 'Quy định vàng'],
            ['Đơn cố định thiếu quy cách, SX tự đoán rồi sai', 'Sản xuất', 'Phần 6 — phải trả đơn, không đoán'],
          ],
        },
      },
      {
        id: 'checklist-theo-doi',
        title: '9. Checklist theo đội',
        bullets: [
          'Kinh doanh (SKU GĐ1): điền đúng Mã SP + Đội KD, ghép KDx.Dy bằng dấu chấm, ngày YYMMDD + STT 2 chữ số không trùng cùng ngày/cùng đội; brief đủ quy cách khi chốt đơn (brief thiếu = lỗi KD); cần ưu tiên mẫu quay chụp → báo đội trưởng, không tự gửi Sản xuất.',
          'Designer: New Design đặt tên chỉ từ Mã SP trở đi; Đơn Custom = [Biến thể]-[Mã đơn]; Đơn mẫu cố định gắn quy cách vào đầu SKU gốc; lưu đúng nhánh theo Phần 4; trước khi chuyển đơn — tự kiểm đủ 3 điều kiện Phần 6.',
          'QC Print: đối chiếu tên file ↔ SKU ↔ quy cách đơn yêu cầu; kiểm 3 điều kiện Phần 6 trước khi cho đơn đi tiếp; phát hiện lỗi → báo trên hệ thống đủ 4 thông tin bắt buộc.',
          'Sản xuất: đọc quy cách ở đầu tên file (Phần 3); đơn cố định thiếu quy cách → trả đơn, không tự đoán; copy file ra, không sửa file gốc; sai lệch tên file ↔ đơn → báo trên hệ thống, không nhắn riêng.',
        ],
      },
      {
        id: 'do-hieu-suat',
        title: '10. Đo hiệu suất & báo cáo',
        bullets: [
          'Vòng đời đơn hàng: lead time từ lúc nhận đơn → hoàn thành, tính theo từng sản phẩm.',
          'Hiệu suất từng nhân sự/công đoạn: thời gian thực tế mỗi người ở mỗi công đoạn.',
          'Người xuất dữ liệu: Hiệp. Tần suất báo cáo: 1 tuần/lần (trước đây theo tháng).',
          'Trạng thái: dữ liệu hệ thống còn xung đột, chưa đo chính xác được — chưa có số lead time chuẩn theo sản phẩm.',
        ],
      },
      {
        id: 'quy-tac-mo-rong',
        title: '11. Quy tắc mở rộng & thay đổi',
        bullets: [
          '⚠️ Phát sinh loại đơn, sàn mới hoặc sản phẩm mới → CHỈ bổ sung thêm field, GIỮ NGUYÊN cấu trúc gốc.',
          'Thêm mã mới (SP/designer/đội KD/quy cách/người phụ trách): thêm dòng vào bảng Phần 3, báo nhóm chung 3 đội trước khi dùng.',
          'Không đổi mã đã dùng (VD PLC → PC) — SKU cũ sẽ tra không ra. Nếu buộc phải đổi: giữ mã cũ + ghi chú ngừng dùng từ DD-MM-YYYY.',
          'Designer nghỉ việc: giữ nguyên mã Dx, ghi chú ngừng dùng. Không tái sử dụng mã cho người mới.',
          'Mỗi lần sửa file này → tăng số Phiên bản ở đầu file + báo 3 đội.',
        ],
      },
      {
        id: 'loi-thuong-gap',
        title: '12. Lỗi thường gặp',
        table: {
          headers: ['Lỗi', 'Đúng phải là'],
          rows: [
            ['New Design đặt tên W-M-PLC-KD1.D3-240726-01', 'PLC-KD1.D3-240726-01 — New Design chỉ từ Mã SP trở đi'],
            ['Còn dùng mã số lượng 1B / 2B', 'Đã bỏ — không dùng nữa'],
            ['Đơn cố định lưu PLC-KD1.D3-240726 (thiếu quy cách)', 'M-BNW-PLC-KD1.D3-240726 — bắt buộc có quy cách ở đầu'],
            ['Gắn quy cách vào cuối: PLC-KD1.D3-240726-M-BNW', 'Quy cách luôn ở ĐẦU: M-BNW-PLC-…'],
            ['Đơn Custom đặt full SKU', 'Đơn Custom chỉ [Biến thể]-[Mã đơn]'],
            ['File import hệ thống bị đổi tên theo SKU', 'Giữ nguyên order name của nền tảng'],
            ['KD1-D3', 'KD1.D3 — dấu chấm'],
            ['STT viết "1"', '"01" — luôn 2 chữ số'],
            ['Tên folder ngày "26-07-2024"', '"26-07" — chỉ DD-MM'],
          ],
        },
        bullets: [
          'Kinh doanh hay gặp: brief thiếu quy cách (màng, hộp, màu) → Design/SX phải đoán, làm lại; thành viên thường tự xin ưu tiên mẫu quay chụp → vỡ kế hoạch sản xuất; trao đổi qua Zalo thay vì hệ thống → lỗi phát sinh xử lý cả hai bên.',
          'Design hay gặp: quên copy New Design sang Đơn Media/[DD-MM] → SX thấy đơn nhưng không thấy file, đứng chờ; lưu đơn Custom vào FILE SẢN PHẨM → rác kho nguồn; chuyển đơn khi chưa đủ 3 điều kiện Phần 6 → lỗi tính cho người chuyển đơn.',
          'QC Print hay gặp: cho đơn đi tiếp khi file chưa đủ điều kiện → lỗi lọt xuống SX; báo lỗi thiếu 4 thông tin bắt buộc → bên nhận không xử lý được, mất thêm 1 vòng.',
          'Sản xuất hay gặp: thiếu quy cách nhưng tự đoán thay vì trả đơn → sai hàng loạt, lỗi tính cho SX; sửa trực tiếp file trong folder khoá → hỏng kho nguồn; nhắn riêng hỏi thay vì trả đơn trên hệ thống → không truy được, xử lý cả hai bên.',
        ],
      },
    ],
  },
];
