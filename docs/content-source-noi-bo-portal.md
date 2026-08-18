# Nguồn nội dung cho trang Nội Bộ (nạp cho thiết kế UI/UX)

Ngày tổng hợp: 15/08/2026. Nguồn: 2 Google Docs do người dùng cung cấp + nội dung dán trực tiếp trong chat.

## 0. Bối cảnh hệ thống hiện có (đọc trước khi thiết kế)

App Next.js đã scaffold: đăng nhập theo tài khoản dùng chung của khối/cấp, dashboard lọc nội dung theo quyền.

- `Department`: `bgd | kinh-doanh | sx-theu | sx-in | rnd | it | fulfillment`
- `Tier`: `staff | leader | full` (bgd luôn là tier `full` và **luôn xem được mọi nội dung** bất kể gắn visibility gì — xem `lib/roles.ts::canView`)
- Nội dung hiện có 1 loại duy nhất: `Announcement` (`lib/content.ts`), có `visibility: { departments: Department[] | 'all', minTier? }`
- Dashboard hiện tại (`app/dashboard/page.tsx`) chỉ render list thông báo phẳng, chưa phân nhóm theo loại nội dung.

**Vấn đề cần thiết kế giải quyết:** cần thêm các LOẠI nội dung mới (không chỉ thông báo chung), mỗi loại có cách gắn quyền xem khác nhau, và cần layout/thiết kế lại toàn bộ trang dashboard cho gọn gàng, phân khu rõ ràng, không rối khi nhiều loại nội dung cùng hiển thị.

---

## 1. Rule file — SOP ALL PRINT PRODUCT (nguồn: Google Doc rule)

Đây là tài liệu SOP nội bộ, áp dụng cho 3 khối cụ thể — **KHÔNG áp dụng cho toàn công ty**. BGĐ có quyền xem mọi rule bất kể tài liệu này gắn cho khối nào.

- **Tiêu đề:** SOP ALL PRINT PRODUCT — Quy tắc SKU · Đặt tên file · Lưu trữ NAS · Luồng đồng bộ & chốt chặn
- **Áp dụng cho (visibility gốc):** 🏭 Sản xuất · 🎨 Designer/QC · 💼 Kinh doanh (map sang Department hiện có: `sx-theu`, `sx-in`, `kinh-doanh`; `rnd`/`it` không thuộc phạm vi tài liệu này — cần hỏi lại nếu chưa rõ Designer/QC map vào đâu trong hệ thống)
- Phiên bản 2.1, hiệu lực 07-08-2026, áp dụng từ 13/08/2026
- Trạng thái: ⚠️ Đang hoàn thiện — chưa phổ biến với Design

### Quy định vàng (nổi bật, đặt đầu tài liệu khi hiển thị)
Mọi trao đổi về đơn/file/lỗi PHẢI trên hệ thống. Zalo/tin nhắn riêng không có giá trị làm căn cứ — "đã trao đổi ở đó = coi như chưa trao đổi". Trao đổi ngoài hệ thống mà phát sinh lỗi → xử lý cả hai bên. Áp dụng mọi sàn (TikTok, eBay, Amazon), không ngoại lệ.

