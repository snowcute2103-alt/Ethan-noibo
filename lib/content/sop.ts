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
  /** Ngày cập nhật gần nhất (DD/MM/YYYY) — dùng để xếp hạng "mới" trong bảng NEW ở trang chủ, tách khỏi effectiveDate vì effectiveDate là chuỗi mô tả tự do. */
  updatedAt: string;
  status: string;
  /** Optional — rule do BGĐ tự thêm qua trang admin không bắt buộc phải có. */
  goldenRule?: { title: string; points: string[] };
  sections: SopSection[];
}

export const RULE_DOCUMENTS: RuleDocument[] = [
  {
    id: 'sop-all-print-product',
    title: 'SOP ALL PRINT PRODUCT',
    subtitle: 'Quy tắc SKU · Đặt tên file · Lưu trữ NAS · Luồng đồng bộ & chốt chặn',
    version: '2.1',
    effectiveDate: 'Hiệu lực 07/08/2026 · Áp dụng từ 13/08/2026',
    updatedAt: '13/08/2026',
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
  {
    id: 'sop-qc',
    title: 'SOP-QC',
    subtitle: 'Khâu QC — Kiểm Hàng Sau Thêu & Đóng Gói',
    version: '1.0',
    effectiveDate: 'Ngày ban hành: đang chờ cập nhật',
    updatedAt: '04/08/2026',
    status: 'Ver 01 — Đang chờ ban hành · QC (khâu xử lý sau thêu)',
    goldenRule: {
      title: 'Mục tiêu duy nhất: tối đa số lượng đơn đi trong ngày — đọc trước khi vào ca',
      points: [
        'Một QC làm chủ trọn vẹn 1 đơn từ đầu đến cuối. Ai cũng làm được mọi loại đơn, từ Patch (Name, Logo, 3D) đến Shirt, Hat.',
        'Đơn ưu tiên luôn xử lý trước, ở mọi bước, bất kể đang làm dở đơn khác.',
        'Hết ca còn đơn dở dang → báo trực tiếp ca sau, không im lặng bỏ đi (xem mục 9 — Vận hành theo ca).',
        'Chủ động quan sát, hỗ trợ đồng đội đang gặp khó khăn, không chờ được yêu cầu mới hỗ trợ.',
        'QA phụ trách ca giám sát & điều phối chung. Bảo vệ tài sản và thiết bị khi làm việc, tránh hư hỏng.',
      ],
    },
    sections: [
      {
        id: 'thong-tin-tai-lieu',
        title: '1. Thông tin tài liệu',
        bullets: [
          'Mã tài liệu: QC-04082026-SOP.',
          'Phòng ban áp dụng: QC (Khâu xử lý sau thêu).',
          'Người soạn: Trần Trúc Thư.',
          'Người phê duyệt: Trần Vũ Quốc Bảo (CPO).',
          'Ngày ban hành: đang chờ cập nhật. Phiên bản: Ver 01.',
        ],
      },
      {
        id: 'muc-dich',
        title: '2. Mục đích (Purpose)',
        bullets: [
          'Chuẩn hóa quy trình xử lý đơn hàng tại QC/QA, từ khi nhận đơn thêu xong đến khi bàn giao Fulfillment.',
          'Đảm bảo mọi thành viên làm theo cùng một chuẩn, giảm sai sót và rút ngắn thời gian đào tạo người mới.',
          'Đảm bảo đơn ưu tiên luôn đi trong ngày.',
          'Hạn chế lỗi, tránh tình trạng khách complain hoặc phải thêu lại — gây trễ đơn và tăng chi phí sản xuất.',
        ],
      },
      {
        id: 'pham-vi-ap-dung',
        title: '3. Phạm vi áp dụng (Scope)',
        paragraphs: [
          'SOP này áp dụng cho nhân viên khâu xử lý thành phẩm sau khi thêu (QC), phụ trách các công đoạn sau:',
        ],
        bullets: [
          'Kiểm tra — lỗi phát sinh từ khâu làm file: sai chính tả, note sai màu chỉ trên file, làm file thiếu chi tiết, sai kích thước.',
          'Kiểm tra — lỗi phát sinh từ khâu chuẩn bị nguyên vật liệu: thiếu backing, backing style bị cắt ngược, cắt nhầm màu nền vải.',
          'Kiểm tra — lỗi phát sinh từ khâu thêu: chọn sai màu chỉ, thêu thiếu/mất nét, xù chỉ khi thêu.',
          'Kiểm tra — số lượng, kích thước, màu sắc, backing style đã cắt đủ hay chưa.',
          'Xử lý đơn — Patch: xé mếch (mex), cắt chỉ thừa mặt trước/sau, đốt viền để loại bỏ hoàn toàn sớ mex sau khi xé, sau đó ép backing style.',
          'Xử lý đơn — Nón/áo thêu: cắt chỉ mặt trước/sau, xé mếch, gấp gọn.',
          'Đóng gói — Patch thêu: đóng vào túi zip, đóng kín để tránh ẩm, mốc patch trong quá trình vận chuyển.',
          'Đóng gói — Patch in: đóng vào túi zip, đóng kín để tránh ẩm, mốc patch; kèm túi hút ẩm vì patch in PET dễ bị ẩm.',
          'Đóng gói — Áo/nón thêu: gấp gọn, đóng vào gói hút chân không chuyên dụng, hút chân không để giảm thể tích gói hàng.',
        ],
      },
      {
        id: 'dinh-nghia-viet-tat',
        title: '4. Định nghĩa & viết tắt (Definitions)',
        bullets: [
          'Printed/Hybrid Patch: loại patch in PET trực tiếp lên phôi, chỉ thêu viền và một vài chi tiết bên trong (nếu khách yêu cầu).',
          'Backing Style: lớp chất liệu hoặc cách xử lý ở mặt sau miếng dán để cố định nó lên quần áo, mũ hoặc túi xách.',
          'Sew-on: loại patch không có lớp backing (keo/velcro) sẵn ở mặt sau — khách hàng tự đính patch lên sản phẩm bằng kim chỉ; ở khâu xử lý chỉ cần cắt hết chỉ thừa mặt trước/sau, sau đó xử lý viền.',
          'Iron-on (Decal nhiệt): vật liệu ép nhiệt có phủ lớp keo dẻo ở mặt sau — lớp keo chỉ chảy ra và bám dính chắc chắn vào vải khi gặp nhiệt độ cao từ bàn ủi hoặc máy ép nhiệt.',
          'Hook (Mặt gai): mặt cứng của lớp velcro, bề mặt phủ các móc nhỏ li ti, dùng để gài chặt vào mặt Loop — thường được ép/may vào mặt sau patch để tạo khả năng tháo lắp.',
          'Loop (Mặt bông): mặt mềm của lớp velcro, bề mặt phủ các sợi vòng nhỏ (dạng bông), là nơi mặt Hook bám vào khi gài hai lớp velcro lại với nhau.',
        ],
      },
      {
        id: 'trach-nhiem',
        title: '5. Trách nhiệm (Responsibilities)',
        bullets: [
          'Người thực hiện (nhân viên khâu xử lý sản phẩm QC): nhận thông tin/đơn hàng từ ERP, thực hiện kiểm tra số lượng, chất lượng sản phẩm sau khi thêu xong.',
          'Người kiểm tra: mỗi QC tự chịu trách nhiệm cho đơn hàng mình xử lý — nhận đơn hàng, kiểm tra, xử lý, chụp ảnh upload hệ thống, duyệt đơn, đóng gói, in label.',
          'Người giám sát/quản lý: Trần Trúc Thư.',
        ],
      },
      {
        id: 'dung-cu-thiet-bi',
        title: '6. Dụng cụ, nguyên vật liệu, thiết bị cần thiết',
        paragraphs: ['Mỗi bàn làm việc QC bao gồm:'],
        bullets: [
          'Máy tính: kết nối hệ thống ERP, nhận thông tin/đơn hàng, mua label trực tiếp trên hệ thống.',
          'Máy in: in label sau khi đóng gói.',
          'Máy tính bảng (iPad): chụp ảnh sản phẩm thêu xong, làm bằng chứng khi khách hàng khiếu nại/thắc mắc.',
          'Máy cắt chỉ: cắt chỉ thừa ở mặt trước, mặt sau sản phẩm.',
          'Bàn ủi để bàn (loại nhỏ): xử lý ép Iron-on vào patch, dùng cho các đơn patch 3–6 inch.',
          'Máy ép nhiệt: dùng áp lực và nhiệt độ cao để ép backing, thường dùng cho đơn số lượng lớn hoặc đơn patch 3D.',
          'Đèn cồn: đốt chỉ, sớ mếch thừa ở viền patch, mặt sau của patch.',
          'Quẹt (bật lửa): đốt chỉ, sớ mếch thừa ở viền patch, mặt trước của patch.',
          'Kéo bấm chỉ: cắt sớ mếch loại dai, không xé ra được.',
        ],
      },
      {
        id: 'cac-buoc-thuc-hien',
        title: '7. Các bước thực hiện (Procedure)',
        paragraphs: [
          'Thứ tự ưu tiên: đơn cũ tồn ca trước → đơn trễ → đơn đi nhanh (Express/UPS) → đơn Logo/Name đủ thiết kế (1/1) → đơn được QA gắn cờ ưu tiên. Cùng một mức ưu tiên: số lượng ít làm trước, nhiều làm sau. Đơn được QA gắn cờ sẽ hiển thị màu vàng ở mọi khâu, hoặc QA chủ động push trực tiếp.',
          'Các bước xử lý đơn hàng, nhận hàng từ team thêu:',
        ],
        bullets: [
          '1. Xé mếch: dùng máy cắt chỉ thừa, kiểm tra nhanh số lượng và loại đơn (thường/trễ/ưu tiên), sau đó bỏ vào túi zip (line đỏ) đi kèm để hạn chế mất/thiếu đơn. Với đơn số lượng từ 15 cái trở lên, kiểm tra thêm chính tả, màu chỉ, màu nền để kịp thời báo lỗi, tránh trường hợp thêu sai toàn bộ đơn số lượng, gây tốn chi phí sản xuất — vận hành.',
          '2. Xử lý chi tiết: dùng kéo cắt chỉ để xử lý viền và bề mặt sản phẩm, không để lại chỉ thừa/sớ mếch thừa; dùng quẹt/đèn cồn đốt nhanh xung quanh patch để làm sạch những sớ mếch nhỏ không cắt được; dùng thêm cây lăn bụi nếu chỉ thừa/sớ mếch bám chặt trên bề mặt patch. Chụp ảnh và upload lên hệ thống ERP.',
          '3. Xử lý backing style — Sew-on: không có lớp backing sẵn ở mặt sau, chỉ cần cắt hết chỉ thừa ở mặt trước/sau, sau đó xử lý viền.',
          '3. Xử lý backing style — Iron-on: quay mặt keo vào mặt sau sản phẩm, dùng bàn ủi mức nhiệt medium đè lên, khoảng 180°C trong 8 giây.',
          '3. Xử lý backing style — Hook only/Loop only: đã được thêu trực tiếp vào patch, chỉ cần xử lý patch như Iron-on.',
          '3. Xử lý backing style — Hook & Loop (Velcro): mặt gai đã được thêu trực tiếp vào patch, ép Iron-on vào mặt bông, cách ép giống như trên.',
          '4. Đóng gói patch: đóng vào túi zip bóng (line trắng), kèm gói hút ẩm nếu là patch in PET/Hybrid. Sau đó duyệt đơn trên hệ thống ERP ở tab "Kiểm hàng".',
          '5. Đóng gói đơn hàng: đóng vào túi chống sốc (bubble mailer) hoặc phong bì giấy cứng (paper envelope), chọn kích thước phù hợp với đơn hàng. Kiểm tra thông tin khách hàng đúng hết mới mua label và dán lên đơn.',
        ],
        table: {
          headers: ['Bước', 'Nội dung'],
          rows: [
            ['Nhận đơn', 'Nhận đơn từ khâu thêu.'],
            ['Bước 1', 'Vệ sinh sơ bộ (xé mếch + cắt chỉ thừa + phân loại đơn) → rẽ nhánh: Đơn ưu tiên (mục 7.2) / Đơn thường (đủ số lượng, thiết kế) / Đơn chờ (thiếu số lượng, thiết kế — quay lại Bước 1 khi đủ).'],
            ['Bước 2', 'Xử lý chi tiết (xử lý sạch + chụp ảnh proof).'],
            ['Bước 3', 'Ép backing style (mục 7.3, bước 3).'],
            ['Bước 4', 'Đóng gói & duyệt đơn (duyệt đơn trên hệ thống ERP).'],
            ['Bước 5', 'Đóng hàng & in label (đóng gói thành phẩm + mua label).'],
            ['Kết thúc', 'Đóng thùng.'],
          ],
        },
      },
      {
        id: 'loi-tu-san-xuat',
        title: '8.1. Lỗi thường gặp — từ sản xuất',
        paragraphs: ['Nhận biết lỗi để trả đơn về đúng khâu trước đó xử lý:'],
        table: {
          headers: ['Tên lỗi', 'Khâu gây lỗi', 'Cách xử lý'],
          rows: [
            ['Sai chính tả', 'Thiết kế (Design)', 'Loại ngay, không đóng gói. Báo Thiết kế sửa file trước khi thêu lại.'],
            ['Sai kích thước', 'Thiết kế (Design)', 'Tạm dừng, đối chiếu lại thông số kỹ thuật với Thiết kế.'],
            ['Chọn sai màu / màu lệch', 'Thiết kế hoặc Thêu', 'Lệch nhẹ 1–2 tone: cho qua. Lệch hẳn: tạm dừng, hỏi đội trưởng design/thêu trước khi báo lỗi.'],
            ['Sai nền', 'Khâu Chuẩn bị (Preparing)', 'Loại, đối chiếu lại đơn gốc, double check với đội trưởng team design rồi báo lỗi.'],
            ['Thiếu backing', 'Khâu Chuẩn bị (Preparing)', 'Nhắn nhóm sản xuất để bổ sung nhanh, không cần báo lỗi hệ thống.'],
            ['Printed Patch / in PET bị lệch màu', 'Khâu Chuẩn bị (Preparing)', 'Double check với đội trưởng design rồi báo lỗi.'],
            ['Thiếu nét, xù chỉ, sai màu chỉ hoàn toàn, đường chỉ thêu thiếu/lệch', 'Khâu Thêu', 'Double check với đội trưởng đội thêu, báo lỗi thêu để thêu lại.'],
          ],
        },
        bullets: [
          'Quy tắc màu (chỉ/nền/PET): lệch không nhiều → cho qua, không cần báo lỗi. Lệch hẳn → KHÔNG tự ý báo lỗi ngay, phải hỏi lại đội trưởng khâu liên quan, Support hoặc QA để xác nhận trước.',
        ],
      },
      {
        id: 'loi-do-qc',
        title: '8.2. Lỗi do chính QC gây ra trong thao tác',
        paragraphs: ['QC tự chịu trách nhiệm cho các lỗi phát sinh trong lúc thao tác:'],
        table: {
          headers: ['Lỗi', 'Cách xử lý'],
          rows: [
            ['Sản phẩm bị bẩn', 'Vệ sinh lại nếu còn có thể; không được thì loại bỏ, ghi nhận hao hụt.'],
            ['Backing không dính', 'Dán/ép lại; không đóng gói khi backing chưa chắc.'],
            ['Xé mếch làm rách border', 'Loại bỏ, ghi nhận hao hụt, báo QA nếu cần làm bù từ khâu Thêu.'],
            ['Hơ lửa làm cháy sản phẩm', 'Loại bỏ, ghi nhận hao hụt, báo QA phụ trách ca.'],
            ['Làm mất đơn', 'Báo ngay cho QA để kéo đơn về sản xuất lại.'],
          ],
        },
      },
      {
        id: 'van-hanh-theo-ca',
        title: '9. Vận hành theo ca',
        paragraphs: [
          'Mục tiêu chung: tối đa số lượng đơn đi trong ngày, đi hết toàn bộ đơn cũ nếu còn kịp giờ xuất.',
        ],
        bullets: [
          'Ca sáng: xử lý đơn cũ tồn từ ca tối hôm trước và đơn Ưu tiên 1 phát sinh trong ca. Đơn Ưu tiên còn dang dở → bàn giao rõ cho ca tối.',
          'Ca tối: xử lý đơn ưu tiên còn tồn/mới phát sinh, đảm bảo đi trong ngày. Thứ tự xử lý: (1) đơn ưu tiên, đơn trễ, đơn name/patch thường; (2) đơn mới trong ca đã đủ số lượng; (3) đơn chưa đủ thiết kế → bàn giao lại cho ca sáng.',
          'Cuối ca sáng: cập nhật hệ thống đơn đã xong / đơn thiếu thiết kế (kèm vị trí lưu) / đơn ưu tiên chưa xong; đơn khẩn cấp chưa xong ghi rõ lý do, báo trực tiếp ca tối và QA — không rời ca khi chưa bàn giao rõ; rút nguồn thiết bị điện không sử dụng.',
          'Đầu ca sáng hôm sau: xử lý đơn tồn từ ca tối trước khi nhận đơn mới của riêng mình; hỗ trợ ngay lỗi hệ thống/label mà ca tối chưa xử lý được.',
          'Cuối ca tối (kết thúc ngày làm việc): rút nguồn toàn bộ thiết bị điện trước khi ra về.',
          'Hỗ trợ chéo: chủ động quan sát cả đội trong ca — thấy ai gặp khó khăn thì hỗ trợ ngay, không chờ được yêu cầu; xong việc sớm → hỗ trợ đơn ưu tiên hoặc đơn thiếu đang chờ ghép của người khác; ca tối quá tải → báo ngay QA để được hỗ trợ hoặc chuyển ưu tiên xử lý cho ca sau.',
        ],
      },
      {
        id: 'lich-su-sua-doi-qc',
        title: '10. Lịch sử sửa đổi (Revision history)',
        table: {
          headers: ['Phiên bản', 'Ngày ban hành', 'Nội dung thay đổi', 'Người soạn'],
          rows: [
            ['v1.0', 'Đang chờ cập nhật', 'Phiên bản đầu tiên — SOP khâu QC (kiểm hàng sau thêu & đóng gói).', 'Trần Trúc Thư'],
          ],
        },
        bullets: ['Ghi chú: SOP sẽ được review và cập nhật lại sau 2–4 tuần áp dụng thực tế.'],
      },
    ],
  },
  {
    id: 'sop-preparing',
    title: 'SOP-PREPARING',
    subtitle: 'Khâu Chuẩn Bị Nguyên Liệu (Preparing)',
    version: '1.0',
    effectiveDate: 'Ngày ban hành: 10/08/2026',
    updatedAt: '10/08/2026',
    status: 'Ver 01 — Preparing (khâu chuẩn bị nguyên liệu)',
    goldenRule: {
      title: 'An toàn trên hết — đọc trước khi vận hành máy cắt laser & máy ép nhiệt',
      points: [
        'Tuyệt đối không đưa tay, chân hoặc vật dụng vào điểm hội tụ tia laser. Tuyệt đối không chạm vào buồng cắt khi máy đang chạy.',
        'Đảm bảo hệ thống hút khói và làm mát (chiller) hoạt động bình thường trước khi vận hành, tránh hít phải khói/khí độc sinh ra khi cắt.',
        'Không đặt tay vào khu vực mâm ép khi máy đang trong chu trình ép — đặc biệt ở chế độ auto, dễ kẹp tay khi mâm ép hạ xuống.',
        'Nhân viên mới cần làm quen với chế độ manual của máy ép nhiệt trước khi chuyển sang auto.',
        'Đeo găng tay chịu nhiệt khi thao tác gần mâm ép nóng hoặc khi bóc giấy/PET còn nóng.',
      ],
    },
    sections: [
      {
        id: 'thong-tin-tai-lieu-prep',
        title: '1. Thông tin tài liệu',
        bullets: [
          'Mã tài liệu: PRE-05082026-SOP.',
          'Phòng ban áp dụng: Preparing (Khâu chuẩn bị nguyên liệu).',
          'Người soạn: Đặng Đoàn Bảo Hân.',
          'Người phê duyệt: Trần Vũ Quốc Bảo (CPO).',
          'Ngày ban hành: 10/08/2026. Phiên bản: Ver 01.',
        ],
      },
      {
        id: 'muc-dich-prep',
        title: '2. Mục đích (Purpose)',
        bullets: [
          'Đảm bảo tính nhất quán — để ai làm cũng ra kết quả giống nhau, không phụ thuộc vào tay nghề hay thói quen riêng của từng người.',
          'Giảm sai sót, lỗi sản phẩm — chuẩn hóa các bước để tránh bỏ sót, làm sai thứ tự, hay quên kiểm tra.',
          'Rút ngắn thời gian đào tạo — người mới vào có thể đọc SOP và làm được ngay, không cần cầm tay chỉ việc quá lâu.',
          'Kiểm soát chất lượng đầu ra — đặt ra tiêu chuẩn rõ ràng để biết sản phẩm đạt hay không đạt.',
          'Tối ưu thời gian/chi phí — loại bỏ thao tác thừa, sắp xếp quy trình hợp lý hơn.',
        ],
      },
      {
        id: 'pham-vi-ap-dung-prep',
        title: '3. Phạm vi áp dụng (Scope)',
        paragraphs: [
          'SOP này áp dụng cho nhân viên khâu chuẩn bị nguyên liệu (Preparing), phụ trách các công đoạn sau:',
        ],
        bullets: [
          'Nhận thông tin/file sản xuất: sử dụng phần mềm ERP của team để nhận file đã hoàn thành khâu design, xác nhận đơn hàng đã sẵn sàng chuyển qua khâu chuẩn bị nguyên liệu.',
          'Ép dựng vải: sử dụng máy ép nhiệt để ép lớp dựng vào vải, giúp vải chắc chắn, cứng cáp, không bị rách khi thêu.',
          'Cắt laser: vận hành máy cắt laser (loại 1 đầu và loại 2 đầu) để cắt phôi, backing style theo file.',
          'Đối với patch in (printed patch): thực hiện thêm 2 bước sau khi cắt phôi — In PET (dùng máy in PET để in file PET lên phôi) và Ép PET (dùng máy ép nhiệt để ép lớp PET đã in lên phôi).',
          'In label sản xuất và dán vào túi zip chứa phôi của đơn hàng tương ứng, để đảm bảo truy xuất đúng đơn khi chuyển sang khâu thêu.',
          'Đối với sản phẩm áo, nón: chỉ cần in label của đơn hàng; nhân viên kho sẽ chịu trách nhiệm lấy phôi áo, nón tương ứng để bàn giao cho team thêu.',
        ],
      },
      {
        id: 'dinh-nghia-viet-tat-prep',
        title: '4. Định nghĩa & viết tắt (Definitions)',
        bullets: [
          'PET (in PET): kỹ thuật in hình ảnh lên một lớp màng PET (nhựa polyester mỏng, trong suốt), sau đó dùng nhiệt ép lớp màng này lên bề mặt phôi (vải, patch). Lớp mực bám vào PET tạo hiệu ứng bề mặt mịn, bền màu, ít bong tróc hơn so với in trực tiếp lên vải, thường dùng cho patch in (printed patch).',
          'Chuyển nhiệt (Heat transfer): quy trình chi tiết được trình bày trong tài liệu riêng — Báo cáo thiết lập & quy trình in chuyển nhiệt.',
          'VDD (Vải dựng dày): loại vải nền dệt thô hoặc dệt thoi chắc chắn, độ cứng cao, có lớp keo ở một mặt, chảy ra khi gặp nhiệt. Dùng để ép lót support cho vải chính khi thêu, giúp vải không bị biến dạng hoặc rách trong quá trình thêu.',
          'VDT (Vải dựng thường): loại vải có lớp keo ở một mặt, dùng để support cho vải chính, giúp vải cứng cáp và tránh biến dạng khi thêu. So với VDD, VDT mỏng và mềm hơn, dùng cho các đơn nhẹ hơn: đơn thêu tên (name), đơn in PET, hoặc đơn thêu ít mũi chỉ.',
          'Backing Style: lớp chất liệu hoặc cách xử lý ở mặt sau miếng dán để cố định nó lên quần áo, mũ hoặc túi xách.',
          'Iron-on (Decal nhiệt): vật liệu ép nhiệt có phủ lớp keo dẻo ở mặt sau. Lớp keo chỉ chảy ra và bám dính chắc chắn vào vải khi gặp nhiệt độ cao từ bàn ủi hoặc máy ép nhiệt.',
          'Sew-on: loại patch không có lớp backing (keo/velcro) sẵn ở mặt sau. Khách hàng tự đính patch lên sản phẩm bằng kim chỉ. Do đó ở khâu chuẩn bị, không cần thực hiện bước cắt/ép backing cho loại patch này.',
          'Hook (Mặt gai): mặt cứng của lớp velcro, bề mặt phủ các móc nhỏ li ti, dùng để gài chặt vào mặt Loop. Thường được ép/may vào mặt sau patch để tạo khả năng tháo lắp.',
          'Loop (Mặt bông): mặt mềm của lớp velcro, bề mặt phủ các sợi vòng nhỏ (dạng bông), là nơi mặt Hook bám vào khi gài hai lớp velcro lại với nhau.',
        ],
      },
      {
        id: 'trach-nhiem-prep',
        title: '5. Trách nhiệm (Responsibilities)',
        bullets: [
          'Người thực hiện (nhân viên khâu chuẩn bị nguyên liệu): nhận thông tin/đơn hàng từ ERP (file lấy trên Drive), thực hiện các bước ép dựng, cắt laser, in PET/ép PET (nếu có), in label và đóng gói phôi vào túi zip theo đúng đơn hàng.',
          'Người kiểm tra (không có QC riêng tại khâu này): việc kiểm tra chất lượng phôi được thực hiện gián tiếp bởi khâu thêu và khâu QC sau thêu. Nếu phát hiện lỗi (sai kích thước, sai màu, thiếu backing...), các bộ phận này sẽ báo lỗi lại trên hệ thống ERP để khâu chuẩn bị nguyên liệu cắt/xử lý bổ sung.',
          'Người giám sát/quản lý: Trần Vũ Quốc Bảo (CPO).',
        ],
      },
      {
        id: 'dung-cu-thiet-bi-prep',
        title: '6. Dụng cụ, nguyên vật liệu, thiết bị cần thiết',
        bullets: [
          'Thiết bị — Máy tính 1: chạy phần mềm thiết kế và biên dịch mã lệnh để điều khiển đường chạy chính xác của đầu cắt.',
          'Thiết bị — Máy tính 2: kết nối trực tiếp với máy in PET, đóng vai trò xử lý file thiết kế, quản lý màu sắc và truyền lệnh in đến máy.',
          'Thiết bị — Máy cắt laser: dùng để cắt và khắc lên nguyên vật liệu; đi kèm máy làm lạnh nước (Chiller) giữ nhiệt độ bóng đèn laser ổn định, máy nén khí nhỏ thổi bay xỉ cắt và bảo vệ thấu kính, quạt hút hút khói độc/mùi khét/bụi mịn ra ngoài.',
          'Thiết bị — Máy ép nhiệt 2 mâm (60x40): dùng áp lực và nhiệt độ cao để ép lớp hình từ màng PET dính chặt vào vải, ép dựng vào vải, hoặc làm phẳng vải; đi kèm máy nén khí lớn cấp lực khí nén để xi lanh tự động hạ/nâng mâm ép.',
          'Thiết bị — Máy in PET: máy in chuyên dụng công nghệ in phun (mực nước) để in hình ảnh lên màng PET với màu sắc sắc nét, độ bền cao, chuẩn bị cho bước ép PET lên phôi.',
          'Vật tư — Vải: 70 mã vải, đủ tone màu.',
          'Vật tư — Dựng vải: gồm VDD và VDT.',
          'Vật tư — Keo nhiệt: dùng cho Iron-on backing.',
          'Vật tư — Mặt bông, mặt gai (cuộn): dùng cho Hook/Loop (Velcro) backing.',
          'Vật tư — Màng PET/mực PET: dùng để in PET.',
          'Vật tư — Da PU: dùng cho sản phẩm patch da, 15 mã.',
          'Phần mềm/tài liệu tham chiếu: phần mềm ERP nội bộ (nhận file, quản lý đơn hàng); phần mềm thiết kế/biên dịch mã lệnh cho máy cắt laser (RD Works V8); phần mềm RIP file in, phần mềm in (Hosonsoft); bảng màu vải, bảng màu da.',
        ],
      },
      {
        id: 'ep-vai-dung',
        title: '7.1. Ép vải dựng',
        paragraphs: [
          'Chuẩn bị: Dựng cắt ngang 39cm, Vải cắt ngang 41.5cm — mâm ép nhiệt có kích thước 60x40cm, kích thước cắt có thể linh hoạt điều chỉnh sao cho tối ưu diện tích ép.',
        ],
        table: {
          headers: ['Loại dựng', 'Thông số ép', 'Cách đặt'],
          rows: [
            ['Dựng thường (VDT)', '180°C / 15 giây', 'Vải nằm dưới, dựng nằm trên, mặt keo của dựng đè lên vải.'],
            [
              'Dựng dày (VDD)',
              '180°C / 15 giây, để nguội rồi ép thêm 8 giây',
              'Vải nằm dưới, dựng nằm trên, mặt keo của dựng đè lên vải; để nguội, quay mặt vải lên trên, ép thêm 8 giây nữa.',
            ],
          ],
        },
        bullets: ['Lưu ý: tất cả các lần ép đều lót giấy nến ở trên.'],
      },
      {
        id: 'cat-laser',
        title: '7.2. Cắt laser',
        paragraphs: ['Cắt phôi đúng màu, đúng loại vải dựng, đủ số lượng theo đơn. Cắt đủ backing theo từng loại:'],
        bullets: [
          'Iron-on: cắt đúng mặt keo nhiệt — mặt keo quay lên trên, mặt giấy trắng nằm dưới bàn cắt.',
          'Hook only: mặt gai (hook) quay xuống dưới.',
          'Loop only: mặt bông (loop) quay xuống dưới.',
          'Hook & Loop (velcro): mặt gai quay xuống dưới, mặt bông quay lên trên; cắt thêm 1 miếng keo nhiệt với mặt keo quay lên trên.',
          'Lưu ý: velcro rất dễ cắt sai mặt, cần chú ý kỹ.',
        ],
      },
      {
        id: 'embroidered-patch',
        title: '7.3. Đối với Embroidered patch (ERP hiện status "in pet: fails")',
        bullets: [
          '1. Mở phần mềm RD Works V8, mở máy laser.',
          '2. Import file (Ctrl+I), chọn file lấy từ Drive, đuôi .ai.',
          '3. Chọn màu vải/màu da theo note trên ERP và cắt (đã thực hiện chi tiết ở mục 7.2), chú ý số lượng để tránh cắt thiếu.',
          '4. In label sản xuất, dán lên túi zip chứa phôi vừa cắt. ERP tự động đẩy đơn hàng qua khâu thêu.',
        ],
      },
      {
        id: 'printed-patch',
        title: '7.4. Đối với Printed patch (ERP hiện status "in pet: true")',
        bullets: [
          '1. Cắt phôi theo mục 7.2.',
          '2. In PET / ép PET lên phôi (xem mục 7.4.1 và 7.4.2).',
          '3. In label sản xuất, dán lên túi zip chứa phôi vừa cắt.',
        ],
      },
      {
        id: 'quy-trinh-in-pet',
        title: '7.4.1. Quy trình in PET',
        bullets: [
          '1. Mở file thiết kế trên Máy tính 2 (kết nối máy in PET).',
          '2. Kiểm tra file: đúng kích thước, đúng hệ màu theo chuẩn máy in PET.',
          '3. Nạp màng PET vào máy in.',
          '4. In file lên màng PET.',
          '5. Rắc bột PET lên bề mặt vừa in khi mực còn ướt.',
          '6. Đưa vào lò nướng/sấy để bột PET chảy ra và bám cố định vào lớp mực.',
          '7. Để nguội, kiểm tra bề mặt trước khi chuyển qua bước ép PET.',
          'Lưu ý: nhiệt độ/thời gian nướng cụ thể, loại bột PET và cách rắc bột (thủ công hay máy) sẽ được bổ sung trong lần cập nhật tiếp theo của SOP.',
        ],
      },
      {
        id: 'quy-trinh-ep-pet',
        title: '7.4.2. Quy trình ép PET',
        paragraphs: ['Ép PET ở nhiệt độ 170–180°C:'],
        table: {
          headers: ['Lần ép', 'Chi tiết'],
          rows: [
            ['Lần 1', 'Ép 18 giây, PET ở dưới, phôi ở trên.'],
            ['Lần 2', 'Lật ngược lại, ép 6 giây.'],
            ['Lần 3', 'Lột PET, ép 6 giây để PET bám chặt vào phôi (ép thêm 1 lần nếu chưa bám).'],
          ],
        },
        bullets: ['Lưu ý: cả 3 lần ép đều lót giấy nến ở trên.'],
      },
      {
        id: 'tieu-chuan-chat-luong',
        title: '8. Tiêu chuẩn chất lượng / Điểm kiểm soát (Quality checkpoints)',
        bullets: [
          'Ép dựng: dựng bám phẳng, không bong mép, không nhăn/phồng rộp.',
          'Cắt laser: đúng kích thước, đúng màu vải/da, không cháy mép, đủ số lượng, đúng loại backing, đúng mặt (đặc biệt velcro); chỉnh lực thổi (khí nén) phù hợp và vệ sinh sạch máy hút khói định kỳ để tránh tình trạng khói ám đen vào phôi.',
          'In PET: hình sắc nét, đúng màu, không lem, bột PET bám đều.',
          'Ép PET: PET bám chắc vào phôi, không bong tróc, không phồng rộp, không ố vàng do nhiệt quá cao.',
        ],
      },
      {
        id: 'xu-ly-su-co',
        title: '9. Xử lý sự cố / Lỗi thường gặp (Troubleshooting)',
        table: {
          headers: ['Hiện tượng', 'Nguyên nhân', 'Cách khắc phục'],
          rows: [
            [
              'Dựng bong tróc, phồng rộp sau khi ép',
              'Nhiệt độ/thời gian ép chưa đủ, hoặc keo dựng kém chất lượng',
              'Ép lại đúng thông số (180°C, VDT 15s / VDD 15s + 8s); kiểm tra lô dựng đang dùng.',
            ],
            ['Phôi bị cháy mép khi cắt laser', 'Power quá cao hoặc speed quá chậm', 'Điều chỉnh lại preset power/speed phù hợp với loại vải/da.'],
            ['Khói ám đen vào phôi khi cắt', 'Máy hút khói yếu hoặc bẩn', 'Vệ sinh quạt hút, kiểm tra máy hút khói định kỳ, chỉnh lại lực thổi.'],
            [
              'Cắt sai mặt backing (đặc biệt velcro Hook/Loop)',
              'Thao tác nhầm mặt gai/mặt bông khi cắt',
              'Kiểm tra kỹ mặt vật liệu trước khi cắt, đối chiếu hướng dẫn ở mục 7.2.',
            ],
            ['Cắt thiếu số lượng phôi', 'Không đối chiếu kỹ số lượng trên ERP trước khi cắt', 'Đối chiếu số lượng trên ERP trước và sau khi cắt.'],
            [
              'Hình in PET bị lem, không sắc nét',
              'Đầu phun máy in PET nghẹt/bẩn',
              'Vệ sinh/ngâm đầu phun theo lịch (chiều thứ 7 hàng tuần); ngâm bổ sung nếu phát hiện lem.',
            ],
            [
              'Bột PET không bám đều sau khi rắc',
              'Rắc bột khi mực đã khô, hoặc rắc không đều tay',
              'Rắc bột ngay khi mực còn ướt, rắc đều khắp bề mặt hình in.',
            ],
            ['PET bong tróc sau khi ép', 'Nhiệt độ/thời gian ép chưa đủ', 'Ép thêm 1 lần nữa theo đúng quy trình 3 lần ở mục 7.4.2.'],
            ['PET bị cháy, ố vàng', 'Nhiệt độ ép quá cao', 'Giảm nhiệt độ về đúng khoảng 170–180°C.'],
          ],
        },
      },
      {
        id: 'an-toan-lao-dong',
        title: '10. An toàn lao động',
        bullets: [
          'Máy cắt laser — tuyệt đối không đưa tay, chân hoặc vật dụng vào điểm hội tụ tia laser.',
          'Máy cắt laser — tuyệt đối không chạm vào buồng cắt khi máy đang chạy.',
          'Máy cắt laser — đảm bảo hệ thống hút khói và làm mát (chiller) hoạt động bình thường trước khi vận hành, tránh hít phải khói/khí độc sinh ra khi cắt.',
          'Máy cắt laser — có thể đóng nắp buồng máy khi đang cắt để hạn chế khói thoát ra ngoài.',
          'Máy ép nhiệt 2 đầu — máy có 2 chế độ: manual (bấm nút để hạ mâm ép) và auto (mâm tự động hạ). Nhân viên mới cần làm quen với chế độ manual trước khi chuyển sang auto.',
          'Máy ép nhiệt 2 đầu — lực ép và nhiệt độ của máy khá cao, cẩn thận tránh kẹp tay khi mâm ép hạ xuống, đặc biệt ở chế độ auto.',
          'Máy ép nhiệt 2 đầu — không đặt tay vào khu vực mâm ép khi máy đang trong chu trình ép.',
          'Máy ép nhiệt 2 đầu — đeo găng tay chịu nhiệt khi thao tác gần mâm ép nóng hoặc khi bóc giấy/PET còn nóng.',
        ],
      },
      {
        id: 'bieu-mau-ho-so',
        title: '11. Biểu mẫu / Hồ sơ liên quan (Records)',
        bullets: [
          'Label sản xuất: in theo đơn hàng từ ERP, dán vào túi zip chứa phôi — dùng để truy xuất đơn hàng và bàn giao qua khâu thêu.',
          'Log lỗi/báo lỗi từ khâu sau (ERP): ghi nhận các lỗi được khâu thêu/QC báo về (sai kích thước, sai màu, thiếu backing...) để khâu chuẩn bị xử lý cắt/bổ sung lại.',
          'Checklist vệ sinh & bảo trì — Máy in PET: ngâm/vệ sinh đầu phun mỗi cuối tuần (chiều thứ 7).',
          'Checklist vệ sinh & bảo trì — Máy cắt laser: lau sạch thấu kính mỗi 2–3 tuần.',
          'Checklist vệ sinh & bảo trì — Quạt hút (máy laser): vệ sinh khi thấy lực hút yếu.',
          'Checklist vệ sinh & bảo trì — Máy ép nhiệt: vệ sinh mâm ép khi thấy dơ, khoảng 2–3 ngày/lần.',
        ],
      },
      {
        id: 'lich-su-sua-doi-prep',
        title: '12. Lịch sử sửa đổi (Revision history)',
        table: {
          headers: ['Phiên bản', 'Ngày ban hành', 'Nội dung thay đổi', 'Người soạn'],
          rows: [
            ['v1.0', '06/08/2026', 'Phiên bản đầu tiên — SOP khâu chuẩn bị nguyên liệu (Preparing).', 'Đặng Đoàn Bảo Hân'],
          ],
        },
        bullets: ['Ghi chú: SOP sẽ được review và cập nhật lại sau 2–4 tuần áp dụng thực tế.'],
      },
    ],
  },
];