### Cấu trúc nội dung đầy đủ (12 phần + phụ lục — hiển thị dạng tài liệu có mục lục / accordion, không phải feed thông báo)
1. Cấu trúc SKU (công thức, thứ tự thành phần theo khối ĐẦU/THÂN, quy tắc viết)
2. Tên file theo từng giai đoạn (GĐ1 New Design, GĐ2 Custom, GĐ3 mẫu cố định, GĐ4 import hệ thống) ⭐ quan trọng
3. Bảng mã tra cứu — sửa trực tiếp được: mã biến thể/quy cách, mã sản phẩm, mã đội KD (KD1–KD6 + tên đội trưởng), mã Designer (D1–D9 + tên), người phụ trách từng đầu việc
4. Cấu trúc thư mục NAS + quy ước đặt tên folder ngày (DD-MM, khác định dạng SKU YYMMDD)
5. Quy trình đồng bộ Design ↔ Ngọc (admin hệ thống) ↔ Sản xuất
6. **Điều kiện chuyển đơn (chốt chặn)** ⭐ — 3 điều kiện đủ, thiếu 1 là không được chuyển; bảng "ai làm gì"
7. Trách nhiệm & vận hành hằng ngày (phân công theo nền tảng, cut-off mẫu quay chụp 9:00 sáng, cơ cấu QC Print)
8. Luồng báo lỗi & phân định trách nhiệm (4 thông tin bắt buộc khi báo lỗi; bảng phân định lỗi thuộc bộ phận nào)
9. Checklist theo đội (4 khối: Kinh doanh / Designer / QC Print / Sản xuất) — dùng làm 4 thẻ/tab riêng
10. Đo hiệu suất & báo cáo (2 chỉ số, báo cáo 1 tuần/lần, phụ trách: Hiệp)
11. Quy tắc mở rộng & thay đổi (không đổi mã đã dùng, tăng version khi sửa file)
12. Lỗi thường gặp (2 bảng: lỗi đặt tên file, lỗi quy trình theo bộ phận) — dùng để cảnh báo/tra cứu nhanh
- Phụ lục: mục đã chốt / chưa chốt (còn dang dở, nội dung docs bị cắt ở cuối — có thể chưa đầy đủ 100%)

**Gợi ý UI cho loại nội dung "Rule/SOP":** khác hẳn Announcement — cần mục lục cố định (sticky TOC), search/tra cứu bảng mã, khối "Quy định vàng" nổi bật cảnh báo, mở/đóng từng phần (accordion), không nên đổ hết thành 1 khối text.

---

## 2. Nội dung văn hoá / "blog nội bộ" (nguồn: Google Doc phỏng vấn ban lãnh đạo)

Tài liệu gốc là bộ câu hỏi phỏng vấn, đã có câu trả lời của founder/CEO. Mỗi câu đánh dấu **[Đối ngoại]** (đã lên web ethanecom.com rồi — KHÔNG cần đăng lại ở đây), **[Đối nội]** (CHỈ hiển thị ở trang nội bộ này), **[Cả hai]**.

→ **Khi dựng nội dung cho trang nội bộ: chỉ lấy phần [Đối nội] và [Cả hai]. Bỏ qua phần thuần [Đối ngoại] vì đã public.**

Visibility đề xuất: `{ departments: 'all' }` — nội dung văn hoá công ty, không phải tài liệu vận hành theo khối.

### Thông tin công ty (Cả hai — có thể giữ làm phần giới thiệu ngắn)
- Tên pháp lý: Công Ty TNHH MTV Phát Triển Công Nghệ Ethan · Hoạt động 2017–2026
- Địa chỉ: 61/1G Võ Dõng 2, Thống Nhất, Đồng Nai · Giờ làm: 7:30–17:00 T2–T7 (nghỉ trưa 1h30)
- Quy mô: 88 nhân sự (18/06/2026) — 56 nữ / 32 nam

### Tầm nhìn — Sứ mệnh — Giá trị cốt lõi (Cả hai, nên làm khối nổi bật riêng)
- **Giá trị cốt lõi (5):** Đồng lòng · Tử tế · Trách nhiệm · Cải tiến · Bền bỉ
- **Tầm nhìn 3–5 năm:** trở thành công ty e-commerce có hệ thống vận hành bài bản từ R&D sản phẩm, marketing, bán hàng đến sản xuất; tự chủ sản phẩm & sản xuất, phát triển bền vững trên thị trường quốc tế.
- **Sứ mệnh:** tạo sản phẩm chất lượng, giá trị thật cho khách quốc tế; xây môi trường để mỗi người phát triển năng lực, cùng nhau đi lên.
- **Hành vi cụ thể theo giá trị (Đối nội):** sẵn sàng hỗ trợ đồng đội; không đổ lỗi/bè phái; cùng cố gắng vì mục tiêu chung; góp ý thẳng thắn, xây dựng, không nói sau lưng.

### Câu chuyện Founder (Đối nội — chất liệu cảm xúc, phù hợp mục "Câu chuyện Ethan")
- Trước khi mở Ethan: founder buôn heo ở chợ đầu mối, được anh trai dẫn vào MMO (Facebook ads) từ 2016.
- Bước ngoặt khó khăn nhất (2018–2019): toàn bộ tài khoản Merch by Amazon bị suspend cùng lúc, team chỉ 4 người, từng định giải tán — nhưng 2 người đồng hành từ chối rời đi, khiến founder quyết tâm tiếp tục. → ý nghĩa "đồng đội".

### Cơ cấu tổ chức (Đối nội — nên vẽ thành sơ đồ tổ chức trực quan)
```
BAN GIÁM ĐỐC — Duy Nguyễn (Founder) · Đoàn Thị Minh Nguyệt (CEO)
   ├─ KINH DOANH — 32 người (KD1–KD6, Manager + Team Leader + Seller)
   ├─ SẢN XUẤT — 49 người (CPO: Trần Vũ Quốc Bảo) — SX1 Thêu · SX2 Giấy · SX3 Nhựa · Design EMB(21)/POD(8) · R&D(2)
   ├─ FULFILLMENT — 2 người (TL: Trần T. Bích Ngọc) — đơn nguồn ngoài (Printify, Gearment)
   └─ LOGISTICS US (*) — chưa có nhân sự, đang do đội SX kiêm gom hàng
Dùng chung: IT/Development (3) · Marketing & Thương hiệu (mới, chưa có người) · Kế toán (chưa có, BGĐ tạm xử lý) · HR (chưa có, BGĐ tạm xử lý)
```
- Lưu ý: 4 mảng CHƯA có nhân sự chuyên trách — Marketing, Kế toán, HR, Logistics US — đang do BGĐ/đội khác gánh tạm.

### Văn hoá & môi trường (Đối nội, chọn lọc)
- Ai hợp / chưa hợp với Ethan (đối ngoại nhưng súc tích, có thể tham khảo tinh thần khi viết bản đối nội súc tích hơn)
- Hoạt động gắn kết: team building thường niên (biển/Đà Lạt) + tiệc Christmas; sinh nhật cuối tháng có bánh + rút thăm tiền mặt 100k–100$; hỗ trợ ăn trưa tại công ty (không hỗ trợ mang về); chưa có thi đua giữa các tổ, chỉ có KPI riêng từng đội.
- Khen thưởng: thưởng tiền mặt trực tiếp 1–10 triệu khi làm tốt; thăng chức theo lộ trình Seller → Team Leader → Manager.
- Kênh lắng nghe: khảo sát cuối năm; BGĐ chủ động hẹn gặp riêng khi thấy nhân sự gặp vấn đề.
- Lý do nhân viên gắn bó lâu: môi trường lành mạnh, tự do sáng tạo; mọi cấp bậc đều được tôn trọng; cấp trên không được trịnh thượng; BGĐ chủ động đề bạt, ủng hộ học tập.

### Phát triển & đãi ngộ (Đối nội/Cả hai)
- Lộ trình thăng tiến: 2 mốc thăng tiến trong năm — cuối Q2 và cuối Q4 — dựa năng lực + kết quả thực tế; hoặc BGĐ quan sát và đề xuất trực tiếp.
- Điểm yếu đang tồn tại (đối nội, minh bạch nội bộ): CHƯA có quy trình onboarding chuẩn cho nhân sự mới — hiện đội trưởng/đồng cấp kèm tay, tốn nhiều thời gian/năng lượng của quản lý.
- Đánh giá hiệu suất: theo kết quả/doanh số + đóng góp tối ưu quy trình, định kỳ tháng hoặc quý.
- Phúc lợi: BHXH, thưởng lễ/Tết, lương tháng 13, hỗ trợ ăn trưa/đi lại, du lịch team building.

### Bộ nhận diện thương hiệu (dùng cho theme thiết kế — đã có sẵn, giữ nguyên không cần hỏi lại)
- Màu: Navy `#1A2745` · Brand Blue `#0052CC` · Golden `#F5A623` · Cyan `#00D2FF` · nền `#FFFFFF` / `#F4F7F9` · body text `#333333`
- Font: Serif sang trọng (Bodoni/Didot) cho slogan; Sans-serif (Montserrat/SVN-Gotham) cho heading & nút; Script điểm xuyết; font logo dạng Varsity/Slab
- Slogan: "Đồng lòng đồng sức, bứt phá gặt thành công"

**Gợi ý UI cho loại nội dung "Văn hoá/Blog nội bộ":** dạng magazine/blog card, có thể có ảnh minh hoạ (placeholder), tách biệt hẳn với khối "Thông báo" và khối "SOP/Rule" — đây là nội dung đọc dài, cảm xúc, không phải tác nghiệp.

---

## 3. Thông báo từ Ban lãnh đạo — Quy định chấm công / đề xuất / bảng lương

Áp dụng: **toàn công ty** (`visibility: { departments: 'all' }`). Có hiệu lực từ 15/08/2026. Nội dung dạng quy định, nên có cấu trúc rõ ràng (không phải văn bản thường), có thể dùng bảng hoặc list đánh số kèm mức phạt nổi bật.

**Chấm công và đề xuất:**
1. Quên chấm công: chỉ được duyệt nếu tạo đề xuất trong vòng **2 ngày** kể từ ngày quên.
2. Đề xuất tăng ca: phải tạo **ngay trong ngày làm việc đó**, qua ngày sau không được duyệt.
3. Mọi đề xuất bắt buộc **tag tên quản lý trực tiếp**; riêng đề xuất tăng ca thì tag quản lý trực tiếp vào mục **người duyệt**. Không tag → không được duyệt.
4. Đề xuất time off phải tạo **trước giờ bắt đầu nghỉ**. Tạo muộn → phạt **50k**.
5. Đi trễ: tạo đề xuất **ngay lúc bắt đầu lên ca**. Sai quy định → phạt **50k**.
6. Đi trễ mà cố tình tạo đề xuất "quên chấm công" để né phạt → phát hiện → **sa thải ngay lập tức**. (⚠️ mức nghiêm trọng nhất, nên nhấn mạnh thị giác riêng — màu cảnh báo đỏ)

**Bảng công và khiếu nại:**
- Bảng công hàng tháng gửi ngày 2. Có 1 ngày để khiếu nại.
- Đề xuất tạo từ ngày 4 của tháng cũ trở đi sẽ không được tính.

**Tiền phạt:** bỏ vào heo đất tại mỗi văn phòng, cuối năm dùng giúp trẻ em khó khăn. (điểm tích cực, có thể làm callout nhẹ nhàng khác tông với phần cảnh báo phạt)

**Lưu ý thêm:**
- Quy định áp dụng từ **15/08/2026**. Sau mốc này, đề xuất OT quá 24h sẽ không tạo được nữa.
- Lương thanh toán từ ngày 4 đến ngày 6 đầu tháng.

---

## 4. Vinh danh nhân sự tích cực

Visibility: `all`. Đây là 2 danh sách riêng biệt theo tháng — nên thiết kế dạng "wall of fame" (grid tên/avatar placeholder), không phải bảng thông báo text thường.

**Tháng 7/2026 (17 người):**
Hoàng Thanh Dũng · Đoàn Thị Thiên Lý · Đỗ Cường Quý · Tô Thị Kiều Trâm · Nguyễn Thị Thuỳ Vy · Nguyễn Kim Điền · Trần Thị Bích Ngọc · Đào Thị Thuý Vân · Đặng Thanh Uyên Nhi · Ngụy Bùi Phước Sang · Vũ Đức Huy · Vũ Thị Xuân Hồng · Trần Hồ Hồng Hân · Trần Trọng Sơn · Nguyễn Hữu Anh Tú · Đinh Thùy Diễm Hằng · Nguyễn Thị Hằng Nga

**Tháng 5/2026 (19 người):**
Đinh Thùy Diễm Hằng · Nguyễn Ngọc Ánh · Trần Thị Bích Ngọc · Nguyễn Thị Thuỳ Vy · Nguyễn Kiều Trinh · Tạ Minh Vũ · Đào Thị Thuý Vân · Mai Quỳnh Thu · Vũ Minh Hoàng · Trần Vũ Quỳnh Mai · Trần Trọng Sơn · Trần Thị Minh Thư · Mai Thuỵ Tú Uyên · Phạm Ngọc Lan · Vũ Đức Huy · Lê Thị Mỹ Huyền · Trần Nguyễn Hoàng Quân · Hoàng Thanh Dũng · Nguyễn Tú Linh

(Tên đã chuẩn hoá gõ dấu — người có thể muốn giữ đúng cách viết hoa/không dấu gốc khi nhập liệu thật.)

---

## 5. Thông báo điều chỉnh ca làm việc (do cúp điện)

Visibility đề xuất: `all` (ai cũng cần biết để chủ động), nhưng nội dung tác động chính đến khối Sản Xuất (`sx-theu`, `sx-in`). Ngày cụ thể "ngày mai" cần gán ngày thật khi nhập liệu (không hard-code "ngày mai" trong nội dung lưu trữ).

- Khu vực Võ Dõng 2: cúp điện 7h45–13h15.
- Bộ phận sản xuất (vận hành máy móc): dời ca sang ca chiều, bắt đầu 13h00.
- Bộ phận khác (Design, Support, QC, xử lý Emb…): làm việc bình thường, có thể làm tại Văn phòng 1 hoặc Văn phòng 4 (Thanh Sơn), còn nhiều chỗ.
- Lưu ý riêng: Văn phòng 1 ngày đó không dùng máy lạnh (chỉ quạt) — do dùng pin dự trữ, không đủ tải.
- Callout nhắc: chủ động sắp xếp công việc, không ảnh hưởng tiến độ.

**Gợi ý UI:** đây là notice khẩn/ngắn hạn — nên có kiểu hiển thị "banner/alert" nổi bật ở đầu trang khi còn hiệu lực, khác với thông báo dài hạn.

---

## 6. Tóm tắt yêu cầu thiết kế cho skill ui-ux-pro-max

Trang cần phân biệt rõ **4 loại nội dung** khác nhau về mục đích và cách đọc, không nên dùng chung 1 kiểu card cho tất cả:
1. **Rule/SOP theo khối** (mục 1) — tài liệu tác nghiệp, cần tra cứu, gắn quyền theo khối cụ thể (không phải `all`)
2. **Văn hoá/Blog nội bộ** (mục 2) — đọc dài, cảm xúc, gắn quyền `all` (mọi khối đều xem)
3. **Thông báo/Quy định điều hành** (mục 3, 5) — cần rõ ràng, có mức độ khẩn cấp/cảnh báo khác nhau, gắn quyền `all`
4. **Vinh danh nhân sự** (mục 4) — dạng ghi nhận, vui vẻ, tách biệt hẳn về tông màu với phần quy định/phạt

Yêu cầu phân quyền hiển thị: dựa theo `lib/roles.ts` hiện có — BGĐ (`bgd`, tier `full`) luôn thấy tất cả; các khối khác chỉ thấy nội dung gắn đúng khối của mình + nội dung `all`. Cần thiết kế UI thể hiện rõ "nội dung này dành cho khối nào" (badge/nhãn) để người dùng hiểu vì sao họ thấy hoặc không thấy một mục.
