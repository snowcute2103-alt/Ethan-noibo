const CARDS = [
  {
    id: 0, name: "The Fool", nameVi: "Kẻ Ngốc", suit: "major",
    numeral: "0", symbol: "☀",
    upright: "Bạn đang ở ngưỡng cửa điều gì đó mới mẻ. Cảm giác hồi hộp lẫn bất an là dấu hiệu bạn đang bước đúng hướng — đừng chờ đến khi sẵn sàng hoàn toàn.",
    reversed: "Bạn đang do dự vì sợ thất bại, hoặc bốc đồng mà không nghĩ hậu quả. Hãy tự hỏi: điều gì đang thực sự giữ bạn lại?",
    details: {
      love: "Xuôi: Một mối tình mới đang bắt đầu — hãy tận hưởng cảm giác này thay vì lo ngay về tương lai. Sự tươi tắn, hồn nhiên ở đây là điều quý, đừng vội phân tích hay đặt kỳ vọng. Ngược: Bạn đang sợ gắn bó, hoặc đang hành động bốc đồng mà không nghĩ đến cảm xúc người kia — cả hai đều sẽ gây tổn thương.",
      career: "Xuôi: Đây là lúc tốt để thử điều mới trong công việc — chuyển ngành, nhận dự án lạ, hoặc bắt đầu từ đầu. Chưa có kinh nghiệm không phải lý do để không thử. Ngược: Bạn đang đưa ra quyết định quá vội, chưa nghĩ đến hậu quả — hoặc cứ do dự mãi mà không bắt đầu. Cần suy nghĩ rõ hơn một chút.",
      health: "Xuôi: Cơ thể đang khá ổn, tinh thần hăng hái. Chỉ cần chú ý không cẩu thả dẫn đến tai nạn hoặc bỏ qua những dấu hiệu nhỏ của cơ thể. Ngược: Bạn đang sống không có nề nếp — ăn uống, ngủ nghỉ thất thường — và điều đó đang ảnh hưởng đến sức khỏe. Cần tạo thói quen cơ bản.",
      spirit: "Xuôi: Đây là lúc bạn sẵn sàng đón nhận điều mới mà không cần phải hiểu hết trước. Sự cởi mở đó tự nó đã là một điều tốt. Ngược: Bạn đang bị cuốn theo những ý tưởng chưa đủ chín, hoặc thiếu nền tảng để phân biệt điều thực sự có ích với điều chỉ nghe hay.",
      advice: "Bắt đầu đi — bạn không cần phải sẵn sàng hoàn toàn. Nhưng hãy để ý đường trước mặt, không phải chỉ nhìn lên trời."
    },
    colors: ["#e8c56a","#7fd4e8","#f5e6a0"],
    bg: "linear-gradient(160deg,#1a3a5c 0%,#0d2a47 100%)"
  },
  {
    id: 1, name: "The Magician", nameVi: "Nhà Ảo Thuật", suit: "major",
    numeral: "I", symbol: "∞",
    upright: "Bạn có đủ khả năng để làm điều bạn đang trì hoãn. Vấn đề không phải là thiếu năng lực — mà là chưa chịu bắt tay vào làm.",
    reversed: "Bạn đang phân tán năng lượng vào quá nhiều thứ cùng lúc, hoặc đang tự thuyết phục mình rằng mình chưa đủ giỏi. Cả hai đều là cách né tránh hành động.",
    details: {
      love: "Xuôi: Bạn đang tự tin và chủ động hơn bình thường — đây là lúc tốt để tiến lại gần người bạn thích, hoặc chủ động làm mới mối quan hệ đang trở nên nhạt. Ngược: Có thể bạn đang hứa hẹn hoặc tạo ra ấn tượng không trung thực trong tình cảm. Hãy kiểm tra lại ý định thật sự của mình.",
      career: "Xuôi: Bạn đã có đủ kỹ năng và điều kiện để bắt tay vào việc — điều còn thiếu chỉ là quyết định làm. Đừng chờ thêm. Ngược: Bạn đang ôm quá nhiều việc cùng lúc và không xong cái nào. Chọn một thứ, tập trung vào đó, rồi mới sang cái tiếp theo.",
      health: "Xuôi: Tinh thần đang tốt và cơ thể cũng đang hồi phục tốt — đây là lúc phù hợp để bắt đầu thói quen tập luyện hoặc thay đổi chế độ ăn uống mà bạn đã nghĩ đến lâu rồi. Ngược: Bạn đang thử quá nhiều phương pháp khác nhau mà không đủ kiên nhẫn để thấy kết quả. Chọn một thứ và làm đủ lâu.",
      spirit: "Xuôi: Bạn đang ở trạng thái sáng suốt — suy nghĩ rõ ràng, ý định cụ thể. Hãy dùng sự tập trung đó để tạo ra thứ gì đó có ý nghĩa với mình. Ngược: Bạn đang tự đánh giá mình cao hơn thực tế, hoặc đang dùng sức lực vào những thứ không thực sự quan trọng.",
      advice: "Bạn đã đủ. Không cần chuẩn bị thêm — cần bắt tay vào làm."
    },
    colors: ["#d4a943","#a020f0","#fff"],
    bg: "linear-gradient(160deg,#2d1060 0%,#1a0a2e 100%)"
  },
  {
    id: 2, name: "The High Priestess", nameVi: "Nữ Giáo Chủ", suit: "major",
    numeral: "II", symbol: "☽",
    upright: "Bạn đã biết câu trả lời rồi — chỉ là chưa dám thừa nhận. Hãy ngồi yên lắng nghe cảm giác sâu nhất bên trong trước khi hỏi ý kiến người khác.",
    reversed: "Bạn đang bỏ qua những tín hiệu nội tâm rõ ràng, hoặc đang quá ồn ào bên trong để nghe thấy bất cứ điều gì. Cần tạo khoảng lặng.",
    details: {
      love: "Xuôi: Có điều gì đó đang được giữ im trong mối quan hệ — cảm xúc thật chưa được nói ra. Hãy chú ý đến những gì bạn cảm nhận, không chỉ những gì được nói. Ngược: Cả hai đang giữ im cảm xúc đến mức xa cách nhau — mối quan hệ cần được nói chuyện thật, không phải tiếp tục né tránh.",
      career: "Xuôi: Chưa phải lúc hành động vội. Hãy quan sát thêm, thu thập thông tin, và chờ bức tranh rõ hơn trước khi đưa ra quyết định lớn. Ngược: Bạn đang bỏ qua những dấu hiệu cảnh báo rõ ràng — có thể vì không muốn thấy, hoặc vì quá vội.",
      health: "Xuôi: Cơ thể đang gửi tín hiệu — hãy nghe nó thay vì cố làm như không có gì. Giấc ngủ và nghỉ ngơi thực sự quan trọng lúc này. Ngược: Bạn đang bỏ qua những tín hiệu cơ thể, hoặc lo âu kéo dài đang ảnh hưởng đến giấc ngủ và sức khỏe tinh thần của bạn.",
      spirit: "Xuôi: Đây là lúc bạn nên dành thời gian yên tĩnh với bản thân — không phải để đọc sách hay tìm kiếm câu trả lời từ bên ngoài, mà để lắng nghe những gì đang có sẵn bên trong. Ngược: Bạn đang tránh né việc nhìn vào nội tâm — vì sợ những gì có thể thấy. Chính sự né tránh đó mới là vấn đề.",
      advice: "Câu trả lời bạn đang tìm đã có trong bạn rồi. Cần yên tĩnh để nghe thấy nó, không cần thêm lời khuyên từ ai."
    },
    colors: ["#7ec8e3","#e8d5b7","#c0a0d0"],
    bg: "linear-gradient(160deg,#0a1a4a 0%,#1e0050 100%)"
  },
  {
    id: 3, name: "The Empress", nameVi: "Nữ Hoàng", suit: "major",
    numeral: "III", symbol: "♀",
    upright: "Đây là lúc nuôi dưỡng bản thân và những gì bạn đang xây dựng. Cho đi và nhận lại cần cân bằng — bạn không thể chăm sóc người khác khi mình đang cạn kiệt.",
    reversed: "Bạn đang bỏ bê bản thân vì lo cho người khác, hoặc đang cảm thấy sáng tạo và cảm hứng bị chặn lại. Cần nạp lại — không phải làm thêm.",
    details: {
      love: "Xuôi: Mối quan hệ đang ấm áp và nuôi dưỡng nhau — cả hai đang thực sự chăm sóc lẫn nhau. Đây là giai đoạn tốt, hãy trân trọng nó. Ngược: Bạn đang quá lo cho người kia đến mức quên bản thân, hoặc phụ thuộc vào cảm xúc của đối phương quá nhiều. Cả hai cần có không gian riêng.",
      career: "Xuôi: Công việc sáng tạo đang có kết quả tốt — môi trường làm việc dễ chịu hơn và những ý tưởng bạn đưa ra được đón nhận. Ngược: Bạn đang cảm thấy bí ý tưởng hoặc mắc kẹt, thường do áp lực hoặc môi trường không cho phép bạn làm việc theo cách mình muốn.",
      health: "Xuôi: Sức khỏe đang ở trạng thái tốt. Hãy chú ý ăn uống đủ chất, ra ngoài, và cho bản thân được nghỉ ngơi đúng nghĩa — không phải nghỉ trong khi vẫn đang lo nghĩ. Ngược: Bạn đang bỏ bê bản thân vì dành quá nhiều sức cho người khác, hoặc cho công việc. Cơ thể đang cần bạn chú ý đến nó hơn.",
      spirit: "Xuôi: Bạn đang cần được nuôi dưỡng — không phải làm thêm. Đi ra thiên nhiên, nấu ăn ngon, làm điều gì đó chỉ vì thích. Ngược: Bạn đang cho đi nhiều hơn nhận lại, và điều đó đang làm bạn kiệt sức về mặt cảm xúc.",
      advice: "Chăm sóc bản thân không phải là ích kỷ — đó là điều kiện để bạn có thể chăm sóc người khác."
    },
    colors: ["#5a8a3a","#d4a943","#ff9999"],
    bg: "linear-gradient(160deg,#1a3a1a 0%,#2d5a1a 100%)"
  },
  {
    id: 4, name: "The Emperor", nameVi: "Hoàng Đế", suit: "major",
    numeral: "IV", symbol: "♂",
    upright: "Bạn cần tạo ra cấu trúc rõ ràng hơn trong cuộc sống hiện tại. Kỷ luật không phải là sự trừng phạt — đó là cách bạn bảo vệ năng lượng của mình.",
    reversed: "Bạn đang kiểm soát quá mức — bản thân hoặc người khác. Hỏi thật: bạn đang sợ điều gì nếu mọi thứ không theo kế hoạch?",
    details: {
      love: "Xuôi: Mối quan hệ đang ổn định và đáng tin cậy — có sự cam kết và trách nhiệm rõ ràng. Đây là điều tốt. Ngược: Bạn đang kiểm soát quá nhiều trong mối quan hệ — muốn mọi thứ theo ý mình, không chịu lắng nghe cảm xúc của người kia. Điều đó sẽ đẩy người ta ra xa.",
      career: "Xuôi: Đây là lúc tốt để tổ chức lại công việc, lập kế hoạch rõ ràng, và thể hiện khả năng lãnh đạo nếu có cơ hội. Những việc bạn xây dựng cẩn thận bây giờ sẽ có kết quả bền vững. Ngược: Bạn đang cứng nhắc — không chịu nghe ý kiến khác, chỉ làm theo cách của mình. Điều đó đang gây mâu thuẫn với người xung quanh.",
      health: "Xuôi: Sức khỏe tốt khi bạn có thói quen ổn định — ăn ngủ đúng giờ, tập luyện đều. Đây là lúc xây dựng thói quen lâu dài, không phải chạy theo những giải pháp nhanh. Ngược: Bạn đang quá cứng nhắc với bản thân — đặt kỳ vọng quá cao, tự phạt khi không đạt được, và điều đó đang gây căng thẳng hơn là giúp ích.",
      spirit: "Xuôi: Bạn cần một chút kỷ luật — dành thời gian cố định mỗi ngày để dừng lại, dù chỉ 5 phút, để kiểm tra bản thân đang cảm thấy gì. Ngược: Bạn đang áp đặt quan điểm của mình lên người khác, hoặc đang quá cứng nhắc với cách mình nghĩ về cuộc sống.",
      advice: "Tạo ra cấu trúc cho cuộc sống của bạn — không phải để kiểm soát mọi thứ, mà để có chỗ nghỉ ngơi trong đó."
    },
    colors: ["#cc3333","#d4a943","#8b0000"],
    bg: "linear-gradient(160deg,#3a0a0a 0%,#5a1a1a 100%)"
  },
  {
    id: 5, name: "The Hierophant", nameVi: "Giáo Hoàng", suit: "major",
    numeral: "V", symbol: "✝",
    upright: "Hôm nay có thể bạn cần học từ người khác thay vì tự mình mò mẫm. Đừng ngại hỏi — khiêm tốn tiếp thu nhanh hơn cái tôi tự cao.",
    reversed: "Bạn đang làm theo khuôn mẫu vì sợ bị phán xét, không phải vì thực sự tin vào nó. Hãy tự hỏi mình thực ra muốn gì.",
    details: {
      love: "Xuôi: Mối quan hệ đang có xu hướng tiến đến cam kết nghiêm túc hơn — hôn nhân, sống chung, hay được gia đình công nhận. Đây là điều tự nhiên và tốt nếu cả hai cùng muốn. Ngược: Bạn đang ở trong mối quan hệ vì áp lực từ gia đình hay xã hội, chứ không phải vì thực sự muốn. Hãy thành thật với bản thân.",
      career: "Xuôi: Đây là lúc học hỏi từ người có kinh nghiệm hơn — tìm một người hướng dẫn, tham gia cộng đồng nghề, hoặc đơn giản là không ngại hỏi. Làm theo quy trình đúng bây giờ sẽ có kết quả. Ngược: Bạn đang bị kẹt trong một hệ thống hoặc cách làm việc quá cứng nhắc, không cho phép bạn làm theo cách phù hợp hơn. Cần tìm cách thoát khỏi lối mòn đó.",
      health: "Xuôi: Đây là lúc tin vào các phương pháp đã được kiểm chứng — đi khám bác sĩ nếu cần, uống thuốc đúng liều, không tự chữa. Ngược: Bạn đang bỏ qua lời khuyên y tế, hoặc quá cứng nhắc với một phương pháp sức khỏe đến mức không chịu thay đổi dù nó không hiệu quả.",
      spirit: "Xuôi: Bạn có thể học được nhiều điều từ người khác — một cuốn sách, một người thầy, một cộng đồng. Không cần phải tự mình khám phá tất cả từ đầu. Ngược: Bạn đang làm theo những gì người khác nói mà không thực sự kiểm tra xem mình có tin vào điều đó không.",
      advice: "Học hỏi từ người đi trước là khôn ngoan. Nhưng hãy lọc ra những gì thực sự đúng với bạn, đừng nuốt nguyên xi."
    },
    colors: ["#ffffff","#d4a943","#880088"],
    bg: "linear-gradient(160deg,#2a0a4a 0%,#1a0a2e 100%)"
  },
  {
    id: 6, name: "The Lovers", nameVi: "Đôi Tình Nhân", suit: "major",
    numeral: "VI", symbol: "♡",
    upright: "Bạn đang đứng trước một lựa chọn quan trọng. Đừng chỉ hỏi cái nào đúng về lý trí — hỏi cái nào bạn sẽ không hối tiếc sau mười năm nữa.",
    reversed: "Bạn đang trong mối quan hệ (với người, với công việc, với chính mình) không thực sự phù hợp với giá trị cốt lõi của bạn. Sự mâu thuẫn đó sẽ ngày càng lớn thêm.",
    details: {
      love: "Xuôi: Một kết nối thật sự đang hình thành hoặc đang được củng cố — hai người đang thực sự hiểu và chọn nhau, không phải vì thói quen hay sợ cô đơn. Ngược: Bạn đang ở trong mối quan hệ không phù hợp với con người thật của mình — có thể bạn đã cảm nhận được điều đó từ lâu rồi.",
      career: "Xuôi: Bạn đang đứng trước một lựa chọn nghề nghiệp — hãy chọn thứ bạn thực sự muốn làm, không chỉ thứ an toàn hơn hay được kỳ vọng nhiều hơn. Ngược: Bạn đang làm công việc vì áp lực từ người khác, không phải vì bản thân muốn. Sự không hài lòng sẽ ngày càng lớn.",
      health: "Xuôi: Khi mối quan hệ và cảm xúc ổn định, sức khỏe cũng tốt hơn theo. Lúc này hãy chú ý đến sức khỏe cảm xúc — bạn đang thật sự cảm thấy thế nào trong cuộc sống hiện tại? Ngược: Mâu thuẫn trong mối quan hệ hoặc bên trong bản thân đang ảnh hưởng đến sức khỏe — căng thẳng tình cảm kéo dài thường biểu hiện ra ngoài qua cơ thể.",
      spirit: "Xuôi: Bạn đang ở trạng thái hài hòa với bản thân — giữa những gì bạn cảm thấy và những gì bạn làm. Đó là điều đáng trân trọng. Ngược: Có mâu thuẫn giữa những gì bạn nghĩ là đúng và những gì bạn thực sự cảm thấy — hai thứ đó cần được nhìn nhận thẳng thắn.",
      advice: "Chọn điều bạn thực sự muốn — không phải điều bạn nghĩ mình nên muốn."
    },
    colors: ["#ff6a6a","#ffb3b3","#d4a943"],
    bg: "linear-gradient(160deg,#3a0a1a 0%,#5a1a2a 100%)"
  },
  {
    id: 7, name: "The Chariot", nameVi: "Chiến Xa", suit: "major",
    numeral: "VII", symbol: "★",
    upright: "Bạn có đủ sức để vượt qua thử thách hiện tại — nhưng cần tập trung, không phân tâm. Xác định rõ đích đến trước khi phóng hết sức.",
    reversed: "Bạn đang tiêu hao năng lượng vào nhiều hướng cùng lúc mà không tiến về đâu, hoặc để cảm xúc bốc đồng dẫn dắt quyết định.",
    details: {
      love: "Xuôi: Bạn đang chủ động và quyết tâm trong tình cảm — sẵn sàng vượt qua khó khăn để giữ hoặc tìm kiếm điều mình muốn. Ngược: Bạn đang quá ép buộc — đặt quá nhiều áp lực lên đối phương hoặc lên bản thân trong chuyện tình cảm. Điều đó thường gây ra kết quả ngược lại.",
      career: "Xuôi: Bạn đang làm việc với quyết tâm cao và sắp thấy kết quả của những nỗ lực trước đó. Hãy tiếp tục tập trung. Ngược: Bạn đang lao đi rất nhanh nhưng không chắc hướng có còn đúng không — cần dừng lại kiểm tra mục tiêu trước khi tiếp tục.",
      health: "Xuôi: Đây là lúc tốt để theo đuổi các mục tiêu thể chất đòi hỏi kỷ luật — tập luyện đều, ăn uống có kế hoạch, phục hồi sau chấn thương. Ý chí của bạn đang đủ mạnh để duy trì. Ngược: Bạn đang ép cơ thể quá mức — đừng nhầm lẫn giữa kỷ luật và tự tra tấn. Cơ thể cần được nghỉ ngơi.",
      spirit: "Xuôi: Bạn đang có đủ sự tập trung để tiến về phía trước. Dùng sự tập trung đó để xử lý những điều bên trong bạn cần được giải quyết, không chỉ những mục tiêu bên ngoài. Ngược: Cái tôi đang lấn át — bạn đang quá cứng đầu để nhận ra khi nào mình đang sai.",
      advice: "Biết mình muốn đến đâu, rồi mới tăng tốc — chạy nhanh mà không có đích chỉ là mệt mỏi vô ích."
    },
    colors: ["#4a7fd4","#d4a943","#ffffff"],
    bg: "linear-gradient(160deg,#0a1a4a 0%,#1a2a6a 100%)"
  },
  {
    id: 8, name: "Strength", nameVi: "Sức Mạnh", suit: "major",
    numeral: "VIII", symbol: "∞",
    upright: "Bạn không cần phải mạnh mẽ theo kiểu không cảm thấy gì. Sức mạnh thực sự là nhìn thẳng vào nỗi sợ hãi và vẫn tiếp tục, dù run.",
    reversed: "Bạn đang nghi ngờ bản thân quá mức, hoặc đang để một phản ứng cảm xúc tức thời kiểm soát hành vi thay vì để lý trí dẫn đường.",
    details: {
      love: "Xuôi: Bạn đang yêu thương bằng sự kiên nhẫn và bình tĩnh — không phải bằng cách ép buộc. Điều đó tạo ra sự an toàn thực sự trong mối quan hệ. Ngược: Bạn đang chịu đựng quá nhiều, hoặc thiếu tự tin đến mức để người kia quyết định mọi thứ trong mối quan hệ. Bạn cũng có tiếng nói.",
      career: "Xuôi: Bạn không cần phải hung hăng hay gây áp lực để đạt được điều mình muốn — sự kiên nhẫn và nhất quán đang hiệu quả hơn. Ngược: Bạn đang kiệt sức và thiếu động lực. Đó không phải lười biếng — đó là dấu hiệu bạn cần nghỉ và nạp lại.",
      health: "Xuôi: Cơ thể đang phục hồi tốt, và tinh thần đủ vững để đi qua giai đoạn khó. Các hoạt động nhẹ nhàng như đi bộ, yoga, hoặc đơn giản là ngồi yên sẽ có ích hơn bạn nghĩ. Ngược: Bạn đang nghi ngờ khả năng hồi phục của cơ thể mình, hoặc đang để thói quen xấu kiểm soát vì thiếu sức để thay đổi. Hãy bắt đầu từ bước nhỏ nhất.",
      spirit: "Xuôi: Sức mạnh thật không phải là không cảm thấy gì — mà là cảm thấy hết mà vẫn không để nó điều khiển hành động của bạn. Bạn đang học được điều đó. Ngược: Bạn đang bị cảm xúc cuốn đi — phản ứng trước, suy nghĩ sau. Hãy tập dừng lại một nhịp trước khi hành động.",
      advice: "Sức mạnh không phải là không sợ. Sức mạnh là sợ mà vẫn làm."
    },
    colors: ["#ffaa00","#ff6600","#ffffff"],
    bg: "linear-gradient(160deg,#3a2000 0%,#5a3500 100%)"
  },
  {
    id: 9, name: "The Hermit", nameVi: "Người Ẩn Tu", suit: "major",
    numeral: "IX", symbol: "⚶",
    upright: "Hôm nay bạn cần thời gian một mình để xử lý những gì đang diễn ra bên trong. Câu trả lời bạn tìm kiếm không nằm ở bên ngoài.",
    reversed: "Bạn đang rút lui và cô lập theo cách không lành mạnh, hoặc ngược lại — đang chạy trốn khỏi sự tĩnh lặng vì sợ phải đối mặt với chính mình.",
    details: {
      love: "Xuôi: Đây là lúc bạn cần thời gian một mình để hiểu rõ mình thực sự muốn gì trong tình yêu — không phải những gì người khác kỳ vọng. Hãy làm điều đó trước khi tiếp tục tìm kiếm hoặc đưa ra quyết định lớn. Ngược: Bạn đang rút lui quá nhiều khỏi tình cảm — đến mức bỏ lỡ những kết nối thực sự có thể tốt cho bạn.",
      career: "Xuôi: Giai đoạn làm việc độc lập, nghiên cứu sâu, hoặc tìm hiểu kỹ trước khi hành động. Đây cũng là lúc tốt để chia sẻ những gì bạn biết với người khác — bạn có thể giúp được ai đó. Ngược: Bạn đang tự cô lập trong công việc — không hợp tác, không nhờ giúp đỡ. Điều đó đang làm chậm bạn lại.",
      health: "Xuôi: Cơ thể cần nghỉ ngơi sâu — không chỉ nghỉ việc, mà thực sự yên tĩnh. Ngủ đủ giấc, bớt màn hình, dành thời gian ở một mình mà không làm gì. Ngược: Bạn đang cô đơn quá mức và điều đó đang ảnh hưởng đến sức khỏe tinh thần của bạn — không phải lúc nào ở một mình cũng tốt.",
      spirit: "Xuôi: Đây là giai đoạn để đi vào chiều sâu bên trong — không cần làm nhiều, chỉ cần lắng nghe. Những gì bạn khám phá trong sự yên tĩnh này có giá trị hơn nhiều sách hay nhiều người chỉ bảo. Ngược: Bạn đang dùng sự cô lập như một cách trốn tránh, không phải để thực sự nhìn vào bên trong.",
      advice: "Có những câu trả lời chỉ đến khi bạn ở một mình và yên tĩnh. Hãy tạo ra khoảng không gian đó."
    },
    colors: ["#aaaaaa","#888844","#ffffcc"],
    bg: "linear-gradient(160deg,#1a1a1a 0%,#2a2a2a 100%)"
  },
  {
    id: 10, name: "Wheel of Fortune", nameVi: "Bánh Xe Số Phận", suit: "major",
    numeral: "X", symbol: "⊕",
    upright: "Mọi thứ đang thay đổi — dù bạn có muốn hay không. Thay vì kháng cự, hãy hỏi: trong sự thay đổi này, có cơ hội nào cho tôi không?",
    reversed: "Bạn đang lặp lại cùng một vòng tròn — cùng vấn đề, cùng phản ứng, cùng kết quả. Phá vỡ vòng lặp đòi hỏi bạn phải làm điều khác đi.",
    details: {
      love: "Xuôi: Có điều gì đó đang thay đổi trong tình cảm — cơ hội gặp người mới, hoặc mối quan hệ hiện tại bước sang giai đoạn mới. Hãy cởi mở với sự thay đổi đó. Ngược: Bạn đang lặp lại cùng một kiểu mối quan hệ — cùng vấn đề, cùng người, cùng kết quả. Để thoát ra, bạn cần làm điều khác đi.",
      career: "Xuôi: Có cơ hội đang xuất hiện — đừng bỏ lỡ vì do dự. Giai đoạn này thuận lợi hơn so với trước, hãy tận dụng. Ngược: Đây là giai đoạn công việc không thuận. Thay vì cố ép, hãy giữ vững những gì đang có và chờ tình hình cải thiện.",
      health: "Xuôi: Nếu bạn đang hồi phục sau một giai đoạn sức khỏe kém, cơ thể đang bắt đầu tốt hơn. Tiếp tục chăm sóc đúng cách. Ngược: Sức khỏe đang thất thường — đừng bỏ qua những thay đổi nhỏ của cơ thể, và đừng trì hoãn việc đi khám nếu cần.",
      spirit: "Xuôi: Mọi thứ đều có lúc lên lúc xuống — thay vì chống lại điều đó, hãy học cách thích nghi. Hiểu được điều này sẽ giúp bạn bình tĩnh hơn nhiều. Ngược: Bạn đang cảm thấy bị cuộc sống trêu đùa và kháng cự thay đổi. Sự kháng cự đó đang tiêu hao nhiều sức lực hơn là giúp ích.",
      advice: "Không có gì là mãi mãi — dù tốt hay xấu. Thay vì sợ thay đổi, hãy hỏi: mình có thể làm gì với tình huống này?"
    },
    colors: ["#d4a943","#aa3388","#3388cc"],
    bg: "linear-gradient(160deg,#1a0a30 0%,#2a1a50 100%)"
  },
  {
    id: 11, name: "Justice", nameVi: "Công Lý", suit: "major",
    numeral: "XI", symbol: "⚖",
    upright: "Hôm nay đòi hỏi sự trung thực — với bản thân và với người khác. Kết quả bạn đang thấy là phản ánh của những gì bạn đã làm trước đó.",
    reversed: "Bạn đang né tránh trách nhiệm về một điều gì đó, hoặc đang ở trong tình huống bất công thực sự mà chưa dám lên tiếng.",
    details: {
      love: "Xuôi: Mối quan hệ đang cân bằng và công bằng — cả hai cùng đóng góp và được tôn trọng. Đây là nền tảng lành mạnh. Ngược: Có sự bất bình đẳng rõ ràng — một người đang cho đi quá nhiều mà không nhận lại tương xứng. Cần nói thẳng về điều này.",
      career: "Xuôi: Những nỗ lực bạn bỏ ra đang được ghi nhận xứng đáng. Nếu đang có vụ việc pháp lý hay hợp đồng, tình hình nghiêng về phía có lợi cho bạn. Ngược: Có sự bất công đang xảy ra trong công việc — bạn cần lên tiếng, không nên im lặng chịu đựng.",
      health: "Xuôi: Những thói quen tốt bạn đang duy trì sẽ cho ra kết quả — không phải ngay, nhưng chắc chắn. Đây là lúc tốt để đánh giá lại lối sống và điều chỉnh những gì chưa phù hợp. Ngược: Cơ thể đang phản ánh hậu quả của những thói quen không lành mạnh. Không cần tự trách, chỉ cần trung thực và bắt đầu thay đổi.",
      spirit: "Xuôi: Những gì bạn gieo thì bạn gặt — điều đó đang hiển hiện rõ trong cuộc sống của bạn lúc này. Hãy nhìn lại hành động của mình một cách trung thực. Ngược: Bạn đang đổ lỗi cho hoàn cảnh thay vì nhìn nhận phần trách nhiệm của mình trong tình huống hiện tại.",
      advice: "Trung thực với bản thân là bước đầu tiên. Bạn không thể giải quyết điều mà bạn không chịu nhìn nhận thẳng thắn."
    },
    colors: ["#d4a943","#cc3333","#ffffff"],
    bg: "linear-gradient(160deg,#1a1a3a 0%,#2a2a5a 100%)"
  },
  {
    id: 12, name: "The Hanged Man", nameVi: "Người Treo Ngược", suit: "major",
    numeral: "XII", symbol: "⊗",
    upright: "Đây là lúc tạm dừng và nhìn lại theo cách hoàn toàn khác. Bạn không cần phải giải quyết ngay — đôi khi không làm gì chính là lựa chọn đúng đắn nhất.",
    reversed: "Bạn đang bị mắc kẹt — không tiến, không lùi — vì không chịu buông tay điều gì đó đã không còn phù hợp nữa.",
    details: {
      love: "Xuôi: Đây không phải lúc hành động — đây là lúc nhìn lại mối quan hệ từ góc độ khác. Hãy dành thời gian thực sự hiểu cảm xúc của mình trước khi đưa ra quyết định. Ngược: Bạn đang mắc kẹt trong mối quan hệ không đi đến đâu, nhưng không chịu buông tay vì sợ mất, sợ cô đơn. Sự mắc kẹt đó đang tốn nhiều sức hơn bạn nghĩ.",
      career: "Xuôi: Dừng lại và nhìn lại vấn đề từ góc độ khác — đôi khi chính sự ngưng nghỉ đó mới dẫn đến ý tưởng tốt hơn. Đây không phải trì hoãn, đây là chiến lược. Ngược: Bạn đang trì hoãn không có lý do — không phải đang suy nghĩ thêm, mà đang né tránh việc phải quyết định.",
      health: "Xuôi: Cơ thể cần nghỉ ngơi thực sự — không phải kiểu nghỉ trong khi đầu óc vẫn đang chạy. Thử cách tiếp cận sức khỏe khác nếu cách hiện tại không hiệu quả. Ngược: Bạn đang trì hoãn việc chăm sóc sức khỏe — biết mình cần thay đổi nhưng cứ lần lữa. Sự trì hoãn đó có cái giá của nó.",
      spirit: "Xuôi: Có những thứ không thể hiểu được khi bạn đang cố gắng — chỉ khi buông ra, mọi thứ mới tự trở nên rõ ràng hơn. Thử để một vấn đề đang loay hoay được nghỉ ngơi. Ngược: Bạn đang bám chặt vào một góc nhìn cũ, không chịu xem xét khả năng mình đang sai hoặc thiếu thông tin.",
      advice: "Đôi khi không làm gì mới là hành động đúng đắn nhất — hãy cho tình huống không gian để tự phát triển."
    },
    colors: ["#88ccff","#d4a943","#ff9900"],
    bg: "linear-gradient(160deg,#0a2a3a 0%,#1a3a5a 100%)"
  },
  {
    id: 13, name: "Death", nameVi: "Tử Thần", suit: "major",
    numeral: "XIII", symbol: "☠",
    upright: "Điều gì đó cần phải kết thúc để nhường chỗ cho phiên bản mới của bạn. Lá bài này không phải điềm xấu — đó là lời mời chào thay đổi.",
    reversed: "Bạn đang bám vào thứ đã hết hạn — mối quan hệ, công việc, bản sắc cũ — vì sợ con người phía bên kia sự thay đổi.",
    details: {
      love: "Xuôi: Có điều gì đó trong tình cảm đang kết thúc — có thể là một mối quan hệ, hoặc một giai đoạn trong mối quan hệ hiện tại. Sự kết thúc này cần thiết để có điều tốt hơn. Ngược: Bạn đang kéo dài một mối quan hệ đã hết vì sợ cô đơn hoặc sợ thay đổi — nhưng điều đó đang làm đau cả hai.",
      career: "Xuôi: Có gì đó trong sự nghiệp cần phải kết thúc — công việc, vai trò, hoặc cách làm việc cũ. Dù khó, sự thay đổi này sẽ mở ra con đường phù hợp hơn. Ngược: Bạn đang bám vào một công việc hoặc vị trí không còn phù hợp chỉ vì sợ điều chưa biết phía sau.",
      health: "Xuôi: Đây là lúc bỏ một thói quen xấu mà bạn đã biết từ lâu mình cần bỏ — thuốc lá, rượu, thức khuya triền miên, ăn uống vô độ. Thay đổi thực sự bắt đầu từ đây. Ngược: Bạn biết mình cần thay đổi nhưng đang kháng cự — vì sợ quá trình thay đổi sẽ khó chịu, hoặc vì không muốn từ bỏ thứ quen thuộc.",
      spirit: "Xuôi: Phiên bản cũ của bạn đang được thay thế bởi một phiên bản mới — quá trình đó có thể đau, nhưng đó là dấu hiệu bạn đang thực sự thay đổi. Ngược: Bạn đang sợ mất đi con người mình đã quen — dù con người đó không còn phù hợp với bạn nữa.",
      advice: "Lá Tử Thần không báo điều xấu — nó báo sự kết thúc cần thiết. Đừng bám vào thứ đã hết hạn."
    },
    colors: ["#444444","#cc3333","#ffffff"],
    bg: "linear-gradient(160deg,#0a0a0a 0%,#1a0a0a 100%)"
  },
  {
    id: 14, name: "Temperance", nameVi: "Điều Độ", suit: "major",
    numeral: "XIV", symbol: "△",
    upright: "Bạn đang cần sự cân bằng hơn là tốc độ. Tiến chậm mà vững còn hơn lao nhanh rồi kiệt sức. Hãy kiên nhẫn với quá trình của mình.",
    reversed: "Bạn đang ở thái cực — hoặc làm quá nhiều hoặc không làm gì. Cả hai đều là cách tránh né trạng thái bình thường lành mạnh.",
    details: {
      love: "Xuôi: Mối quan hệ đang khá cân bằng — cả hai đang cố gắng hiểu nhau và có sự kiên nhẫn với nhau. Đây là nền tảng tốt để vượt qua giai đoạn khó. Ngược: Một bên đang cho quá nhiều hoặc nhận quá nhiều — sự mất cân bằng này cần được nói ra và điều chỉnh trước khi gây ra mệt mỏi.",
      career: "Xuôi: Công việc đang tiến chậm nhưng đúng hướng. Đừng nóng vội — kết quả bền vững cần thời gian. Ngược: Bạn đang ở thái cực — hoặc làm việc đến kiệt sức hoặc không làm gì cả. Cần tìm điểm cân bằng ở giữa.",
      health: "Xuôi: Cơ thể đang phục hồi tốt khi bạn sống điều độ — ăn đủ bữa, ngủ đủ giấc, vận động vừa phải. Không cần làm gì cực đoan. Ngược: Lối sống đang thiếu điều độ — ngủ ít, ăn uống thất thường, hoặc tập quá nhiều. Cơ thể cần sự ổn định, không phải sự hoàn hảo.",
      spirit: "Xuôi: Bạn đang học cách kiên nhẫn với bản thân và với quá trình — không phải mọi thứ đều cần phải xong ngay. Sự bền bỉ nhẹ nhàng đó có giá trị hơn nhiều cố gắng bùng nổ ngắn hạn. Ngược: Bạn đang ở thái cực trong cách tiếp cận cuộc sống — không có gì ở giữa. Cần học cách ở trạng thái bình thường.",
      advice: "Không cực đoan về phía nào — không làm quá, không bỏ hoàn toàn. Điểm giữa chính là nơi mọi thứ bền vững nhất."
    },
    colors: ["#44aaff","#ff8844","#ffffff"],
    bg: "linear-gradient(160deg,#0a2a4a 0%,#1a3a6a 100%)"
  },
  {
    id: 15, name: "The Devil", nameVi: "Ác Quỷ", suit: "major",
    numeral: "XV", symbol: "⛧",
    upright: "Bạn đang bị giữ lại bởi một thói quen, nỗi sợ, hoặc mối quan hệ mà bạn biết không tốt cho mình. Nhận ra xiềng xích là bước đầu tiên để tháo nó ra.",
    reversed: "Bạn đang dần thoát khỏi điều đã kiểm soát bạn. Đây là giai đoạn khó và có thể đau — nhưng bạn đang đi đúng hướng.",
    details: {
      love: "Xuôi: Mối quan hệ đang có yếu tố phụ thuộc hoặc kiểm soát — có thể là sự phụ thuộc cảm xúc, hoặc một bên kiểm soát bên kia theo cách tinh vi. Hãy nhìn thẳng vào điều đó. Ngược: Bạn đang dần nhận ra và thoát khỏi mối quan hệ hoặc kiểu tương tác không lành mạnh. Đây là điều dũng cảm.",
      career: "Xuôi: Bạn đang cảm thấy bị kẹt trong công việc — vì tiền, vì sợ, vì không thấy lối ra. Bước đầu tiên là thừa nhận điều đó với bản thân. Ngược: Bạn đang thoát ra khỏi môi trường làm việc hoặc thói quen không lành mạnh. Dù khó, hãy tiếp tục.",
      health: "Xuôi: Có một thói quen đang kiểm soát bạn hơn là bạn kiểm soát nó — điện thoại, mạng xã hội, đồ ăn, rượu, hay thứ gì khác. Nhận ra điều đó là bước quan trọng nhất. Ngược: Bạn đang trong quá trình thoát khỏi thói quen xấu — khó, nhưng bạn đang đi đúng hướng.",
      spirit: "Xuôi: Có điều gì đó đang giữ bạn lại — một nỗi sợ, một niềm tin cũ, một thói quen. Thay vì tránh né, hãy nhìn thẳng vào nó. Chỉ khi nhìn thẳng, bạn mới thấy nó không đáng sợ như tưởng. Ngược: Bạn đang bắt đầu nhận ra những gì đã kiểm soát mình — và sẵn sàng buông ra.",
      advice: "Bạn bị giữ lại bởi thứ gì đó — nhưng cái xiềng đó lỏng hơn bạn nghĩ. Nhìn kỹ vào nó."
    },
    colors: ["#cc3333","#000000","#880000"],
    bg: "linear-gradient(160deg,#1a0000 0%,#2a0000 100%)"
  },
  {
    id: 16, name: "The Tower", nameVi: "Tòa Tháp", suit: "major",
    numeral: "XVI", symbol: "⚡",
    upright: "Điều gì đó trong cuộc sống của bạn đang sụp đổ — và đó có thể là điều cần thiết. Chỉ những thứ được xây trên nền giả mới đổ; thứ thật sẽ còn lại.",
    reversed: "Bạn đang cố giữ một thứ sắp vỡ bằng cách phủ nhận hoặc trốn tránh. Nhìn thẳng vào sẽ đỡ đau hơn là chờ nó nổ tung.",
    details: {
      love: "Xuôi: Có thể có điều bất ngờ xảy ra trong tình cảm — sự thật được phơi bày, hoặc mối quan hệ bùng nổ theo cách bạn không lường trước. Dù đau, điều này thường cần thiết để xây lại trên nền thật. Ngược: Bạn đang trì hoãn một cuộc trò chuyện hoặc kết thúc cần thiết — càng trì hoãn càng sẽ đau hơn khi nổ ra.",
      career: "Xuôi: Có sự đổ vỡ bất ngờ trong công việc — mất dự án, mất vị trí, hoặc kế hoạch sụp đổ. Dù khó chịu, đây có thể là cơ hội để xây lại theo cách thực sự phù hợp hơn. Ngược: Bạn đang biết có vấn đề nhưng đang cố không nhìn vào — điều đó không làm vấn đề biến mất.",
      health: "Xuôi: Có thể xảy ra thay đổi đột ngột liên quan đến sức khỏe — đừng chủ quan với những triệu chứng bất thường. Đây cũng có thể là lúc bạn nhận ra mình cần thay đổi lối sống hoàn toàn. Ngược: Lo lắng về sức khỏe đang gây căng thẳng không cần thiết, hoặc bạn vừa thoát khỏi tình huống nguy hiểm và đang hồi phục.",
      spirit: "Xuôi: Đôi khi những thứ cũ cần sụp đổ để nhường chỗ cho điều thật hơn, phù hợp hơn. Sự đổ vỡ không phải là kết thúc — đó là sự bắt đầu lại trên nền thật. Ngược: Bạn đang cố giữ những thứ đã không còn phù hợp vì sợ sự thay đổi — nhưng sợ hãi không giúp chúng vững hơn.",
      advice: "Chỉ những thứ được xây trên nền giả mới sụp đổ. Thứ gì thật, thứ đó sẽ còn lại."
    },
    colors: ["#ffcc00","#cc3333","#888888"],
    bg: "linear-gradient(160deg,#1a1a0a 0%,#2a2a0a 100%)"
  },
  {
    id: 17, name: "The Star", nameVi: "Ngôi Sao", suit: "major",
    numeral: "XVII", symbol: "✦",
    upright: "Sau giai đoạn khó khăn, bạn đang dần hồi phục. Đừng vội — cho phép bản thân được chữa lành theo tốc độ của chính mình.",
    reversed: "Bạn đang cảm thấy mệt mỏi và mất hy vọng. Điều đó không có nghĩa là không có lối ra — chỉ là bạn chưa thấy nó lúc này.",
    details: {
      love: "Xuôi: Sau những tổn thương tình cảm cũ, bạn đang dần lành lại và mở lòng trở lại theo cách nhẹ nhàng hơn. Tình yêu không vội — cho mình thời gian. Ngược: Bạn đang mất niềm tin vào tình yêu sau những lần bị tổn thương. Điều đó dễ hiểu — nhưng hãy cho bản thân đủ thời gian hồi phục trước khi đóng cửa hoàn toàn.",
      career: "Xuôi: Sau giai đoạn mệt mỏi hoặc thất bại, cảm hứng đang dần trở lại. Hướng đi mới đang bắt đầu lộ ra — hãy tin vào nó. Ngược: Bạn đang cảm thấy chán nản và không biết mình muốn làm gì. Đây không phải lúc bỏ cuộc — đây là lúc nghỉ ngơi và để ý xem điều gì vẫn còn khơi dậy cảm hứng trong bạn.",
      health: "Xuôi: Cơ thể đang hồi phục tốt sau giai đoạn bệnh hoặc căng thẳng. Sự lạc quan và hy vọng thực sự có ảnh hưởng đến tốc độ hồi phục — hãy nuôi dưỡng cả hai. Ngược: Bạn đang nghi ngờ khả năng hồi phục của bản thân — cảm giác không bao giờ khỏe lại hoặc không có gì thay đổi. Hãy tìm người hỗ trợ bạn trong giai đoạn này.",
      spirit: "Xuôi: Sau giai đoạn khó khăn, bạn đang cảm thấy nhẹ hơn và hy vọng hơn. Hãy để cảm giác đó ở lại — đừng vội kéo mình trở về lo âu. Ngược: Bạn đang cảm thấy cô đơn và không được hỗ trợ. Hãy tiếp tục những thứ giúp bạn bình tâm, dù chưa thấy kết quả ngay.",
      advice: "Sẽ có lúc tốt hơn. Không phải niềm tin mù quáng — mà là thực tế: mọi giai đoạn khó đều qua."
    },
    colors: ["#88ccff","#ffffff","#d4a943"],
    bg: "linear-gradient(160deg,#0a0a2a 0%,#0a1a4a 100%)"
  },
  {
    id: 18, name: "The Moon", nameVi: "Mặt Trăng", suit: "major",
    numeral: "XVIII", symbol: "☽",
    upright: "Tình huống hiện tại mơ hồ hơn bạn nghĩ — đừng đưa ra quyết định lớn vội. Hãy chú ý những gì trực giác nói, kể cả khi nó không hợp lý.",
    reversed: "Sự mơ hồ đang dần được làm rõ. Sự thật bắt đầu lộ ra — dù có thể không phải điều bạn muốn nghe.",
    details: {
      love: "Xuôi: Có điều gì đó không rõ ràng trong tình cảm — bạn chưa thấy đủ sự thật để đưa ra quyết định tốt. Hãy chờ, quan sát, và tin vào những gì bạn cảm nhận chứ không chỉ những gì thấy bên ngoài. Ngược: Ảo tưởng về mối quan hệ hoặc về người kia đang tan biến — sự thật đang lộ ra. Dù khó chịu, đây là điều cần thiết.",
      career: "Xuôi: Tình huống công việc đang mơ hồ — thiếu thông tin, nhiều ẩn số. Chưa phải lúc đưa ra quyết định lớn. Hãy chờ bức tranh rõ hơn. Ngược: Sự nhầm lẫn và mơ hồ trong công việc đang dần được làm rõ — những thứ bị che giấu bắt đầu lộ ra.",
      health: "Xuôi: Bạn có thể đang trải qua lo âu, mất ngủ, hoặc những nỗi sợ không rõ nguyên nhân. Đây là lúc cần chú ý đến sức khỏe tinh thần, không chỉ thể chất. Ngược: Những lo lắng về sức khỏe đang dần được làm sáng tỏ — kết quả xét nghiệm hoặc chẩn đoán sẽ cho thấy tình hình rõ hơn.",
      spirit: "Xuôi: Trực giác của bạn đang nói điều gì đó — đáng để lắng nghe, kể cả khi nó không hợp lý về mặt logic. Nếu bạn hay mơ gần đây, hãy chú ý đến nội dung. Ngược: Sự mơ hồ đang dần được làm rõ — những điều bạn chưa hiểu về bản thân hay hoàn cảnh đang bắt đầu có nghĩa hơn.",
      advice: "Chưa phải lúc quyết định — hãy quan sát thêm. Mọi thứ sẽ rõ ràng hơn khi đúng thời điểm."
    },
    colors: ["#aaaacc","#4466aa","#ccccff"],
    bg: "linear-gradient(160deg,#0a0a1a 0%,#0a0a2a 100%)"
  },
  {
    id: 19, name: "The Sun", nameVi: "Mặt Trời", suit: "major",
    numeral: "XIX", symbol: "☀",
    upright: "Hôm nay có lý do để cảm thấy tốt — hãy để mình trải nghiệm điều đó thật sự, đừng bị ám ảnh bởi những gì có thể sai tiếp theo.",
    reversed: "Bạn đang ép mình tỏ ra ổn trong khi thực ra không ổn lắm. Sự lạc quan giả không chữa được gì — cho phép bản thân cảm nhận thật.",
    details: {
      love: "Xuôi: Mối quan hệ đang vui vẻ và ấm áp — đây là giai đoạn tốt, hãy tận hưởng thay vì lo nghĩ về những gì có thể sai. Ngược: Bên ngoài trông vui vẻ nhưng bên trong đang có vấn đề chưa được nói ra, hoặc bạn đang thiếu tự tin đến mức khó đón nhận tình cảm thật sự từ người khác.",
      career: "Xuôi: Công việc đang thuận lợi — kết quả được ghi nhận, tinh thần làm việc cao. Đây là giai đoạn tốt để tiến lên. Ngược: Bạn đang tự hài lòng với thành tích hiện tại đến mức bỏ lỡ cơ hội phát triển thêm, hoặc đang che giấu sự không hài lòng bên dưới vẻ ngoài tích cực.",
      health: "Xuôi: Sức khỏe tốt — cơ thể đang khỏe mạnh và tinh thần phấn chấn. Đây là lúc ra ngoài, vận động, tận hưởng ánh nắng và những hoạt động bạn thích. Ngược: Bạn đang ép mình tỏ ra ổn và tích cực trong khi thực ra không tốt lắm. Hãy thành thật với bản thân về những gì bạn đang cảm thấy.",
      spirit: "Xuôi: Bạn đang ở trạng thái vui vẻ và nhẹ nhàng thực sự — không phải cố gắng, mà tự nhiên. Hãy để trạng thái đó lan ra thay vì cố kiềm chế. Ngược: Sự vui vẻ bề mặt đang che đi những điều bạn chưa xử lý bên trong — đừng để nó trở thành cách tránh né.",
      advice: "Hãy để mình thực sự vui — không phải diễn. Niềm vui thật không cần nhiều nỗ lực để có."
    },
    colors: ["#ffdd00","#ff8800","#ffffff"],
    bg: "linear-gradient(160deg,#2a1a00 0%,#4a3000 100%)"
  },
  {
    id: 20, name: "Judgement", nameVi: "Phán Xét", suit: "major",
    numeral: "XX", symbol: "☆",
    upright: "Có gì đó đang kêu gọi bạn thay đổi — công việc, mối quan hệ, hoặc cách bạn nhìn nhận bản thân. Đây không phải lúc trì hoãn thêm nữa.",
    reversed: "Bạn đang bỏ qua một lời gọi rõ ràng vì sợ bị phán xét, hoặc chưa tha thứ được cho bản thân về điều gì đó trong quá khứ.",
    details: {
      love: "Xuôi: Đây là lúc nhìn lại mối quan hệ một cách thành thật — không bào chữa, không đổ lỗi. Có thể bạn cần tha thứ cho ai đó, hoặc tha thứ cho bản thân. Ngược: Bạn đang mang theo oán giận cũ vào mối quan hệ hiện tại, hoặc chưa thực sự buông bỏ chuyện đã qua.",
      career: "Xuôi: Đây là lúc nhìn thẳng vào con đường sự nghiệp và tự hỏi: mình có đang đi đúng hướng không? Nếu có gì đó đang kêu gọi bạn thay đổi, đừng tiếp tục trì hoãn. Ngược: Bạn đang bỏ qua cơ hội thay đổi vì sợ người xung quanh phán xét — nhưng cuộc sống của bạn không phải để người khác chấp thuận.",
      health: "Xuôi: Có điều gì đó liên quan đến sức khỏe cần được nhìn nhận thẳng thắn — có thể là thói quen cần thay đổi, hoặc triệu chứng cần được kiểm tra. Đừng trì hoãn thêm nữa. Ngược: Bạn đang phủ nhận hoặc tránh né một vấn đề sức khỏe — vì sợ kết quả, hoặc vì không muốn thay đổi lối sống quen thuộc.",
      spirit: "Xuôi: Bạn đang nhận ra điều gì đó quan trọng về bản thân hoặc cuộc sống của mình — một bước ngoặt thật sự. Đây là lúc lắng nghe và hành động theo, không phải tiếp tục trì hoãn. Ngược: Bạn đang bỏ qua điều mà bên trong bạn biết rõ là đúng — vì sợ thay đổi, hoặc sợ bị nhìn khác đi.",
      advice: "Tha thứ cho bản thân không phải là bỏ qua lỗi lầm — đó là chọn tiếp tục thay vì mãi tự trách."
    },
    colors: ["#ffffff","#d4a943","#4488cc"],
    bg: "linear-gradient(160deg,#0a1a2a 0%,#1a2a4a 100%)"
  },
  {
    id: 21, name: "The World", nameVi: "Thế Giới", suit: "major",
    numeral: "XXI", symbol: "◎",
    upright: "Bạn đã đi xa hơn bạn nhận ra. Hôm nay xứng đáng được dừng lại để nhìn nhận những gì đã đạt được — không phải để kiêu ngạo, mà để thực sự thấy giá trị của hành trình.",
    reversed: "Có điều gì đó bạn chưa thực sự hoàn thành — có thể là một cuộc trò chuyện, một quyết định, hay một bước cuối cùng bạn cứ trì hoãn.",
    details: {
      love: "Xuôi: Mối quan hệ đang ở giai đoạn viên mãn và trọn vẹn — cả hai thực sự hiểu và chấp nhận nhau. Hoặc bạn đã sẵn sàng cho tình yêu thật sau một quá trình dài trưởng thành. Ngược: Mối quan hệ gần đến một cột mốc nhưng còn thiếu điều gì đó — một cuộc trò chuyện chưa xảy ra, một quyết định chưa được đưa ra.",
      career: "Xuôi: Một dự án hoặc giai đoạn trong sự nghiệp đang hoàn thành tốt đẹp — kết quả xứng đáng với công sức bỏ ra. Hãy cho phép bản thân cảm thấy vui mừng về điều đó. Ngược: Còn có gì đó chưa được hoàn thành — một bước cuối cùng bạn cứ trì hoãn, hoặc một công việc còn đang dang dở.",
      health: "Xuôi: Sức khỏe đang ổn định và cân bằng — cả thể chất lẫn tinh thần. Đây là giai đoạn tốt, hãy duy trì những thói quen đang hiệu quả. Ngược: Quá trình hồi phục chưa xong — còn thiếu điều gì đó để đạt đến trạng thái thực sự khỏe mạnh. Hãy kiên nhẫn và tiếp tục.",
      spirit: "Xuôi: Bạn đang ở cuối một chặng đường dài — và cảm thấy thực sự hoàn tất, không còn điều gì cần giải quyết ở đây nữa. Đây là lúc nghỉ ngơi trước khi bắt đầu điều tiếp theo. Ngược: Vẫn có điều gì đó chưa được giải quyết trong bạn — một bài học chưa được hiểu, hoặc một thứ bạn chưa sẵn sàng buông.",
      advice: "Hãy dừng lại và nhận ra bạn đã đi xa bao nhiêu — rồi mới bắt đầu chặng tiếp theo."
    },
    colors: ["#44cc88","#d4a943","#8844cc"],
    bg: "linear-gradient(160deg,#0a2a1a 0%,#1a4a3a 100%)"
  },

  // ── WANDS (Lửa · Đam mê · Hành động · Sáng tạo) ──────────────────────────
  {
    id: 22, name: "Ace of Wands", nameVi: "Át Gậy", suit: "wands",
    numeral: "A", symbol: "🔥",
    upright: "Có điều gì đó mới đang thôi thúc bạn — một ý tưởng, một dự án, một hướng đi. Đừng đợi hoàn hảo, hãy bắt đầu ngay khi cảm hứng còn đó.",
    reversed: "Bạn đang thiếu động lực hoặc mọi thứ cứ bị trì hoãn. Hỏi thật: bạn có thực sự muốn điều này, hay chỉ nghĩ mình nên muốn?",
    details: {
      love: "Xuôi: Tia lửa mới bùng lên trong tình cảm — cảm giác thu hút mạnh mẽ và đam mê vừa nhen nhóm, rất hứa hẹn. Ngược: Thiếu ngọn lửa và hứng khởi, mối quan hệ đang trở nên nhàm chán vì thiếu sự chủ động.",
      career: "Xuôi: Ý tưởng sáng tạo mới bùng phát và đây là thời điểm vàng để khởi động dự án đầy đam mê. Ngược: Dự án bị trì hoãn hoặc thiếu động lực ban đầu để bắt đầu.",
      health: "Xuôi: Ace of Wands mang năng lượng khởi đầu dồi dào — đây là lúc lý tưởng để bắt đầu thói quen tập luyện mới hoặc chế độ sức khỏe mà bạn đã trì hoãn. Cơ thể đang sẵn sàng và tinh thần đầy hứng khởi. Ngược: Năng lượng bị chặn hoặc thiếu động lực để duy trì thói quen sức khỏe — mọi kế hoạch tập luyện bắt đầu tốt nhưng nhanh chóng nguội lạnh.",
      spirit: "Xuôi: Bạn đang cảm thấy hứng khởi với điều gì đó — hãy theo đuổi cảm giác đó dù chưa biết nó sẽ dẫn đến đâu. Ngược: Bạn đang cảm thấy trống rỗng và thiếu mục đích — hãy bắt đầu từ điều nhỏ nào đó khiến bạn tò mò.",
      advice: "Cảm hứng này sẽ qua đi nếu bạn không làm gì — hành động nhỏ nhất cũng đủ để giữ nó lại."
    },
    colors: ["#ff6600","#ffaa00","#ff3300"],
    bg: "linear-gradient(160deg,#3a1500 0%,#5a2800 100%)"
  },
  {
    id: 23, name: "Two of Wands", nameVi: "Hai Gậy", suit: "wands",
    numeral: "II", symbol: "🌍",
    upright: "Bạn đang nhìn xa hơn những gì đang có — đây là lúc lên kế hoạch và mạnh dạn mở rộng ra ngoài vùng quen thuộc.",
    reversed: "Bạn đang do dự trước điều mới, hoặc thiếu kế hoạch rõ ràng khiến cơ hội cứ bị bỏ lỡ.",
    details: {
      love: "Xuôi: Đang cân nhắc tương lai của mối quan hệ một cách nghiêm túc — có thể là kế hoạch sống chung, tình yêu xa hoặc bước tiếp theo quan trọng. Ngược: Không chắc chắn về hướng đi trong tình cảm, do dự làm mất đi cơ hội tốt.",
      career: "Xuôi: Đang lên kế hoạch kinh doanh dài hạn hoặc mở rộng ra thị trường mới đầy tiềm năng. Ngược: Thiếu tầm nhìn chiến lược, dự án dậm chân tại chỗ vì không có kế hoạch rõ ràng.",
      health: "Xuôi: Two of Wands khuyến khích lên kế hoạch sức khỏe dài hạn — đây là lúc tốt để đặt mục tiêu thể lực cụ thể và xây dựng lộ trình thực hiện. Tầm nhìn xa về sức khỏe sẽ tạo nền tảng bền vững. Ngược: Thiếu kế hoạch sức khỏe rõ ràng dẫn đến không nhất quán, hoặc lo lắng quá mức về tương lai sức khỏe gây ra căng thẳng không cần thiết.",
      spirit: "Xuôi: Bạn đang thấy rõ hơn điều mình muốn và dám tưởng tượng đến những thứ lớn hơn những gì đang có. Ngược: Bạn đang ngại bước ra ngoài vùng an toàn — dù biết có nhiều hơn đang chờ ở phía trước.",
      advice: "Thế giới rộng hơn góc nhìn hiện tại của bạn — hãy bắt đầu lên kế hoạch để ra ngoài đó."
    },
    colors: ["#ff6600","#cc4400","#ffcc88"],
    bg: "linear-gradient(160deg,#3a1000 0%,#5a2000 100%)"
  },
  {
    id: 24, name: "Three of Wands", nameVi: "Ba Gậy", suit: "wands",
    numeral: "III", symbol: "⛵",
    upright: "Bạn đã gieo hạt và đang chờ kết quả — những gì bạn đã làm đang trên đường trở về. Hãy kiên nhẫn và tiếp tục mở rộng.",
    reversed: "Kết quả chưa đến như kỳ vọng, hoặc kế hoạch bị trì hoãn. Hãy đánh giá lại và điều chỉnh.",
    details: {
      love: "Xuôi: Mối quan hệ đang phát triển ra ngoài vùng an toàn — có thể gặp người đặc biệt qua du lịch hoặc mạng lưới mở rộng. Ngược: Kỳ vọng quá cao trong tình cảm dẫn đến thất vọng khi thực tế không như mong đợi.",
      career: "Xuôi: Dự án đang tiến triển tốt và kết quả đang trên đường trở về — hãy kiên nhẫn thêm một chút. Ngược: Dự án bị trì hoãn đáng kể, cần đánh giá lại chiến lược và điều chỉnh kỳ vọng.",
      health: "Xuôi: Three of Wands báo hiệu sự tiến bộ rõ rệt trong sức khỏe — nỗ lực bạn đã bỏ ra đang bắt đầu mang lại kết quả. Hãy kiên nhẫn và tiếp tục theo dõi tiến độ phục hồi. Ngược: Thất vọng vì quá trình phục hồi chậm hơn kỳ vọng — cần điều chỉnh mục tiêu thực tế hơn và không nản lòng.",
      spirit: "Xuôi: Bạn đang thấy cuộc sống rõ ràng hơn sau những nỗ lực vừa rồi — tiếp tục đi, những điều tốt đang trên đường đến. Ngược: Bạn đang nôn nóng muốn thấy kết quả ngay — nhưng một số thứ cần thêm thời gian để chín.",
      advice: "Bạn đã làm phần việc của mình — hãy tin vào quá trình và chờ kết quả đến."
    },
    colors: ["#ff8800","#ffbb44","#cc5500"],
    bg: "linear-gradient(160deg,#3a1800 0%,#502500 100%)"
  },
  {
    id: 25, name: "Four of Wands", nameVi: "Bốn Gậy", suit: "wands",
    numeral: "IV", symbol: "🎊",
    upright: "Đây là lúc dừng lại, ăn mừng những gì đạt được, và tận hưởng sự ổn định cùng người thân thiết.",
    reversed: "Có bất hòa trong gia đình hoặc môi trường xung quanh, hoặc điều bạn mong đợi đang bị trì hoãn.",
    details: {
      love: "Xuôi: Đính hôn, hôn nhân hoặc mốc quan trọng được kỷ niệm trong tình cảm — đây là giai đoạn hạnh phúc và ổn định. Ngược: Bất hòa trong gia đình hoặc sự kiện quan trọng trong mối quan hệ bị hoãn lại.",
      career: "Xuôi: Hoàn thành giai đoạn công việc quan trọng, được khen thưởng xứng đáng và môi trường làm việc hài hòa. Ngược: Xung đột nội bộ tại nơi làm việc hoặc thiếu sự ổn định ảnh hưởng đến hiệu suất.",
      health: "Xuôi: Four of Wands gợi lên sự ổn định và bình yên trong sức khỏe — cơ thể đang trong trạng thái cân bằng tốt, các chỉ số sức khỏe ổn định. Đây là lúc ăn mừng những cải thiện sức khỏe đã đạt được. Ngược: Môi trường gia đình bất hòa đang ảnh hưởng đến sức khỏe tâm lý, cần tạo không gian an toàn và bình yên cho bản thân.",
      spirit: "Xuôi: Bạn đang cảm thấy bình yên và có chỗ thuộc về — hãy trân trọng cảm giác đó. Ngược: Bạn chưa tìm thấy cộng đồng hoặc không gian phù hợp để mình thực sự là mình.",
      advice: "Dừng lại và ăn mừng những gì đã đạt được — trân trọng hiện tại là nền tảng để tiếp tục tiến."
    },
    colors: ["#ffaa00","#ff6600","#ffdd88"],
    bg: "linear-gradient(160deg,#3a2200 0%,#5a3800 100%)"
  },
  {
    id: 26, name: "Five of Wands", nameVi: "Năm Gậy", suit: "wands",
    numeral: "V", symbol: "⚔",
    upright: "Có nhiều ý kiến đang va chạm — đây có thể là cạnh tranh lành mạnh hoặc xung đột cần được giải quyết thẳng thắn.",
    reversed: "Bạn đang tránh né xung đột cần đối mặt, hoặc vừa thoát khỏi giai đoạn hỗn loạn và đang tìm lại sự ổn định.",
    details: {
      love: "Xuôi: Tranh luận hoặc cạnh tranh để thu hút sự chú ý đang xảy ra — cảm giác không được lắng nghe đủ trong mối quan hệ. Ngược: Đang giải quyết xung đột tình cảm hoặc tránh né vấn đề cốt lõi thay vì đối mặt trực tiếp.",
      career: "Xuôi: Cạnh tranh gay gắt trong môi trường làm việc, nhiều ý kiến xung đột cần tìm tiếng nói chung. Ngược: Cạnh tranh lành mạnh cuối cùng dẫn đến kết quả tốt cho tất cả.",
      health: "Xuôi: Five of Wands báo hiệu sức khỏe đang bị ảnh hưởng bởi căng thẳng và xung đột — tranh cãi, áp lực công việc hoặc cạnh tranh không lành mạnh gây ra mệt mỏi thể chất và căng thẳng đầu. Cần tìm cách giảm stress. Ngược: Đang phục hồi sau giai đoạn căng thẳng cao độ — tinh thần và thể chất dần tìm lại sự bình ổn sau những xung đột đã qua.",
      spirit: "Xuôi: Bạn đang mâu thuẫn với nhiều suy nghĩ và hướng đi khác nhau — hãy dành thời gian yên tĩnh để sắp xếp lại. Ngược: Bạn đang dần thoát khỏi giai đoạn hỗn loạn bên trong và tìm lại sự rõ ràng.",
      advice: "Không phải mọi cuộc tranh cãi đều đáng tham gia — hãy chọn điều thực sự quan trọng với bạn."
    },
    colors: ["#ff4400","#ffaa00","#cc2200"],
    bg: "linear-gradient(160deg,#3a0800 0%,#5a1500 100%)"
  },
  {
    id: 27, name: "Six of Wands", nameVi: "Sáu Gậy", suit: "wands",
    numeral: "VI", symbol: "🏆",
    upright: "Bạn đang được ghi nhận xứng đáng — hãy tự hào về điều đó và tận hưởng khoảnh khắc này.",
    reversed: "Nỗ lực của bạn chưa được nhìn nhận đúng mức, hoặc bạn đang tự cao đến mức mất đi sự kết nối với người xung quanh.",
    details: {
      love: "Xuôi: Được người yêu tôn trọng và ngưỡng mộ công khai, mối quan hệ được gia đình và bạn bè ủng hộ. Ngược: Tự cao trong tình cảm hoặc thành công bề ngoài che giấu vấn đề thực sự bên trong.",
      career: "Xuôi: Được thăng chức, khen thưởng hoặc nhận sự công nhận công khai trước đồng nghiệp và cấp trên. Ngược: Thiếu sự công nhận xứng đáng hoặc thành công đến cùng với áp lực kỳ vọng nặng nề.",
      health: "Xuôi: Six of Wands trong sức khỏe báo hiệu chiến thắng trước bệnh tật hoặc đạt được mục tiêu sức khỏe đáng tự hào — cơ thể đang ở trạng thái tốt và tinh thần tự tin. Hãy chia sẻ thành công này để truyền cảm hứng. Ngược: Quá tự tin vào sức khỏe dẫn đến chủ quan, bỏ qua kiểm tra định kỳ hoặc tái phát thói quen xấu sau khi vừa đạt mục tiêu.",
      spirit: "Xuôi: Bạn đang tự tin hơn vào bản thân và sẵn sàng chia sẻ những gì học được với người khác một cách thực lòng. Ngược: Bạn đang so sánh mình với người khác và cảm thấy mình hơn — thường là dấu hiệu thiếu tự tin thật sự.",
      advice: "Thành công này thực — hãy tận hưởng, nhưng đừng để nó định nghĩa toàn bộ con người bạn."
    },
    colors: ["#ffcc00","#ff8800","#ffee88"],
    bg: "linear-gradient(160deg,#3a2800 0%,#5a4000 100%)"
  },
  {
    id: 28, name: "Seven of Wands", nameVi: "Bảy Gậy", suit: "wands",
    numeral: "VII", symbol: "🛡",
    upright: "Bạn đang bị thách thức hoặc phải bảo vệ lập trường của mình — hãy đứng vững. Bạn đã leo lên đây không phải để dễ nhường chỗ.",
    reversed: "Bạn đang kiệt sức vì phải phòng thủ liên tục, hoặc đang nghi ngờ liệu mình có đủ sức tiếp tục hay không.",
    details: {
      love: "Xuôi: Kiên định bảo vệ mối quan hệ trước sự can thiệp của bên ngoài và không để áp lực bên ngoài ảnh hưởng đến tình cảm. Ngược: Mệt mỏi với việc phải liên tục bảo vệ tình yêu và đang cân nhắc liệu có đáng để tiếp tục không.",
      career: "Xuôi: Giữ vững vị trí trước đối thủ cạnh tranh, không để ai hạ thấp thành tựu của mình. Ngược: Cảm thấy bị tấn công từ nhiều phía, đang kiệt sức vì phải phòng thủ liên tục.",
      health: "Xuôi: Seven of Wands phản ánh khả năng chống đỡ bệnh tật hoặc áp lực sức khỏe — hệ miễn dịch đang hoạt động tốt để bảo vệ cơ thể trước các tác nhân bên ngoài. Tinh thần chiến đấu mạnh mẽ hỗ trợ quá trình phục hồi. Ngược: Đang kiệt sức trong cuộc chiến sức khỏe dài hạn — cần nhận sự hỗ trợ từ người khác thay vì cố tự chiến một mình.",
      spirit: "Xuôi: Bạn đang giữ vững điều mình tin là đúng dù có người không đồng tình — điều đó cần can đảm. Ngược: Áp lực từ người xung quanh đang khiến bạn lung lay — hỏi xem mình có muốn từ bỏ vì lý do đúng không.",
      advice: "Giữ vị trí của mình — đừng bỏ cuộc chỉ vì mệt. Nhưng cũng biết khi nào cần nhờ người khác hỗ trợ."
    },
    colors: ["#ff5500","#ffbb00","#cc3300"],
    bg: "linear-gradient(160deg,#3a1000 0%,#5a2200 100%)"
  },
  {
    id: 29, name: "Eight of Wands", nameVi: "Tám Gậy", suit: "wands",
    numeral: "VIII", symbol: "✈",
    upright: "Mọi thứ đang tiến nhanh — tin tức đến dồn dập, sự việc diễn ra liên tiếp. Hãy hành động ngay khi cơ hội mở ra.",
    reversed: "Mọi thứ đang bị trì hoãn, hoặc bạn đang vội vàng hành động sai lúc. Kiểm tra lại trước khi lao vào.",
    details: {
      love: "Xuôi: Mọi thứ trong tình cảm đang diễn ra với tốc độ nhanh — tin nhắn dồn dập, cuộc gặp gỡ bất ngờ và mối quan hệ tiến triển đột ngột. Ngược: Giao tiếp bị gián đoạn, thông điệp bị hiểu nhầm gây ra hiểu lầm không cần thiết.",
      career: "Xuôi: Dự án tăng tốc đáng kể, deadline gấp xuất hiện và tin tức quan trọng đang trên đường đến. Ngược: Trì hoãn và tắc nghẽn thông tin, hoặc đang vội vàng hành động sai thời điểm.",
      health: "Xuôi: Eight of Wands trong sức khỏe báo hiệu phục hồi nhanh chóng — cơ thể đang phản ứng tốt với điều trị và tiến bộ rõ rệt. Đây cũng có thể là thời điểm nhiều thông tin y tế đến cùng lúc cần xử lý. Ngược: Quá vội vàng trong chế độ tập luyện hoặc điều trị dẫn đến chấn thương hoặc tác dụng phụ — cần làm chậm lại.",
      spirit: "Xuôi: Nhiều điều đang ập đến cùng lúc — bạn đang học và hiểu rất nhiều thứ mới. Hãy ghi lại để không bị quên. Ngược: Bạn đang vội vàng đến mức không đủ thời gian thực sự tiêu hóa những gì đang xảy ra.",
      advice: "Thời điểm đang thuận — hành động ngay, nhưng đừng bỏ qua bước kiểm tra cẩn thận."
    },
    colors: ["#ff8800","#ffcc00","#ff5500"],
    bg: "linear-gradient(160deg,#3a1800 0%,#503000 100%)"
  },
  {
    id: 30, name: "Nine of Wands", nameVi: "Chín Gậy", suit: "wands",
    numeral: "IX", symbol: "🏹",
    upright: "Bạn đã đi qua rất nhiều rồi và có thể đang rất mệt — nhưng đích đang rất gần. Đừng bỏ cuộc lúc này.",
    reversed: "Bạn đang kiệt sức thực sự và cần nghỉ ngơi, hoặc đang cứng đầu từ chối nhận giúp đỡ dù rất cần.",
    details: {
      love: "Xuôi: Đã trải qua nhiều tổn thương trong tình cảm nhưng vẫn đứng vững — cẩn thận trước khi mở lòng là điều khôn ngoan. Ngược: Đang mang theo vết thương tình cảm cũ vào quan hệ mới, thiếu tin tưởng do bị tổn thương.",
      career: "Xuôi: Sắp về đích rồi — dù đang mệt mỏi nhưng đừng dừng lại lúc này vì thành công đang rất gần. Ngược: Kiệt sức nghề nghiệp nặng nề, cần nghỉ ngơi thực sự trước khi có thể tiếp tục hiệu quả.",
      health: "Xuôi: Nine of Wands phản ánh sức chịu đựng phi thường — dù mệt mỏi và mang nhiều vết thương, cơ thể vẫn đứng vững. Tuy nhiên cần nghỉ ngơi và phục hồi trước khi giai đoạn tiếp theo. Ngược: Kiệt sức toàn diện cả thể chất lẫn tinh thần — cơ thể đang phát tín hiệu cần dừng lại và chăm sóc bản thân nghiêm túc.",
      spirit: "Xuôi: Bạn đã vượt qua nhiều thứ và trở nên vững vàng hơn qua từng lần vấp ngã — điều đó có giá trị thực sự. Ngược: Bạn đang mang theo những vết thương cũ chưa được chữa lành, và chúng đang ảnh hưởng đến cách bạn đối mặt với hiện tại.",
      advice: "Bạn đã đi xa hơn bạn nghĩ — những gì vượt qua được là bằng chứng bạn đủ sức tiếp tục."
    },
    colors: ["#cc5500","#ff9900","#993300"],
    bg: "linear-gradient(160deg,#2a1000 0%,#451a00 100%)"
  },
  {
    id: 31, name: "Ten of Wands", nameVi: "Mười Gậy", suit: "wands",
    numeral: "X", symbol: "🎒",
    upright: "Bạn đang gánh quá nhiều thứ một mình — trách nhiệm, áp lực, kỳ vọng. Đã đến lúc học cách chia sẻ hoặc bớt đi một số thứ.",
    reversed: "Bạn đang bắt đầu buông bớt gánh nặng — tốt. Hoặc bạn vừa thành công giao bớt việc cho người khác và cảm thấy nhẹ hơn.",
    details: {
      love: "Xuôi: Đang cảm thấy tình cảm là gánh nặng — một bên đang gánh quá nhiều trách nhiệm trong mối quan hệ một cách không công bằng. Ngược: Bắt đầu buông bỏ kỳ vọng quá cao và chia sẻ gánh nặng đồng đều hơn với đối phương.",
      career: "Xuôi: Đang làm việc quá sức vì ôm đồm quá nhiều — cần học cách nói không và ủy quyền thay vì làm tất cả một mình. Ngược: Đã bắt đầu ủy quyền và phân công lại công việc hiệu quả hơn, cảm thấy nhẹ nhõm.",
      health: "Xuôi: Ten of Wands cảnh báo mạnh về kiệt sức do quá tải — cơ thể đang gánh quá mức dẫn đến đau lưng, mỏi cổ, đau đầu mãn tính hoặc rối loạn giấc ngủ. Cần đặt giới hạn ngay. Ngược: Đang bắt đầu giảm tải và cơ thể có dấu hiệu phục hồi — việc buông bỏ gánh nặng đang cải thiện sức khỏe tổng thể.",
      spirit: "Xuôi: Bạn đang mang theo gánh nặng của người khác hoặc cảm thấy có trách nhiệm với quá nhiều thứ — hãy phân biệt đâu là việc của bạn, đâu không phải. Ngược: Bạn đang tìm ra cách sống nhẹ nhàng hơn — không phải làm ít đi, mà là không mang những thứ không phải của mình.",
      advice: "Bạn không cần tự mình gánh tất cả — hỏi: trong những thứ này, cái nào thực sự là việc của tôi?"
    },
    colors: ["#993300","#cc6600","#661100"],
    bg: "linear-gradient(160deg,#250800 0%,#3a1200 100%)"
  },
  {
    id: 32, name: "Page of Wands", nameVi: "Cậu Bé Gậy", suit: "wands",
    numeral: "Pg", symbol: "🌱",
    upright: "Có tin vui hoặc ý tưởng mới đang đến — hãy đón nhận với sự tò mò và nhiệt tình.",
    reversed: "Bạn đang có nhiều ý tưởng nhưng không hoàn thành được cái nào, hoặc đang hành động bốc đồng thiếu suy nghĩ.",
    details: {
      love: "Xuôi: Tình yêu trẻ trung và nhiệt huyết đang đến — hoặc có tin tức vui liên quan đến tình cảm sắp được tiết lộ. Ngược: Thiếu chín chắn trong tình cảm dẫn đến hành động bốc đồng gây tổn thương cho cả hai.",
      career: "Xuôi: Cơ hội học nghề, thực tập hoặc dự án mới đầy hứng khởi đang gõ cửa — hãy mở ra. Ngược: Bắt đầu nhiều dự án cùng lúc nhưng không hoàn thành được cái nào vì thiếu kiên nhẫn.",
      health: "Xuôi: Page of Wands mang năng lượng trẻ trung và háo hức — đây là lúc tốt để thử các hoạt động thể thao mới hoặc phương pháp sức khỏe chưa thử qua. Tinh thần tươi mới và cởi mở hỗ trợ sức khỏe rất tốt. Ngược: Thiếu kiên nhẫn trong việc duy trì thói quen sức khỏe — bắt đầu nhiều chế độ nhưng bỏ giữa chừng dẫn đến không thấy kết quả.",
      spirit: "Xuôi: Bạn đang hứng thú và tò mò với nhiều thứ mới — đó là điều tốt. Sự hồn nhiên của người mới bắt đầu rất quý. Ngược: Bạn muốn thấy kết quả ngay và cảm thấy thất vọng khi mọi thứ cần thời gian — hãy kiên nhẫn hơn.",
      advice: "Giữ nhiệt huyết này — nhưng thêm vào đó một chút kiên nhẫn và kế hoạch cụ thể."
    },
    colors: ["#ffaa44","#ff7700","#ffdd99"],
    bg: "linear-gradient(160deg,#3a2000 0%,#553200 100%)"
  },
  {
    id: 33, name: "Knight of Wands", nameVi: "Hiệp Sĩ Gậy", suit: "wands",
    numeral: "Kt", symbol: "🏇",
    upright: "Bạn đang tràn đầy nhiệt huyết và sẵn sàng hành động táo bạo — miễn là biết mình đang đi về đâu thì đây là thời điểm tốt để tiến.",
    reversed: "Bạn đang quá vội vàng và hấp tấp — hành động nhanh mà không suy nghĩ đang gây ra những rắc rối không cần thiết.",
    details: {
      love: "Xuôi: Đam mê cháy bỏng và người theo đuổi nhiệt tình — hứa hẹn nhiều nhưng cần quan sát xem có ổn định lâu dài không. Ngược: Hành động bốc đồng trong tình cảm gây ra tình huống khó xử và tổn thương không cần thiết.",
      career: "Xuôi: Tiến công táo bạo vào cơ hội với năng lượng cao và sự quyết đoán dứt khoát. Ngược: Quá vội vàng trong quyết định nghề nghiệp, bỏ qua chi tiết quan trọng.",
      health: "Xuôi: Knight of Wands mang năng lượng vận động mạnh mẽ — đây là giai đoạn tốt để thực hiện các hoạt động thể thao cường độ cao, phiêu lưu ngoài trời hoặc thử thách thể chất. Cơ thể đang ở đỉnh form. Ngược: Liều lĩnh trong hoạt động thể chất dẫn đến nguy cơ chấn thương cao, hoặc lối sống hấp tấp và thiếu quy củ đang ảnh hưởng xấu đến sức khỏe.",
      spirit: "Xuôi: Bạn đang hứng khởi và muốn làm ngay — năng lượng đó rất tốt, chỉ cần định hướng rõ để không lãng phí. Ngược: Bạn đang tiêu hết sức mình vào quá nhiều thứ cùng lúc mà không có kế hoạch bền vững — sẽ kiệt sức sớm.",
      advice: "Năng lượng mạnh cần hướng đi rõ — không thì chỉ là hỗn loạn tốn sức."
    },
    colors: ["#ff5500","#ffcc00","#cc2200"],
    bg: "linear-gradient(160deg,#3a0800 0%,#5a1800 100%)"
  },
  {
    id: 34, name: "Queen of Wands", nameVi: "Nữ Hoàng Gậy", suit: "wands",
    numeral: "Q", symbol: "🌻",
    upright: "Bạn đang tự tin, sáng tạo và tỏa ra sức hút tự nhiên — hãy dẫn dắt từ điều đó, không cần cố gắng chứng minh.",
    reversed: "Bạn đang ghen tuông hoặc dùng sức hút cá nhân để kiểm soát người khác thay vì lãnh đạo thật lòng.",
    details: {
      love: "Xuôi: Tự tin và thu hút tự nhiên trong tình yêu — biết rõ mình muốn gì và không sợ thể hiện điều đó. Ngược: Ghen tuông quá mức hoặc dùng sức hút cá nhân để kiểm soát đối phương.",
      career: "Xuôi: Lãnh đạo bằng sức hút cá nhân thực sự và truyền cảm hứng cho cả đội nhóm làm việc hiệu quả. Ngược: Dùng sức hút để thao túng thay vì lãnh đạo chân thành.",
      health: "Xuôi: Queen of Wands tỏa ra năng lượng ấm áp và sức sống mạnh mẽ — sức khỏe đang rất tốt, cơ thể dẻo dai và tinh thần phấn chấn. Đây là lúc tốt để chia sẻ lối sống lành mạnh truyền cảm hứng cho người xung quanh. Ngược: Kiệt sức vì cố gắng tỏ ra mạnh mẽ trước mọi người trong khi thực tế đang cần nghỉ ngơi — hãy thành thật về giới hạn của bản thân.",
      spirit: "Xuôi: Bạn đang ở trạng thái vui vẻ và tự tin tự nhiên — sự ấm áp đó lan tỏa ra mà không cần cố gắng. Hãy để nó chảy. Ngược: Bạn đang cảm thấy mình hơn người khác và điều đó bắt đầu ảnh hưởng đến cách đối xử với họ.",
      advice: "Bạn đang tỏa sáng tự nhiên — hãy tin vào điều đó, không cần phải chứng minh với ai."
    },
    colors: ["#ffbb00","#ff7700","#ffee66"],
    bg: "linear-gradient(160deg,#3a2800 0%,#5a4200 100%)"
  },
  {
    id: 35, name: "King of Wands", nameVi: "Vua Gậy", suit: "wands",
    numeral: "K", symbol: "🦁",
    upright: "Bạn có tầm nhìn rõ ràng và biết cách biến ý tưởng lớn thành hành động cụ thể — đây là lúc lãnh đạo và truyền cảm hứng.",
    reversed: "Bạn đang độc đoán và thiếu kiên nhẫn với người xung quanh — quyền lực đang bị dùng sai cách.",
    details: {
      love: "Xuôi: Người bạn đời mạnh mẽ, có tầm nhìn và biết bảo vệ người thân bằng tình yêu thương chân thật. Ngược: Kiểm soát và độc đoán trong tình cảm, khiến đối phương cảm thấy bị áp đặt.",
      career: "Xuôi: Có tầm nhìn chiến lược rõ ràng và biết cách hiện thực hóa ý tưởng lớn ở quy mô rộng. Ngược: Lãnh đạo độc đoán thiếu kiên nhẫn với sai lầm của đội nhóm, gây ra môi trường làm việc căng thẳng.",
      health: "Xuôi: King of Wands trong sức khỏe thể hiện sức mạnh và sinh lực dồi dào — sức khỏe đang ở đỉnh cao và tinh thần lãnh đạo mạnh mẽ hỗ trợ vượt qua mọi thách thức thể chất. Ngược: Kiêu ngạo về sức khỏe dẫn đến bỏ qua kiểm tra định kỳ, hoặc áp lực lãnh đạo quá mức gây ra căng thẳng mãn tính.",
      spirit: "Xuôi: Bạn đang làm chủ được đam mê của mình — biết khi nào cần tiến, khi nào cần kiềm lại. Đó là dấu hiệu của sự trưởng thành thực sự. Ngược: Cái tôi đang lấn át sự sáng suốt — bạn đang tin vào bản thân quá mức đến mức không còn nghe người khác nữa.",
      advice: "Lãnh đạo thật sự không phải là ra lệnh — mà là khiến người khác muốn đi cùng bạn."
    },
    colors: ["#ff8800","#ffdd00","#cc5500"],
    bg: "linear-gradient(160deg,#3a2000 0%,#5a3800 100%)"
  },

  // ── CUPS (Nước · Cảm xúc · Tình yêu · Trực giác) ─────────────────────────
  {
    id: 36, name: "Ace of Cups", nameVi: "Át Cúp", suit: "cups",
    numeral: "A", symbol: "💧",
    upright: "Tình cảm hoặc cảm xúc mới đang mở ra — một mối tình, một tình bạn, hoặc một giai đoạn chữa lành bên trong. Hãy mở lòng đón nhận.",
    reversed: "Bạn đang đóng lòng hoặc cảm thấy tê liệt về mặt cảm xúc — có thể do sợ bị tổn thương thêm lần nữa.",
    details: {
      love: "Xuôi: Tình yêu đích thực đang đến hoặc nở rộ với sự tươi mới và thuần khiết — hãy mở lòng đón nhận không điều kiện. Ngược: Đang đóng lòng trước tình yêu vì sợ bị tổn thương thêm một lần nữa.",
      career: "Xuôi: Công việc được làm từ trái tim với cảm hứng sáng tạo dồi dào — đây là giai đoạn ý nghĩa nhất trong sự nghiệp. Ngược: Thiếu đam mê và ý nghĩa trong công việc, làm việc chỉ như cái máy.",
      health: "Xuôi: Ace of Cups gợi lên sự khởi đầu của quá trình chữa lành cảm xúc sâu sắc — sức khỏe tâm thần cải thiện đáng kể khi tình yêu thương và kết nối cảm xúc được nuôi dưỡng. Đây là lúc tốt để bắt đầu trị liệu tâm lý hoặc thực hành chánh niệm. Ngược: Cảm xúc bị chặn đang biểu hiện qua các triệu chứng thể chất như đau ngực, mệt mỏi không rõ nguyên nhân — cần chú ý đến sức khỏe cảm xúc.",
      spirit: "Xuôi: Bạn đang cảm thấy cởi mở và muốn kết nối — với người khác, với bản thân, với những điều xung quanh. Đây là trạng thái tốt, hãy nuôi dưỡng nó. Ngược: Bạn đang cảm thấy tách biệt và đóng kín — không cần ép mở ra ngay, hãy bắt đầu từ những bước nhỏ.",
      advice: "Hãy để cảm xúc chảy tự nhiên — đừng cố kiểm soát hay ngăn chặn nó."
    },
    colors: ["#4488ff","#88ccff","#aaddff"],
    bg: "linear-gradient(160deg,#0a1a4a 0%,#1a2a6a 100%)"
  },
  {
    id: 37, name: "Two of Cups", nameVi: "Hai Cúp", suit: "cups",
    numeral: "II", symbol: "💑",
    upright: "Có sự tương hợp và kết nối thực sự với ai đó — trong tình yêu, tình bạn, hoặc công việc. Cả hai cùng đến từ vị trí bình đẳng.",
    reversed: "Mối quan hệ đang mất đi sự cân bằng — không còn đồng điệu, hoặc một bên đang cho đi nhiều hơn bên kia.",
    details: {
      love: "Xuôi: Sự tương hợp và thu hút lẫn nhau thực sự — mối quan hệ cân bằng và chân thành khi cả hai đều hiện diện trọn vẹn. Ngược: Mất kết nối sâu sắc, cảm thấy không còn đồng điệu với nhau nữa dù vẫn bên nhau.",
      career: "Xuôi: Hợp tác kinh doanh thành công với người bổ sung tốt cho điểm mạnh và yếu của nhau. Ngược: Xung đột với đối tác kinh doanh, hợp tác không còn hiệu quả cần xem xét lại.",
      health: "Xuôi: Two of Cups phản ánh sự hòa hợp giữa tâm và thể — khi mối quan hệ lành mạnh và cân bằng, sức khỏe tổng thể cũng cải thiện rõ rệt. Đây là lúc tốt để chia sẻ hành trình sức khỏe với người bạn đời hoặc bạn tập. Ngược: Xung đột cảm xúc trong mối quan hệ đang gây ảnh hưởng trực tiếp đến sức khỏe thể chất — căng thẳng tình cảm có thể biểu hiện qua các triệu chứng cụ thể.",
      spirit: "Xuôi: Bạn đang cảm thấy hài hòa với bản thân và với người xung quanh — lý trí và cảm xúc đang ở trạng thái cân bằng. Ngược: Có mâu thuẫn giữa những gì bạn nghĩ và những gì bạn cảm thấy — cần dành thời gian để ngồi với điều đó.",
      advice: "Kết nối thực sự không xảy ra khi một trong hai người đang giả vờ — hãy hiện diện thật sự."
    },
    colors: ["#5599ff","#99ccff","#3377dd"],
    bg: "linear-gradient(160deg,#0a1a4a 0%,#1a3060 100%)"
  },
  {
    id: 38, name: "Three of Cups", nameVi: "Ba Cúp", suit: "cups",
    numeral: "III", symbol: "🥂",
    upright: "Đây là lúc vui vẻ cùng người thân thiết — ăn mừng, tụ họp, chia sẻ niềm vui. Niềm vui nhân đôi khi được chia sẻ.",
    reversed: "Bạn đang cô lập mình, hoặc đang ở cạnh những người không thực sự tốt cho bạn.",
    details: {
      love: "Xuôi: Mừng sự kiện tình cảm vui vẻ với bạn bè và người thân — tình yêu được nâng đỡ bởi cộng đồng ấm áp xung quanh. Ngược: Tam giác tình cảm phức tạp, hoặc người bạn bè can thiệp tiêu cực vào mối quan hệ.",
      career: "Xuôi: Thành công được chia sẻ vui vẻ với đồng đội, không khí làm việc vui vẻ và đoàn kết. Ngược: Đồng nghiệp không chân thật hoặc hội nhóm lôi kéo vào các việc không lành mạnh.",
      health: "Xuôi: Three of Cups nhắc nhở rằng kết nối xã hội lành mạnh là liều thuốc tốt cho sức khỏe — tụ họp vui vẻ với bạn bè thực sự cải thiện sức khỏe tâm thần và thể chất. Hãy tận hưởng những khoảnh khắc vui vẻ này. Ngược: Ăn uống quá mức hoặc uống rượu bia trong các buổi tụ họp đang ảnh hưởng xấu đến sức khỏe — cần cân bằng giữa vui chơi và chăm sóc bản thân.",
      spirit: "Xuôi: Bạn tìm thấy những người bạn có thể chia sẻ hành trình của mình — những người hiểu bạn và đồng hành thực sự. Ngược: Bạn đang bị ảnh hưởng tiêu cực bởi người xung quanh, hoặc chưa tìm được nhóm người phù hợp với mình.",
      advice: "Niềm vui được chia sẻ là niềm vui lớn hơn — hãy dành thời gian cho những người thực sự quan tâm đến bạn."
    },
    colors: ["#66aaff","#aaddff","#4488dd"],
    bg: "linear-gradient(160deg,#0a2040 0%,#1a3060 100%)"
  },
{
    id: 39, name: "Four of Cups", nameVi: "Bốn Cúp", suit: "cups",
    numeral: "IV", symbol: "😔",
    upright: "Thờ ơ, thiền định, suy ngẫm và có thể bỏ lỡ cơ hội vì nhìn vào trong.",
    reversed: "Thức tỉnh, nhận ra cơ hội đang đến, thoát khỏi chán nản.",
    details: {
      love: "Xuôi: Bạn đang có người quan tâm nhưng lại thờ ơ, không trân trọng những gì đang hiện diện — cảm giác như mối tình này 'chưa đủ' dù thực ra rất tốt. Đây là thời điểm cần hỏi bản thân: mình thực sự muốn gì từ tình yêu? Ngược: Sau giai đoạn thờ ơ, bạn bắt đầu nhận ra tình cảm tốt đẹp vẫn đang ở đó chờ — mở mắt ra và đón nhận trước khi quá muộn.",
      career: "Xuôi: Đang cân nhắc đổi việc nhưng chưa biết muốn gì, cảm thấy công việc hiện tại nhàm chán dù thực ra khá ổn. Có thể đang bỏ qua một cơ hội tốt vì đang chìm vào nội tâm quá nhiều. Ngược: Nhận ra cơ hội đang gõ cửa — một dự án mới hay lời mời hợp tác đang chờ câu trả lời của bạn.",
      health: "Xuôi: Thờ ơ và thiếu động lực có thể dẫn đến lối sống ít vận động, ảnh hưởng đến tuần hoàn và sức đề kháng — cần chủ động hơn trong việc chăm sóc thể chất. Ngược: Thoát khỏi giai đoạn uể oải, bắt đầu chú ý trở lại đến thể trạng và sức khoẻ tổng thể.",
      spirit: "Xuôi: Bạn đang chìm vào suy nghĩ và có thể đang bỏ lỡ điều tốt đẹp đang xảy ra ngay trước mắt — hãy thỉnh thoảng ngước đầu lên nhìn. Ngược: Bạn đang thoát khỏi giai đoạn thờ ơ và bắt đầu nhận ra những cơ hội và người tốt xung quanh.",
      advice: "Có những cơ hội xuất hiện ngay trước mắt khi bạn đang nhìn vào trong — hãy nhớ ngước đầu lên."
    },
    colors: ["#3366aa","#6699cc","#224488"],
    bg: "linear-gradient(160deg,#0a1530 0%,#152040 100%)"
  },
  {
    id: 40, name: "Five of Cups", nameVi: "Năm Cúp", suit: "cups",
    numeral: "V", symbol: "😢",
    upright: "Bạn đang đau lòng vì điều gì đó đã mất — cảm xúc đó hoàn toàn hợp lý. Nhưng đừng quên những gì vẫn còn.",
    reversed: "Bạn đang dần chấp nhận và bắt đầu nhìn về phía trước — đây là dấu hiệu tốt của quá trình lành lại.",
    details: {
      love: "Xuôi: Đang đau lòng sau chia tay hoặc thất vọng nặng nề trong tình cảm — bạn chỉ nhìn thấy những gì đã mất mà quên rằng vẫn còn những mối quan hệ tốt đẹp xung quanh. Ngược: Bắt đầu chữa lành và chấp nhận, dần dần hướng mắt về phía trước thay vì ngoái nhìn.",
      career: "Xuôi: Thất bại trong công việc hoặc dự án bị huỷ khiến bạn chán nản, khó nhìn thấy những gì vẫn còn nguyên vẹn — cần đánh giá lại tổng thể. Ngược: Rút ra bài học quý từ thất bại và bắt đầu lại với tâm thế vững hơn.",
      health: "Xuôi: Đau buồn kéo dài ảnh hưởng trực tiếp đến sức khoẻ — có thể gặp mệt mỏi mãn tính, mất ngủ hoặc suy giảm miễn dịch do cảm xúc tiêu cực tích tụ. Ngược: Cảm xúc dần ổn định, cơ thể bắt đầu phục hồi khi tâm trí chấp nhận và buông bỏ.",
      spirit: "Xuôi: Bạn đang ở giai đoạn đau — cảm thấy mất phương hướng và không biết mình muốn gì. Đó là điều bình thường sau mất mát. Ngược: Bạn đang tìm lại ý nghĩa và lý do để tiếp tục — hãy giữ ngọn lửa nhỏ đó.",
      advice: "Nhìn những chiếc cốc còn đứng — vẫn còn nhiều thứ tốt đẹp sau mất mát."
    },
    colors: ["#334488","#557799","#223366"],
    bg: "linear-gradient(160deg,#0a1530 0%,#0a2040 100%)"
  },
  {
    id: 41, name: "Six of Cups", nameVi: "Sáu Cúp", suit: "cups",
    numeral: "VI", symbol: "🌸",
    upright: "Những ký ức đẹp đang trở về, hoặc ai đó từ quá khứ đang xuất hiện lại. Hãy xem đây là cơ hội hay chỉ là hoài niệm.",
    reversed: "Bạn đang lý tưởng hóa quá khứ hoặc người cũ, điều đó đang ngăn bạn đón nhận những điều tốt hơn ở hiện tại.",
    details: {
      love: "Xuôi: Mối tình mang hơi hướng ngây thơ trong sáng, hoặc người quen cũ bất ngờ liên lạc lại mang theo ký ức đẹp — hãy xem đây là cơ hội hay chỉ là hoài niệm. Ngược: Đang lý tưởng hoá người cũ hoặc ký ức tốt đẹp, điều này cản trở việc đón nhận người mới phù hợp hơn.",
      career: "Xuôi: Cơ hội hợp tác lại với người quen cũ hoặc quay về lĩnh vực quen thuộc từng làm tốt. Ngược: Cứ bám vào cách làm cũ, không chịu cập nhật kỹ năng hay thích nghi với thay đổi.",
      health: "Xuôi: Ký ức tuổi thơ tích cực giúp tinh thần thư giãn và hồi phục — liệu pháp hướng về quá khứ lành mạnh có thể rất hiệu quả lúc này. Ngược: Mắc kẹt trong hoài niệm tạo ra trạng thái không thể hiện diện, dễ dẫn đến lo âu và mất ngủ.",
      spirit: "Xuôi: Bạn đang kết nối lại với phần hồn nhiên, vô tư của mình — phần đó vẫn còn đó và có thể chữa lành bạn. Ngược: Bạn đang sống trong ký ức nhiều hơn trong hiện tại — quá khứ là nơi để thăm, không phải để sống.",
      advice: "Quá khứ là nơi để học, không phải để sống — mang bài học về nhưng đừng ở lại đó."
    },
    colors: ["#5588cc","#88aadd","#3366aa"],
    bg: "linear-gradient(160deg,#0a1840 0%,#1a2a5a 100%)"
  },
  {
    id: 42, name: "Seven of Cups", nameVi: "Bảy Cúp", suit: "cups",
    numeral: "VII", symbol: "🌈",
    upright: "Có quá nhiều lựa chọn và khả năng đang hiện ra — hãy kiểm tra kỹ xem điều nào thực tế và điều nào chỉ là ảo tưởng.",
    reversed: "Sự mơ màng đang qua đi và bạn đang thấy rõ hơn — đây là lúc đưa ra quyết định cụ thể.",
    details: {
      love: "Xuôi: Đang lý tưởng hoá tình yêu trong đầu nhiều hơn thực tế — bị cuốn vào hình ảnh hoàn hảo của người kia thay vì nhìn thấy con người thật. Ngược: Nhìn rõ bạn đời hơn, bắt đầu chấp nhận con người thực với cả ưu và khuyết điểm.",
      career: "Xuôi: Quá nhiều ý tưởng và hướng đi khác nhau khiến bạn phân tâm, không thể quyết định được nên làm gì trước. Ngược: Tập trung vào một hướng rõ ràng sau giai đoạn mơ màng, bắt đầu hành động cụ thể.",
      health: "Xuôi: Quá nhiều lựa chọn và lo nghĩ lan man dẫn đến căng thẳng tinh thần, khó tập trung và dễ kiệt sức não bộ. Ngược: Tâm trí dần rõ ràng hơn, căng thẳng giảm bớt khi bạn đã chọn được hướng đi.",
      spirit: "Xuôi: Bạn đang bị cuốn vào nhiều ý tưởng hấp dẫn nhưng chưa có cơ sở thực tế — hãy hỏi: cái nào mình thực sự muốn làm, không phải chỉ muốn có. Ngược: Sự rõ ràng đang trở lại — bạn đang nhìn thấy con đường thực sự của mình.",
      advice: "Giấc mơ là nguyên liệu của thực tại — nhưng cần thêm hành động cụ thể để biến chúng thành sự thật."
    },
    colors: ["#7766cc","#9988dd","#5544aa"],
    bg: "linear-gradient(160deg,#15103a 0%,#251a5a 100%)"
  },
  {
    id: 43, name: "Eight of Cups", nameVi: "Tám Cúp", suit: "cups",
    numeral: "VIII", symbol: "🚶",
    upright: "Bạn đang cân nhắc rời bỏ điều gì đó — mối quan hệ, công việc, lối sống — dù bề ngoài vẫn ổn. Điều đó cần can đảm.",
    reversed: "Bạn biết cần rời đi nhưng không dám, hoặc đang quay lại thứ đã từ bỏ vì quen thuộc chứ không phải vì nó tốt.",
    details: {
      love: "Xuôi: Dũng cảm rời bỏ mối quan hệ không đủ sâu hoặc không còn nuôi dưỡng tâm hồn, dù bề ngoài vẫn ổn — đây là bước đi cần can đảm. Ngược: Biết trong lòng không còn hợp nhưng không dám rời đi vì sợ cô đơn hoặc sợ thay đổi.",
      career: "Xuôi: Đang cân nhắc từ bỏ công việc ổn định để tìm ý nghĩa thực sự — đây không phải bỏ cuộc mà là tìm kiếm điều đúng hơn. Ngược: Mắc kẹt trong công việc không còn phù hợp vì sợ mất thu nhập hoặc chưa biết làm gì khác.",
      health: "Xuôi: Bước đi mới về tinh thần mang lại cảm giác nhẹ nhàng hơn — việc từ bỏ những thứ nặng nề đang tốt cho sức khoẻ tổng thể. Ngược: Ở lại trong môi trường hoặc mối quan hệ không lành mạnh đang bào mòn sức khoẻ cả thể chất lẫn tinh thần.",
      spirit: "Xuôi: Bạn đang bỏ lại những thứ không còn thực sự là của mình để đi tìm thứ gì đó chân thật hơn — dù chưa biết đó là gì. Ngược: Bạn đang sợ bước vào điều chưa quen, và quay về thứ cũ vì nó an toàn — dù bạn biết nó không còn phù hợp nữa.",
      advice: "Đôi khi rời bỏ những thứ tốt là để đón nhận những thứ đúng hơn."
    },
    colors: ["#446699","#6688bb","#335588"],
    bg: "linear-gradient(160deg,#0a1530 0%,#152040 100%)"
  },
  {
    id: 44, name: "Nine of Cups", nameVi: "Chín Cúp", suit: "cups",
    numeral: "IX", symbol: "🌟",
    upright: "Điều bạn mong muốn đang dần thành hiện thực — đây là giai đoạn hạnh phúc và thỏa mãn. Hãy tận hưởng, không cần cảm thấy có lỗi vì mình đang ổn.",
    reversed: "Bạn đang tìm hạnh phúc từ thứ bên ngoài — người khác, vật chất, sự công nhận — thay vì từ bên trong bản thân.",
    details: {
      love: "Xuôi: Điều bạn mong muốn trong tình yêu đang dần thành hiện thực — giai đoạn hạnh phúc và thoả mãn cảm xúc, xứng đáng được tận hưởng. Ngược: Đang tìm kiếm hạnh phúc ở người khác hay vật chất bên ngoài thay vì xây dựng từ bên trong chính mình.",
      career: "Xuôi: Đạt được điều mình muốn trong sự nghiệp, cảm giác thoả mãn và sung túc sau giai đoạn nỗ lực dài. Ngược: Thành công về vật chất nhưng trống rỗng bên trong, cần xem xét lại giá trị thực sự của công việc.",
      health: "Xuôi: Thể chất và tinh thần đều đang ở trạng thái tốt — đây là thời điểm để tận hưởng sức khoẻ và duy trì thói quen tích cực. Ngược: Tự thưởng quá mức có thể ảnh hưởng xấu đến sức khoẻ, cần giữ kỷ luật trong ăn uống và sinh hoạt.",
      spirit: "Xuôi: Bạn đang ở trạng thái biết ơn và thỏa mãn thực sự — không phải cố tạo ra, mà cảm thấy tự nhiên. Ngược: Bạn đang so sánh mình với người khác hoặc muốn được thừa nhận — hạnh phúc thật không cần ai chứng kiến.",
      advice: "Lá bài ước nguyện — hãy biết rõ điều bạn thực sự muốn, vì nó có thể sẽ thành sự thật."
    },
    colors: ["#4477cc","#77aaee","#2255aa"],
    bg: "linear-gradient(160deg,#0a1540 0%,#1a2860 100%)"
  },
  {
    id: 45, name: "Ten of Cups", nameVi: "Mười Cúp", suit: "cups",
    numeral: "X", symbol: "🌈",
    upright: "Mối quan hệ và gia đình đang ở giai đoạn hài hòa và ấm áp thực sự — một trong những giai đoạn đẹp nhất trong cuộc sống.",
    reversed: "Có bất hòa trong gia đình hoặc bạn đang kỳ vọng quá cao vào cuộc sống khiến hiện tại không bao giờ đủ.",
    details: {
      love: "Xuôi: Mối quan hệ đang hướng đến hạnh phúc bền vững thực sự — gia đình hoà thuận, yêu thương và hỗ trợ nhau qua mọi giai đoạn. Ngược: Vẻ bề ngoài hạnh phúc đang che giấu vấn đề âm ỉ bên trong, hoặc xung đột gia đình chưa được giải quyết.",
      career: "Xuôi: Công việc và cuộc sống cá nhân đang hoà hợp tốt với nhau, cảm thấy mục đích nghề nghiệp có ý nghĩa. Ngược: Áp lực công việc đang ảnh hưởng tiêu cực đến hạnh phúc gia đình, cần tìm lại cân bằng.",
      health: "Xuôi: Môi trường gia đình hoà thuận tạo nền tảng tinh thần vững chắc, hỗ trợ sức khoẻ tổng thể rất tốt. Ngược: Căng thẳng gia đình kéo dài ảnh hưởng trực tiếp đến sức khoẻ — đau đầu, mất ngủ hoặc các vấn đề tâm lý liên quan đến môi trường sống.",
      spirit: "Xuôi: Bạn đang cảm thấy trọn vẹn và hài lòng với cuộc sống — không phải vì mọi thứ hoàn hảo, mà vì bạn đang thực sự có mặt với những gì đang có. Ngược: Bạn đang chờ đợi điều gì đó xảy ra để mới cảm thấy hạnh phúc — nhưng hạnh phúc không hoạt động theo cách đó.",
      advice: "Hạnh phúc thực sự không phải là điểm đến — nó là cách bạn đi trên hành trình mỗi ngày."
    },
    colors: ["#3366cc","#6699ff","#1144aa"],
    bg: "linear-gradient(160deg,#0a1a50 0%,#1a2a70 100%)"
  },
  {
    id: 46, name: "Page of Cups", nameVi: "Cậu Bé Cúp", suit: "cups",
    numeral: "Pg", symbol: "🐟",
    upright: "Có tin nhắn hoặc điều bất ngờ trong tình cảm đang đến — hãy mở lòng với nó. Trực giác của bạn đang nói điều gì đó.",
    reversed: "Bạn đang sống trong mộng tưởng về tình yêu hơn là đối mặt với thực tế, hoặc phản ứng cảm xúc thiếu trưởng thành đang gây rắc rối.",
    details: {
      love: "Xuôi: Tin nhắn tình cảm bất ngờ đang đến, hoặc một tình cảm trẻ trung và chân thành đang chớm nở — mở lòng đón nhận với sự tò mò. Ngược: Cảm xúc thiếu trưởng thành, hay hờn dỗi hoặc sống trong mộng tưởng về tình yêu lý tưởng hơn là đối mặt với thực tế.",
      career: "Xuôi: Ý tưởng sáng tạo mới đến từ trực giác, đây là lúc thích hợp theo đuổi hướng nghệ thuật hoặc sáng tạo. Ngược: Kế hoạch nghề nghiệp thiếu thực tế, mơ mộng nhiều nhưng chưa có bước đi cụ thể.",
      health: "Xuôi: Trực giác mách bảo điều gì đó về sức khoẻ cần chú ý — hãy lắng nghe cơ thể và không bỏ qua những dấu hiệu nhỏ. Ngược: Né tránh đối mặt với vấn đề sức khoẻ vì sợ hoặc chưa sẵn sàng thay đổi lối sống.",
      spirit: "Xuôi: Bạn đang rất nhạy cảm và cởi mở — trực giác đang hoạt động tốt. Hãy lắng nghe những cảm giác nhỏ mà bạn thường bỏ qua. Ngược: Bạn đang dễ tin vào những thứ hấp dẫn nhưng không có cơ sở — hãy kiểm tra lại bằng thực tế.",
      advice: "Trực giác của bạn đang thủ thỉ điều gì đó — hãy lắng nghe dù nó nghe có vẻ kỳ lạ."
    },
    colors: ["#5588ee","#88bbff","#3366cc"],
    bg: "linear-gradient(160deg,#0a1840 0%,#1a2a5a 100%)"
  },
  {
    id: 47, name: "Knight of Cups", nameVi: "Hiệp Sĩ Cúp", suit: "cups",
    numeral: "Kt", symbol: "🤍",
    upright: "Có ai đó hoặc điều gì đó đang đến với sự lãng mạn và chân thành — hãy đón nhận nhưng đừng để cảm xúc che khuất sự thật.",
    reversed: "Lời hứa ngọt ngào nhưng không có hành động thực tế, hoặc cảm xúc thất thường đang gây ra những vấn đề không cần thiết.",
    details: {
      love: "Xuôi: Người đang đến trong cuộc đời bạn mang theo sự lãng mạn chân thành và cam kết — không chỉ lời hoa mỹ mà còn hành động cụ thể. Ngược: Lời hứa ngọt ngào nhưng không thực hiện, sự lãng mạn che giấu sự thiếu thực tế hoặc không trung thực.",
      career: "Xuôi: Cơ hội đến qua con đường không ngờ tới — một lời mời, một dự án sáng tạo hoặc hợp tác theo đam mê. Ngược: Kế hoạch viển vông thiếu hành động cụ thể, cần kiểm tra tính thực tế trước khi cam kết.",
      health: "Xuôi: Theo đuổi đam mê và sống đúng với cảm xúc giúp tinh thần phấn chấn, tăng cường năng lượng tích cực. Ngược: Cảm xúc thất thường và thiếu ổn định ảnh hưởng đến giấc ngủ và hệ thần kinh.",
      spirit: "Xuôi: Bạn đang hành động từ trái tim và theo đuổi điều có ý nghĩa với mình — năng lượng đó rất tốt, hãy giữ nó. Ngược: Cảm xúc đang dẫn dắt bạn theo nhiều hướng khác nhau — bạn cần neo lại bản thân trước khi bị cuốn đi.",
      advice: "Theo đuổi điều bạn yêu — nhưng đừng để lãng mạn che khuất sự thật."
    },
    colors: ["#4477dd","#7799ee","#2255bb"],
    bg: "linear-gradient(160deg,#0a1540 0%,#1a2560 100%)"
  },
  {
    id: 48, name: "Queen of Cups", nameVi: "Nữ Hoàng Cúp", suit: "cups",
    numeral: "Q", symbol: "🌊",
    upright: "Bạn đang rất nhạy cảm với cảm xúc của mình và người khác — hãy dùng sự đồng cảm đó để kết nối, nhưng nhớ đặt ra ranh giới.",
    reversed: "Cảm xúc đang không ổn định, hoặc bạn đang phụ thuộc vào người khác về mặt cảm xúc theo cách không lành mạnh.",
    details: {
      love: "Xuôi: Yêu thương sâu sắc và đồng cảm thực sự — bạn hoặc đối phương có khả năng cảm nhận rất tốt nhu cầu của nhau, tạo nên sự gắn kết bền vững. Ngược: Phụ thuộc cảm xúc quá mức, hoặc dùng cảm xúc để kiểm soát và thao túng người kia.",
      career: "Xuôi: Lãnh đạo bằng trái tim, tạo môi trường làm việc ấm áp và hỗ trợ — đồng nghiệp tin tưởng và tìm đến bạn. Ngược: Để cảm xúc ảnh hưởng đến quyết định công việc, khó phân biệt ranh giới cá nhân và chuyên nghiệp.",
      health: "Xuôi: Sức khoẻ cảm xúc đang tốt — khả năng tự chăm sóc và chữa lành bản thân cao, hệ miễn dịch được hỗ trợ bởi trạng thái tinh thần tích cực. Ngược: Hấp thụ cảm xúc tiêu cực của người xung quanh quá nhiều dẫn đến kiệt sức về tinh thần và thể chất.",
      spirit: "Xuôi: Bạn có khả năng cảm nhận và hiểu người khác rất tốt — đó là món quà. Hãy dùng nó để giúp đỡ, không phải để chịu đựng. Ngược: Bạn đang hấp thụ cảm xúc tiêu cực của người xung quanh và gần như mất đi chính mình — cần đặt ranh giới rõ hơn.",
      advice: "Đồng cảm là quà tặng lớn — nhưng hãy nhớ đặt ranh giới để không bị kiệt sức."
    },
    colors: ["#3355cc","#6688ee","#1133aa"],
    bg: "linear-gradient(160deg,#0a1440 0%,#152060 100%)"
  },
  {
    id: 49, name: "King of Cups", nameVi: "Vua Cúp", suit: "cups",
    numeral: "K", symbol: "🌐",
    upright: "Bạn đang xử lý cảm xúc một cách trưởng thành — không phủ nhận, không bùng nổ, chỉ cảm nhận và hành động sáng suốt.",
    reversed: "Bạn đang kìm nén cảm xúc quá mức, hoặc ngược lại đang để chúng kiểm soát hoàn toàn — cả hai đều không lành mạnh.",
    details: {
      love: "Xuôi: Người bạn đời trưởng thành và ổn định về cảm xúc — biết lắng nghe, không phản ứng thái quá và luôn là điểm tựa vững chắc. Ngược: Lạnh lùng về mặt cảm xúc hoặc dùng sự điềm tĩnh bề ngoài để che giấu vấn đề chưa được giải quyết.",
      career: "Xuôi: Lãnh đạo bằng sự khôn ngoan và điềm tĩnh, đưa ra quyết định cân bằng giữa lý trí và trái tim. Ngược: Khoảng cách cảm xúc với đội nhóm dẫn đến mất kết nối và hiệu quả làm việc giảm sút.",
      health: "Xuôi: Cân bằng cảm xúc là nền tảng sức khoẻ tốt — hệ thần kinh ổn định, ít bị stress tác động đến cơ thể. Ngược: Kìm nén cảm xúc lâu ngày thay vì thực sự làm chủ chúng có thể tích tụ thành căng thẳng thể chất.",
      spirit: "Xuôi: Bạn đang học cách cảm nhận cảm xúc mà không bị chúng cuốn đi — đó là dấu hiệu của sự trưởng thành thực sự. Ngược: Bạn đang nhầm lẫn giữa kìm nén và làm chủ — kìm nén không làm cảm xúc biến mất, nó chỉ tích tụ lại.",
      advice: "Sức mạnh không phải là không có cảm xúc — mà là cảm xúc không kiểm soát bạn."
    },
    colors: ["#2244bb","#5577dd","#112299"],
    bg: "linear-gradient(160deg,#0a1240 0%,#101d55 100%)"
  },
  {
    id: 50, name: "Ace of Swords", nameVi: "Át Kiếm", suit: "swords",
    numeral: "A", symbol: "⚔",
    upright: "Tư duy đang rõ ràng và sắc bén — đây là lúc tốt để đưa ra quyết định, nói lên sự thật, hoặc cắt bỏ điều không còn đúng.",
    reversed: "Tư duy đang mờ nhạt hoặc bạn đang dùng sự thật như vũ khí để làm đau người khác thay vì để thực sự rõ ràng.",
    details: {
      love: "Xuôi: Sự thật cần được nói ra trong mối quan hệ — dù đau lúc đầu nhưng sự thành thật sẽ xây dựng nền tảng bền vững hơn. Ngược: Lời nói sắc bén đang gây tổn thương không cần thiết, hoặc bạn đang né tránh không dám nói thật vì sợ xung đột.",
      career: "Xuôi: Ý tưởng đột phá và tư duy rõ ràng giúp vượt qua trở ngại — đây là lúc trình bày quan điểm mạnh mẽ. Ngược: Quyết định dựa trên thông tin sai lệch hoặc chưa đủ, cần kiểm tra lại dữ liệu.",
      health: "Xuôi: Sự rõ ràng về tinh thần giúp bạn đưa ra quyết định sức khoẻ đúng đắn — chẩn đoán chính xác và điều trị hiệu quả. Ngược: Tư duy lo âu và tiêu cực ảnh hưởng đến sức khoẻ thần kinh, cần kiểm soát dòng suy nghĩ.",
      spirit: "Xuôi: Bạn đang nhìn thấy điều gì đó rõ hơn bao giờ hết — một sự thật về bản thân hoặc tình huống. Đừng bỏ qua cái nhìn sáng suốt đó. Ngược: Bạn đang dùng sự thông minh của mình để thắng tranh luận thay vì để hiểu thực sự — điều đó đang cô lập bạn.",
      advice: "Sự thật giải phóng — dù đau trong khoảnh khắc, nó sẽ dẫn đến tự do."
    },
    colors: ["#aaaacc","#ddddff","#8888aa"],
    bg: "linear-gradient(160deg,#1a1a3a 0%,#2a2a5a 100%)"
  },
  {
    id: 51, name: "Two of Swords", nameVi: "Hai Kiếm", suit: "swords",
    numeral: "II", symbol: "🙈",
    upright: "Bạn đang tránh né một quyết định hoặc một sự thật khó chịu — nhưng việc tiếp tục không nhìn vào sẽ không làm nó biến mất.",
    reversed: "Bạn cuối cùng đã sẵn sàng nhìn thẳng vào sự thật và đưa ra quyết định mà bạn đã trì hoãn quá lâu.",
    details: {
      love: "Xuôi: Đang tránh né thảo luận về vấn đề quan trọng trong mối quan hệ — cả hai cùng giả vờ như không có gì, nhưng sự im lặng đang tạo khoảng cách. Ngược: Cuối cùng đã sẵn sàng đối mặt với sự thật về mối quan hệ, dù đau nhưng cần thiết.",
      career: "Xuôi: Đang do dự giữa hai lựa chọn quan trọng — có thể cần thêm thông tin hoặc tư vấn trước khi quyết định. Ngược: Đưa ra được quyết định khó sau thời gian dài trì hoãn, cảm giác nhẹ nhõm.",
      health: "Xuôi: Né tránh đi khám hoặc đối mặt với vấn đề sức khoẻ khiến tình trạng có thể trầm trọng hơn — hãy không để nỗi sợ cản trở. Ngược: Quyết định tìm hiểu rõ về tình trạng sức khoẻ, bắt đầu hành trình điều trị hoặc thay đổi lối sống.",
      spirit: "Xuôi: Bạn đang né tránh điều gì đó bạn biết là đúng nhưng không muốn đối mặt — vì đối mặt với nó đồng nghĩa với thay đổi. Ngược: Bạn đang dũng cảm nhìn thẳng vào điều mình từ lâu né tránh — đó là bước quan trọng.",
      advice: "Bịt mắt không làm sự thật biến mất — hãy nhìn thẳng vào nó."
    },
    colors: ["#9999bb","#ccccee","#777799"],
    bg: "linear-gradient(160deg,#181830 0%,#282848 100%)"
  },
  {
    id: 52, name: "Three of Swords", nameVi: "Ba Kiếm", suit: "swords",
    numeral: "III", symbol: "💔",
    upright: "Bạn đang trải qua nỗi đau thực sự — chia tay, phản bội, hoặc mất mát. Nỗi đau này cần được thừa nhận, không phải chối bỏ.",
    reversed: "Vết thương đang bắt đầu lành — bạn sẵn sàng tha thứ cho người khác hoặc cho chính mình để tiến về phía trước.",
    details: {
      love: "Xuôi: Trái tim đang bị tan vỡ vì chia tay, phản bội hoặc một hiểu lầm đau đớn không thể vá lại — nỗi đau này rất thật và cần được thừa nhận. Ngược: Vết thương bắt đầu lành, bạn sẵn sàng tha thứ — cho người kia hoặc cho chính mình — để tiến lên.",
      career: "Xuôi: Thất vọng nặng nề về nghề nghiệp, bị phản bội bởi đồng nghiệp hoặc dự án tâm huyết thất bại khiến tinh thần sa sút. Ngược: Vượt qua thất bại, rút ra bài học và tiến lên phía trước với bản lĩnh hơn.",
      health: "Xuôi: Đau khổ cảm xúc ảnh hưởng trực tiếp đến sức khoẻ thể chất — có thể gặp đau ngực, mất ngủ, suy giảm miễn dịch hoặc mệt mỏi kéo dài. Ngược: Quá trình chữa lành cảm xúc đang tích cực tác động đến thể chất — sức khoẻ dần hồi phục.",
      spirit: "Xuôi: Bạn đang ở giai đoạn đau nhất — cảm thấy như không còn chỗ nào để bám vào. Đây là giai đoạn sẽ qua, dù lúc này chưa thấy ánh sáng. Ngược: Bạn đang tìm lại ánh sáng sau giai đoạn tối nhất — hãy giữ lấy điều nhỏ nhoi đó.",
      advice: "Đau lòng là bằng chứng bạn đã yêu — hãy để nó chảy qua, đừng cố chặn lại."
    },
    colors: ["#cc3366","#ff6699","#aa1144"],
    bg: "linear-gradient(160deg,#2a0a1a 0%,#3a1028 100%)"
  },
  {
    id: 53, name: "Four of Swords", nameVi: "Bốn Kiếm", suit: "swords",
    numeral: "IV", symbol: "😴",
    upright: "Cơ thể và đầu óc đang cần nghỉ ngơi thực sự — không phải nghỉ trong khi vẫn đang lo nghĩ. Đây là lúc để lấy lại sức.",
    reversed: "Bạn đang kiệt sức nhưng không chịu dừng lại, hoặc bạn đã nạp đủ năng lượng và sẵn sàng hành động trở lại.",
    details: {
      love: "Xuôi: Cần khoảng thời gian nghỉ ngơi trong tình cảm — tạm dừng để cả hai nạp lại năng lượng thay vì liên tục xung đột. Ngược: Đã đủ năng lượng để quay trở lại với tình cảm và tiếp tục xây dựng mối quan hệ.",
      career: "Xuôi: Đây là lúc nghỉ ngơi chiến lược, không phải tấn công — hãy nạp lại năng lượng để tư duy rõ hơn. Ngược: Cảm thấy kiệt sức nhưng không chịu nghỉ, cần nhận ra giới hạn của bản thân.",
      health: "Xuôi: Cơ thể đang cần nghỉ ngơi phục hồi thực sự — hãy ưu tiên giấc ngủ đủ giấc và tránh xa căng thẳng để tái tạo năng lượng. Ngược: Không chịu nghỉ dù cơ thể đã kiệt sức, nguy cơ kiệt quệ sức khoẻ nếu không thay đổi ngay.",
      spirit: "Xuôi: Bạn cần khoảng lặng — không phải để làm gì, chỉ để ngồi yên và để mọi thứ lắng xuống. Điều đó không phải là lãng phí thời gian. Ngược: Bạn đang quá bận để dừng lại — nhưng chính sự bận đó đang làm bạn kém hiệu quả hơn.",
      advice: "Nghỉ ngơi không phải là yếu đuối — đây là chiến lược. Chiến binh khôn ngoan biết khi nào cần phục hồi."
    },
    colors: ["#8888aa","#aaaacc","#666688"],
    bg: "linear-gradient(160deg,#151525 0%,#222235 100%)"
  },
  {
    id: 54, name: "Five of Swords", nameVi: "Năm Kiếm", suit: "swords",
    numeral: "V", symbol: "😤",
    upright: "Bạn có thể thắng cuộc cãi vã này, nhưng sẽ thua về mối quan hệ. Hỏi thật: bạn muốn đúng hay muốn hạnh phúc?",
    reversed: "Bạn đang hòa giải sau xung đột và học được rằng không phải lúc nào cũng cần thắng.",
    details: {
      love: "Xuôi: Tranh cãi để thắng thay vì để hiểu nhau — mỗi lần cãi vã đang khiến hai người xa nhau hơn dù ai đó luôn 'thắng'. Ngược: Hòa giải sau mâu thuẫn, học cách giao tiếp tốt hơn và đặt mối quan hệ lên trên cái tôi.",
      career: "Xuôi: Cạnh tranh không lành mạnh hoặc dành chiến thắng bằng cách chơi xấu — có thể thắng ngắn hạn nhưng sẽ mất uy tín lâu dài. Ngược: Rút lui khỏi xung đột không cần thiết, tập trung vào hợp tác thay vì cạnh tranh.",
      health: "Xuôi: Căng thẳng từ xung đột liên tục đang tích tụ thành áp lực thể chất — đau đầu, huyết áp cao hoặc vấn đề tiêu hoá do stress. Ngược: Hoà giải và buông bỏ xung đột giúp cơ thể thư giãn và phục hồi.",
      spirit: "Xuôi: Cái tôi đang thắng trong cuộc chiến nhỏ này, nhưng bạn đang thua trong điều lớn hơn. Hãy hỏi: phần nào trong bạn thực sự cần phải thắng thế này? Ngược: Bạn đang học được bài học quan trọng — đôi khi thua một trận là cách duy nhất để giữ được điều thực sự quan trọng.",
      advice: "Hỏi bản thân: bạn muốn đúng hay muốn hạnh phúc?"
    },
    colors: ["#aa8888","#cc9999","#886666"],
    bg: "linear-gradient(160deg,#1a1010 0%,#2a1818 100%)"
  },
  {
    id: 55, name: "Six of Swords", nameVi: "Sáu Kiếm", suit: "swords",
    numeral: "VI", symbol: "⛵",
    upright: "Bạn đang rời bỏ giai đoạn khó khăn và tiến đến nơi bình yên hơn — chưa hoàn toàn ổn nhưng đang trên đường đúng.",
    reversed: "Bạn đang mang theo những vết thương và tư duy cũ sang giai đoạn mới — điều đó đang làm chậm quá trình lành lại.",
    details: {
      love: "Xuôi: Đang rời bỏ giai đoạn đau khổ trong tình cảm và dần đi đến vùng bình yên hơn — chưa hoàn toàn ổn nhưng đang trên đường. Ngược: Mang theo vết thương và ký ức cũ sang giai đoạn mới, khó thoát khỏi bóng của quá khứ.",
      career: "Xuôi: Thay đổi công việc hoặc môi trường để có điều kiện tốt hơn — dù khó khăn lúc đầu nhưng đây là bước đi đúng hướng. Ngược: Tình huống chưa cải thiện như mong đợi, cần thêm thời gian hoặc thay đổi cách tiếp cận.",
      health: "Xuôi: Giai đoạn phục hồi đang bắt đầu — thể chất và tinh thần đang dần thoát khỏi vùng khó khăn, tiến đến trạng thái ổn định hơn. Ngược: Vẫn còn mang nặng những thói quen hoặc tâm lý cũ cản trở quá trình hồi phục sức khoẻ.",
      spirit: "Xuôi: Bạn đang trên đường thoát khỏi giai đoạn khó — chưa đến nơi bình yên nhưng đang đi đúng hướng. Hãy tiếp tục. Ngược: Bạn chưa sẵn sàng để thực sự rời đi — vì rời đi đồng nghĩa với buông bỏ điều gì đó bạn chưa sẵn lòng buông.",
      advice: "Không phải tất cả chuyến đi đều vui vẻ — đôi khi cần rời đi để tìm thấy bình yên."
    },
    colors: ["#7788aa","#99aacc","#556688"],
    bg: "linear-gradient(160deg,#101828 0%,#202838 100%)"
  },
  {
    id: 56, name: "Seven of Swords", nameVi: "Bảy Kiếm", suit: "swords",
    numeral: "VII", symbol: "🤫",
    upright: "Có điều gì đó không minh bạch đang xảy ra xung quanh bạn, hoặc chính bạn đang né tránh đối mặt thẳng thắn với ai đó.",
    reversed: "Sự thật đang bị lộ ra — điều bị che giấu sẽ không còn ẩn được nữa. Hoặc bạn đang chọn thành thật thay vì tiếp tục né tránh.",
    details: {
      love: "Xuôi: Có điều gì đó không minh bạch trong mối quan hệ — ai đó đang né tránh đối thoại thẳng thắn, hoặc chưa nói hết sự thật. Ngược: Sự thật trong tình cảm được tiết lộ — dù đau nhưng là bước cần thiết để làm lành hoặc chấm dứt.",
      career: "Xuôi: Chiến lược thông minh và hành động độc lập có thể hiệu quả, nhưng cần cẩn thận không vượt ranh giới đạo đức. Ngược: Chiến thuật không lành mạnh bị phát hiện, cần trở lại con đường trung thực.",
      health: "Xuôi: Có thể đang che giấu vấn đề sức khoẻ với người thân hoặc tự mình phủ nhận tình trạng — điều này có thể làm trầm trọng thêm. Ngược: Quyết định chia sẻ và tìm kiếm sự hỗ trợ cho vấn đề sức khoẻ thay vì một mình đối mặt.",
      spirit: "Xuôi: Bạn đang tự dối mình về điều gì đó — nói với bản thân rằng mọi thứ ổn trong khi thực ra biết là không. Ngược: Bạn đang chọn nhìn thẳng vào sự thật về bản thân — dù khó, đó là bước quan trọng nhất.",
      advice: "Sự thật luôn tìm được đường ra — tốt hơn là bạn chọn nói thật từ đầu."
    },
    colors: ["#888899","#aaaabb","#666677"],
    bg: "linear-gradient(160deg,#141420 0%,#202030 100%)"
  },
  {
    id: 57, name: "Eight of Swords", nameVi: "Tám Kiếm", suit: "swords",
    numeral: "VIII", symbol: "🙏",
    upright: "Bạn đang cảm thấy bị kẹt — nhưng những giới hạn đó phần lớn do chính bạn tạo ra. Bước đầu tiên là nhận ra điều đó.",
    reversed: "Bạn đang bắt đầu nhận ra mình có nhiều lựa chọn hơn tưởng — và điều đó thay đổi mọi thứ.",
    details: {
      love: "Xuôi: Cảm thấy bị mắc kẹt trong mối quan hệ nhưng thực ra sợ thay đổi hơn là không có lối thoát — cần xem xét lại niềm tin về bản thân trong tình yêu. Ngược: Nhận ra mình có lựa chọn trong tình cảm và đang dũng cảm bước ra khỏi vòng lặp cũ.",
      career: "Xuôi: Tin rằng không thể đổi việc hay thăng tiến — nhưng đây là giới hạn do chính mình tạo ra, không phải thực tế. Ngược: Thoát khỏi tư duy hạn chế về sự nghiệp, bắt đầu thấy các cơ hội mình từng bỏ qua.",
      health: "Xuôi: Lo âu và suy nghĩ tiêu cực đang giam cầm cơ thể — căng thẳng mãn tính, đau cơ hoặc cảm giác mệt mỏi không rõ nguyên nhân. Ngược: Phá vỡ chu kỳ lo âu và nhận ra rằng thay đổi tư duy có thể cải thiện sức khoẻ đáng kể.",
      spirit: "Xuôi: Bạn đang bị nhốt trong những niềm tin cũ về bản thân — rằng mình không đủ giỏi, không đủ tốt, không thể thay đổi. Nhưng những niềm tin đó không phải sự thật. Ngược: Bạn đang phá vỡ một niềm tin cũ đã giữ bạn lại — đó là một trong những điều dũng cảm nhất có thể làm.",
      advice: "Chiếc dây trói bạn được dệt từ suy nghĩ của chính bạn — bước đi một bước về phía trước và bạn sẽ thấy."
    },
    colors: ["#777799","#9999bb","#555577"],
    bg: "linear-gradient(160deg,#121228 0%,#1e1e3c 100%)"
  },
  {
    id: 58, name: "Nine of Swords", nameVi: "Chín Kiếm", suit: "swords",
    numeral: "IX", symbol: "😰",
    upright: "Bạn đang lo lắng rất nhiều — đầu óc chạy không ngừng, đặc biệt lúc nửa đêm. Hầu hết những gì bạn sợ sẽ không xảy ra như bạn tưởng.",
    reversed: "Giai đoạn lo âu nặng nề đang dần qua đi — bạn đang tìm lại được sự bình tĩnh và nhìn mọi thứ thực tế hơn.",
    details: {
      love: "Xuôi: Lo lắng quá mức về tình cảm — sợ bị bỏ rơi, sợ không đủ tốt, tâm trí chạy vòng vòng với những kịch bản xấu nhất lúc 3 giờ sáng. Ngược: Vượt qua nỗi lo âu trong tình yêu, tìm lại sự tin tưởng vào bản thân và đối phương.",
      career: "Xuôi: Mất ngủ vì lo công việc, lo sợ thất bại đến mức tê liệt không thể hành động hiệu quả. Ngược: Lo âu về công việc giảm bớt, nhìn nhận tình huống theo góc độ thực tế và bình tĩnh hơn.",
      health: "Xuôi: Lo âu và căng thẳng tinh thần kéo dài đang gây mất ngủ, đau đầu, tim đập nhanh — cơ thể đang mang quá nhiều gánh nặng tâm lý. Ngược: Tâm trí bắt đầu tìm thấy bình yên, giấc ngủ cải thiện và các triệu chứng liên quan đến stress giảm dần.",
      spirit: "Xuôi: Bạn đang ở giai đoạn tối nhất — lo âu, nghi ngờ bản thân, không thấy lối ra. Đây là giai đoạn sẽ qua. Hãy tìm người để nói chuyện. Ngược: Sau giai đoạn lo âu nặng nề, bạn đang tìm lại được ánh sáng — không vội, cứ từng bước nhỏ.",
      advice: "Tâm trí lúc 3 giờ sáng không nói sự thật — hầu hết những gì bạn lo sợ sẽ không xảy ra."
    },
    colors: ["#664466","#997799","#441144"],
    bg: "linear-gradient(160deg,#100810 0%,#1a1020 100%)"
  },
  {
    id: 59, name: "Ten of Swords", nameVi: "Mười Kiếm", suit: "swords",
    numeral: "X", symbol: "🌅",
    upright: "Bạn đang ở điểm thấp nhất — đau đớn, mệt mỏi, có thể bị phản bội. Nhưng đây là điểm cuối, không phải điểm giữa. Từ đây chỉ có thể đi lên.",
    reversed: "Bạn vừa thoát được khỏi tình huống tệ nhất, hoặc đang kéo dài đau khổ không cần thiết vì chưa chịu buông bỏ.",
    details: {
      love: "Xuôi: Kết thúc mối quan hệ đau đớn và dứt khoát — dù đau nhưng đây là điểm cuối cùng, không phải điểm giữa. Phía đông đang sáng lên ở chân trời. Ngược: Thoát được khỏi đổ vỡ hoàn toàn, hoặc đang mắc kẹt trong mối quan hệ đã chết không chịu buông bỏ.",
      career: "Xuôi: Thất bại nặng nề, mất việc hoặc dự án sụp đổ — đây là điểm thấp nhất, chỉ có thể đi lên từ đây. Ngược: Thoát khỏi tình huống xấu trước khi quá muộn, hoặc đang kéo dài sự kết thúc không thể tránh.",
      health: "Xuôi: Đang ở điểm thấp nhất về sức khoẻ — nhưng đây cũng là điểm chuyển hướng. Cần tìm kiếm hỗ trợ y tế và không một mình đối mặt. Ngược: Vượt qua được giai đoạn sức khoẻ khủng hoảng, bắt đầu hồi phục — tệ nhất đã qua.",
      spirit: "Xuôi: Phần cũ của bạn đang kết thúc — đau thật, nhưng chính sự kết thúc đó sẽ dọn đường cho điều mới. Ngược: Bạn đang kéo dài nỗi đau không cần thiết vì chưa sẵn sàng buông tay.",
      advice: "Khi bạn đã chạm đáy, con đường duy nhất là đi lên — phía đông đang bắt đầu sáng."
    },
    colors: ["#555566","#888899","#333344"],
    bg: "linear-gradient(160deg,#0a0a15 0%,#151525 100%)"
  },
  {
    id: 60, name: "Page of Swords", nameVi: "Cậu Bé Kiếm", suit: "swords",
    numeral: "Pg", symbol: "📢",
    upright: "Bạn đang tò mò và sắc bén — đây là lúc tốt để tìm hiểu, đặt câu hỏi, và thu thập thông tin trước khi quyết định.",
    reversed: "Cẩn thận với thông tin bạn đang nhận được — có thể sai hoặc thiếu. Hoặc bạn đang hành động quá vội mà không kiểm tra kỹ.",
    details: {
      love: "Xuôi: Giao tiếp thẳng thắn và trực tiếp trong tình cảm — có thể có tin tức liên quan đến mối quan hệ sắp đến. Ngược: Ngồi lê đôi mách hoặc truyền thông tin sai trong tình cảm gây hiểu lầm không đáng.",
      career: "Xuôi: Nhanh nhẹn trong việc thu thập thông tin và phân tích tình huống, tư duy sắc bén giúp xử lý vấn đề tốt. Ngược: Hành động mà không suy nghĩ đủ kỹ, dẫn đến sai lầm có thể tránh được.",
      health: "Xuôi: Chủ động tìm hiểu thông tin về sức khoẻ và đặt câu hỏi cho bác sĩ — kiến thức giúp đưa ra quyết định tốt hơn. Ngược: Đọc quá nhiều thông tin sức khoẻ không chính xác trên mạng gây lo lắng không cần thiết.",
      spirit: "Xuôi: Bạn đang đặt câu hỏi về những thứ bạn từng xem là hiển nhiên — đó là điều tốt. Sự tò mò là khởi đầu của sự hiểu biết thực sự. Ngược: Bạn đang hoài nghi mọi thứ đến mức không dám tin vào bất cứ điều gì — điều đó cũng là một dạng tự bảo vệ.",
      advice: "Trước khi nói, hãy hỏi: điều này có đúng không? Có cần thiết không? Có tử tế không?"
    },
    colors: ["#8899bb","#aabbdd","#667799"],
    bg: "linear-gradient(160deg,#141830 0%,#202840 100%)"
  },
  {
    id: 61, name: "Knight of Swords", nameVi: "Hiệp Sĩ Kiếm", suit: "swords",
    numeral: "Kt", symbol: "💨",
    upright: "Bạn đang hành động nhanh và quyết đoán — không ngại nói thật hoặc đối mặt với tình huống khó. Đây là sức mạnh khi có định hướng.",
    reversed: "Bạn đang quá quyết đoán đến mức tàn nhẫn — lời nói hoặc hành động đang gây tổn thương nhiều hơn cần thiết.",
    details: {
      love: "Xuôi: Thẳng thắn trong tình cảm, không ngại nói thật dù khó nghe — sự trung thực này xây dựng lòng tin vững chắc. Ngược: Quá thẳng thắn đến mức tàn nhẫn, lời nói sắc bén gây tổn thương sâu mà không cần thiết.",
      career: "Xuôi: Đưa ra quyết định nhanh chóng và tự tin khi cần, không để cơ hội trôi qua vì do dự. Ngược: Hành động quá vội vàng mà không suy xét hậu quả, cần dừng lại và đánh giá kỹ hơn.",
      health: "Xuôi: Năng lượng dồi dào và tinh thần chiến đấu mạnh mẽ giúp đối mặt với thách thức sức khoẻ dứt khoát. Ngược: Hành động quá mạnh và nhanh — ví dụ tập thể dục quá sức hay chế độ ăn kiêng cực đoan — dễ gây chấn thương hoặc kiệt sức.",
      spirit: "Xuôi: Bạn đang quyết tâm và không để bất cứ thứ gì cản bước — điều đó rất tốt khi bạn đang đi đúng hướng. Ngược: Bạn đang cứng nhắc và áp đặt quan điểm của mình lên người khác — mọi người có con đường riêng của họ.",
      advice: "Tốc độ và quyết tâm là quý — nhưng hãy nhớ kiểm tra hướng đi trước khi phóng."
    },
    colors: ["#7788cc","#99aaee","#5566aa"],
    bg: "linear-gradient(160deg,#101830 0%,#1a2848 100%)"
  },
  {
    id: 62, name: "Queen of Swords", nameVi: "Nữ Hoàng Kiếm", suit: "swords",
    numeral: "Q", symbol: "🗡",
    upright: "Bạn đang suy nghĩ rõ ràng và độc lập — không cần ai xác nhận để biết điều gì đúng với mình. Sự thẳng thắn của bạn là sức mạnh.",
    reversed: "Bạn đang quá lạnh lùng hoặc đang dùng lời nói để làm đau người khác thay vì để giao tiếp thực sự.",
    details: {
      love: "Xuôi: Độc lập và trưởng thành trong tình cảm — không cần ai phê duyệt sự lựa chọn của mình, yêu từ vị trí mạnh chứ không phải từ thiếu thốn. Ngược: Quá lạnh lùng hoặc dùng lời nói sắc bén như vũ khí gây tổn thương cho người thân yêu.",
      career: "Xuôi: Quyết định dựa trên lý trí rõ ràng không bị ảnh hưởng bởi cảm xúc — đây là thế mạnh lớn trong môi trường cạnh tranh. Ngược: Cứng nhắc và lạnh lùng với đồng nghiệp tạo ra môi trường làm việc khó chịu.",
      health: "Xuôi: Trí tuệ và kinh nghiệm từ đau khổ giúp đưa ra quyết định sức khoẻ sáng suốt — biết rõ giới hạn và không để người khác áp đặt. Ngược: Cay đắng và căng thẳng mãn tính từ việc giữ quá nhiều thứ một mình ảnh hưởng đến sức khoẻ tim mạch.",
      spirit: "Xuôi: Bạn đã trải qua nhiều và học được nhiều từ đó — sự thẳng thắn và rõ ràng của bạn đến từ kinh nghiệm thật. Ngược: Bạn đang mang theo sự cay đắng từ quá khứ và nó đang khiến bạn khép kín với những điều tốt đẹp mới.",
      advice: "Sự thật không cần phải tàn nhẫn — hãy nói thẳng nhưng với tình thương."
    },
    colors: ["#6677bb","#8899dd","#445599"],
    bg: "linear-gradient(160deg,#0f1428 0%,#1a2040 100%)"
  },
  {
    id: 63, name: "King of Swords", nameVi: "Vua Kiếm", suit: "swords",
    numeral: "K", symbol: "👑",
    upright: "Bạn đang tư duy rõ ràng và công bằng — dùng lý trí để đưa ra quyết định đúng đắn, không bị cảm xúc làm mờ.",
    reversed: "Bạn đang dùng trí thông minh để kiểm soát hoặc thao túng thay vì để giúp ích — hoặc quá lạnh lùng đến mức không còn kết nối được với người xung quanh.",
    details: {
      love: "Xuôi: Lý trí trong tình cảm — quyết định rõ ràng, giao tiếp thẳng thắn và có nguyên tắc trong mối quan hệ. Ngược: Quá lạnh lùng và lý trí, bỏ qua hoàn toàn chiều cảm xúc khiến người kia cảm thấy không được trân trọng.",
      career: "Xuôi: Lãnh đạo bằng trí tuệ và nguyên tắc — quyết định công bằng và có cơ sở, được tôn trọng trong chuyên môn. Ngược: Dùng quyền lực và trí tuệ để kiểm soát hoặc thao túng người khác phục vụ mục đích cá nhân.",
      health: "Xuôi: Tiếp cận sức khoẻ theo cách có hệ thống và khoa học — tìm hiểu kỹ trước khi quyết định điều trị, không để cảm xúc cản trở. Ngược: Cứng nhắc từ chối thay đổi thói quen dù bằng chứng khoa học rõ ràng, hoặc áp đặt quan điểm sức khoẻ lên người khác.",
      spirit: "Xuôi: Bạn đang dùng sự suy nghĩ rõ ràng để hiểu sâu hơn về bản thân và cuộc sống — không chấp nhận những gì không có cơ sở. Ngược: Sự phân tích quá nhiều đang ngăn bạn thực sự trải nghiệm — đôi khi cần tắt đầu và chỉ cảm nhận.",
      advice: "Trí tuệ phục vụ con người — hãy dùng sức mạnh tư duy để giúp đỡ, không chỉ để thắng."
    },
    colors: ["#5566aa","#7788cc","#334488"],
    bg: "linear-gradient(160deg,#0d1225 0%,#182038 100%)"
  },
  {
    id: 64, name: "Ace of Pentacles", nameVi: "Át Xu", suit: "pentacles",
    numeral: "A", symbol: "🌱",
    upright: "Có cơ hội vật chất mới đang xuất hiện — công việc, hợp đồng, hay một khởi đầu tài chính tốt. Hãy nắm bắt và xây dựng cẩn thận.",
    reversed: "Cơ hội tài chính bị bỏ lỡ do do dự, hoặc kế hoạch thiếu nền tảng thực tế cần xem xét lại.",
    details: {
      love: "Xuôi: Mối quan hệ đang xây dựng nền tảng thực tế vững chắc — kế hoạch chung, ổn định tài chính cùng nhau, hướng đến tương lai bền vững. Ngược: Vật chất hoá tình cảm, hoặc thiếu an toàn tài chính đang tạo ra căng thẳng trong mối quan hệ.",
      career: "Xuôi: Cơ hội việc làm tốt, hợp đồng mới hoặc đầu tư khởi đầu rất có triển vọng — đây là lúc nắm bắt và xây dựng. Ngược: Cơ hội tài chính bị bỏ lỡ do chần chừ, hoặc kế hoạch kinh doanh thiếu thực tế cần xem xét lại.",
      health: "Xuôi: Thời điểm tốt để đầu tư vào sức khoẻ — bắt đầu thói quen tập luyện mới, chế độ ăn uống cân bằng hoặc kiểm tra sức khoẻ định kỳ. Ngược: Bỏ qua cơ hội cải thiện sức khoẻ vì thiếu thời gian hay chi phí, cần sắp xếp lại ưu tiên.",
      spirit: "Xuôi: Bạn đang biến những gì bạn tin vào thành hành động cụ thể trong cuộc sống hàng ngày — đó mới là điều thực sự có giá trị. Ngược: Bạn đang nghĩ nhiều nhưng làm ít — ý tưởng không áp dụng vào thực tế thì chỉ là mơ.",
      advice: "Cơ hội vật chất này thực — hãy nắm bắt và xây dựng cẩn thận từ nền móng."
    },
    colors: ["#44aa44","#88cc88","#226622"],
    bg: "linear-gradient(160deg,#0a2a0a 0%,#1a4a1a 100%)"
  },
  {
    id: 65, name: "Two of Pentacles", nameVi: "Hai Xu", suit: "pentacles",
    numeral: "II", symbol: "⚖",
    upright: "Bạn đang xử lý nhiều thứ cùng lúc — hãy tiếp tục linh hoạt nhưng chú ý đừng để thứ gì quan trọng bị bỏ rơi.",
    reversed: "Bạn đang ôm quá nhiều thứ và bắt đầu mất kiểm soát — cần sắp xếp lại ưu tiên ngay.",
    details: {
      love: "Xuôi: Cân bằng tốt giữa tình cảm và các ưu tiên khác trong cuộc sống — cả hai đều cảm thấy được chú ý và trân trọng. Ngược: Một bên cảm thấy bị bỏ bê vì bạn đang xử lý quá nhiều thứ cùng lúc và không đủ năng lượng.",
      career: "Xuôi: Đang xử lý nhiều dự án cùng lúc thành công, biết linh hoạt thích nghi khi tình huống thay đổi. Ngược: Quá tải công việc dẫn đến chất lượng giảm sút, cần sắp xếp lại ưu tiên ngay.",
      health: "Xuôi: Giữ được cân bằng giữa công việc và nghỉ ngơi, hệ thần kinh không bị quá tải — đây là nền tảng tốt cho sức khoẻ lâu dài. Ngược: Tung hứng quá nhiều thứ cùng lúc dẫn đến kiệt sức — cơ thể đang phát tín hiệu cần dừng lại.",
      spirit: "Xuôi: Bạn đang cân bằng được nhiều thứ khác nhau mà không bị kiệt sức — điều đó cần kỹ năng. Ngược: Mọi thứ đang nghiêng về một phía quá nhiều — cần điều chỉnh trước khi mất kiểm soát.",
      advice: "Cuộc sống là hành động nhào lộn — nhưng hãy biết mình đang tung mấy quả bóng cùng lúc."
    },
    colors: ["#55bb55","#99dd99","#338833"],
    bg: "linear-gradient(160deg,#0a2a0a 0%,#1a3a1a 100%)"
  },
  {
    id: 66, name: "Three of Pentacles", nameVi: "Ba Xu", suit: "pentacles",
    numeral: "III", symbol: "🏗",
    upright: "Làm việc cùng người khác đang cho kết quả tốt hơn làm một mình — mỗi người đóng góp điểm mạnh và cùng xây điều lớn hơn.",
    reversed: "Xung đột nhóm hoặc cái tôi cá nhân đang cản trở sự hợp tác — hoặc tài năng của bạn không được ghi nhận đúng mức.",
    details: {
      love: "Xuôi: Hai người đang xây dựng cuộc sống cùng nhau với kế hoạch cụ thể và hợp tác hiệu quả — mỗi người đóng góp điểm mạnh riêng. Ngược: Không tìm được tiếng nói chung trong việc xây dựng mối quan hệ, ai cũng muốn theo cách của mình.",
      career: "Xuôi: Làm việc nhóm hiệu quả cao, mỗi người đóng góp điểm mạnh và kết quả vượt trội hơn làm một mình. Ngược: Xung đột nhóm do ego cá nhân, hoặc tài năng không được công nhận đúng mức gây nản lòng.",
      health: "Xuôi: Hợp tác với chuyên gia sức khoẻ — bác sĩ, huấn luyện viên, chuyên gia dinh dưỡng — mang lại kết quả tốt hơn tự mình mò mẫm. Ngược: Không chịu nhận hỗ trợ từ chuyên gia hoặc người xung quanh, tự ép bản thân quá sức.",
      spirit: "Xuôi: Bạn học được nhiều hơn khi chia sẻ và học hỏi cùng người khác — một mình khó phát triển bằng. Ngược: Bạn đang cô lập hoặc không chịu nhận hướng dẫn — đôi khi cần người có kinh nghiệm hơn để chỉ ra điều mình chưa thấy.",
      advice: "Bạn có thể đi nhanh một mình, nhưng cùng nhau bạn sẽ đi được xa hơn."
    },
    colors: ["#66cc66","#99dd99","#448844"],
    bg: "linear-gradient(160deg,#0a2a0a 0%,#1a4a20 100%)"
  },
  {
    id: 67, name: "Four of Pentacles", nameVi: "Bốn Xu", suit: "pentacles",
    numeral: "IV", symbol: "🤲",
    upright: "Bạn đang bảo vệ những gì mình có — điều đó tốt, nhưng hãy chú ý không ôm giữ quá chặt đến mức ngăn cản sự phát triển.",
    reversed: "Bạn đang buông lỏng kiểm soát — hoặc học cách hào phóng hơn, hoặc mất kiểm soát tài chính theo cách không tốt.",
    details: {
      love: "Xuôi: Đang kiểm soát mối quan hệ quá chặt vì sợ mất — ghen tuông, kiểm tra, hoặc không cho người kia không gian riêng. Ngược: Học cách buông lỏng kiểm soát và tin tưởng đối phương hơn.",
      career: "Xuôi: Quản lý tài chính và tài nguyên cẩn thận, tiết kiệm có kế hoạch — nhưng cần tránh keo kiệt cản trở tăng trưởng. Ngược: Mất kiểm soát tài chính hoặc đột ngột tiêu xài nhiều sau giai đoạn thắt chặt.",
      health: "Xuôi: Cẩn thận trong chăm sóc sức khoẻ là tốt, nhưng lo lắng thái quá về sức khoẻ có thể gây căng thẳng không cần thiết. Ngược: Buông lỏng sự lo lắng thái quá về sức khoẻ, tin tưởng vào khả năng tự phục hồi của cơ thể.",
      spirit: "Xuôi: Bạn đang bám chặt vào những thứ quen thuộc vì sợ mất đi — kể cả những niềm tin cũ không còn đúng nữa. Ngược: Bạn đang học cách buông tay khỏi những thứ không còn phù hợp — điều đó cần dũng cảm.",
      advice: "An toàn là tốt — nhưng ôm giữ quá chặt sẽ ngăn mọi thứ tốt đẹp chảy vào cuộc sống bạn."
    },
    colors: ["#44aa44","#77cc77","#227722"],
    bg: "linear-gradient(160deg,#0a2000 0%,#153000 100%)"
  },
  {
    id: 68, name: "Five of Pentacles", nameVi: "Năm Xu", suit: "pentacles",
    numeral: "V", symbol: "❄",
    upright: "Bạn đang trải qua giai đoạn khó khăn — tài chính, cô đơn, hoặc cảm thấy bị bỏ rơi. Đừng ngại xin giúp đỡ.",
    reversed: "Tình hình đang bắt đầu cải thiện — bạn nhận được hỗ trợ hoặc có cơ hội mới xuất hiện.",
    details: {
      love: "Xuôi: Cảm thấy cô đơn hoặc bị bỏ rơi trong tình cảm dù có người bên cạnh — thiếu thốn kết nối cảm xúc và sự ấm áp thực sự. Ngược: Tìm được sự ấm áp và kết nối sau giai đoạn cô đơn, mối quan hệ bắt đầu hồi sinh.",
      career: "Xuôi: Đang trải qua khó khăn tài chính hoặc mất việc — giai đoạn khắc nghiệt về vật chất cần được đối mặt thực tế. Ngược: Tình hình tài chính bắt đầu cải thiện, nhận được hỗ trợ từ người xung quanh hoặc cơ hội mới.",
      health: "Xuôi: Khó khăn vật chất ảnh hưởng đến khả năng chăm sóc sức khoẻ — stress tài chính làm suy yếu hệ miễn dịch và sức đề kháng. Ngược: Điều kiện cải thiện giúp có thể đầu tư trở lại vào sức khoẻ — đừng bỏ bê cơ thể thêm nữa.",
      spirit: "Xuôi: Bạn đang cảm thấy một mình và không có ai giúp — nhưng thực ra sự hỗ trợ gần hơn bạn nghĩ. Hãy dũng cảm gõ cửa. Ngược: Bạn đang nhận ra rằng không phải một mình — có người sẵn sàng giúp nếu bạn mở lòng.",
      advice: "Ánh sáng đang chiếu từ bên trong cửa sổ đó — đừng sợ gõ cửa và xin giúp đỡ."
    },
    colors: ["#336633","#557755","#224422"],
    bg: "linear-gradient(160deg,#081508 0%,#102010 100%)"
  },
  {
    id: 69, name: "Six of Pentacles", nameVi: "Sáu Xu", suit: "pentacles",
    numeral: "VI", symbol: "🤝",
    upright: "Sự cho và nhận đang cân bằng — bạn đang chia sẻ những gì mình có, hoặc đang nhận được sự giúp đỡ xứng đáng.",
    reversed: "Có sự mất cân bằng trong việc cho và nhận — một bên đang cho để kiểm soát, hoặc nhận mà không đáp lại tương xứng.",
    details: {
      love: "Xuôi: Cho và nhận cân bằng trong tình cảm — cả hai đều cảm thấy được hỗ trợ và trân trọng, không ai là người luôn cho hoặc luôn nhận. Ngược: Mất cân bằng rõ ràng trong mối quan hệ — một bên quá cho còn một bên nhận mà không đáp lại.",
      career: "Xuôi: Được trả công xứng đáng với công sức bỏ ra, và cũng sẵn sàng chia sẻ thành công với đội nhóm. Ngược: Cảm thấy không được đền bù xứng đáng, hoặc người khác nhận lợi mà không đóng góp tương xứng.",
      health: "Xuôi: Cho đi và nhận sự chăm sóc một cách cân bằng — biết nhận giúp đỡ khi cần và cũng hỗ trợ người khác trong khả năng. Ngược: Cho đi quá nhiều đến kiệt sức mà không chịu nhận lại — cần học cách chấp nhận sự giúp đỡ.",
      spirit: "Xuôi: Bạn đang cho đi vì thực sự muốn, không phải để được ghi nhận hay để kiểm soát người nhận — đó là hào phóng thật sự. Ngược: Bạn đang cho đi để nhận lại thứ gì đó — sự công nhận, lòng biết ơn, hoặc quyền lực. Hãy kiểm tra lại động cơ.",
      advice: "Hào phóng thực sự không tính toán — hãy cho đi những gì bạn có dư mà không mong đợi gì lại."
    },
    colors: ["#55bb55","#88ee88","#338833"],
    bg: "linear-gradient(160deg,#0a2a0a 0%,#1a4a25 100%)"
  },
  {
    id: 70, name: "Seven of Pentacles", nameVi: "Bảy Xu", suit: "pentacles",
    numeral: "VII", symbol: "🌿",
    upright: "Bạn đang ở giữa chặng đường — kết quả chưa đến nhưng bạn đã làm đúng. Hãy dừng lại đánh giá và kiên nhẫn tiếp tục.",
    reversed: "Bạn đang nôn nóng kết quả hoặc đầu tư mà không thấy lợi ích — cần xem lại chiến lược hoặc kiên nhẫn thêm.",
    details: {
      love: "Xuôi: Mối quan hệ đang phát triển chậm nhưng chắc — đây không phải lúc ép tiến độ mà là kiên nhẫn vun đắp mỗi ngày. Ngược: Đang nôn nóng kết quả hoặc cảm thấy đầu tư cảm xúc nhiều mà không nhận lại tương xứng.",
      career: "Xuôi: Dự án dài hạn đang tiến triển tốt — cần dừng lại đánh giá và kiên nhẫn đợi kết quả thay vì vội vàng. Ngược: Nỗ lực không được đền đáp như mong đợi, cần xem xét lại chiến lược hoặc hướng đi.",
      health: "Xuôi: Thói quen sức khoẻ cần thời gian để thấy kết quả — hãy kiên nhẫn với cơ thể và tin vào quá trình. Ngược: Thiếu kiên nhẫn bỏ giữa chừng các kế hoạch sức khoẻ, hoặc kết quả chậm hơn mong đợi cần điều chỉnh.",
      spirit: "Xuôi: Bạn đang tiến bộ hơn bạn nghĩ — đôi khi cần dừng lại và nhìn lại con đường đã đi để thấy mình đã đến đâu. Ngược: Bạn đang nôn nóng và cảm thấy thất vọng vì mọi thứ chưa thay đổi nhanh như muốn — hãy kiên nhẫn hơn với quá trình.",
      advice: "Cây ổi cần thời gian mới ra quả — hãy tin vào quá trình và tiếp tục chăm bón."
    },
    colors: ["#44aa55","#77cc88","#226633"],
    bg: "linear-gradient(160deg,#0a2a0f 0%,#153a1a 100%)"
  },
  {
    id: 71, name: "Eight of Pentacles", nameVi: "Tám Xu", suit: "pentacles",
    numeral: "VIII", symbol: "🔨",
    upright: "Bạn đang chăm chỉ rèn luyện kỹ năng — sự tập trung và luyện tập nhất quán này sẽ tạo ra sự khác biệt.",
    reversed: "Bạn đang làm việc qua loa hoặc thiếu mục tiêu rõ ràng — kết quả sẽ phản ánh điều đó.",
    details: {
      love: "Xuôi: Đang chủ động đầu tư thời gian và nỗ lực để trở thành người bạn đời tốt hơn — học cách giao tiếp, lắng nghe và thể hiện tình cảm. Ngược: Bỏ bê mối quan hệ, không nỗ lực cải thiện hoặc cứ nghĩ tình yêu phải tự nhiên mà không cần vun đắp.",
      career: "Xuôi: Tập trung học hỏi và rèn luyện kỹ năng không ngừng — sự xuất sắc đến từ luyện tập kiên trì chứ không từ tài năng thiên bẩm. Ngược: Làm việc qua loa, thiếu chú tâm vào chất lượng hoặc học mà không có mục tiêu rõ ràng.",
      health: "Xuôi: Xây dựng thói quen sức khoẻ đều đặn và kiên trì — tập thể dục có kỷ luật, ăn uống nhất quán, ngủ đủ giấc. Ngược: Thiếu kỷ luật trong chăm sóc sức khoẻ — bắt đầu nhiều thứ nhưng không duy trì đủ lâu để thấy kết quả.",
      spirit: "Xuôi: Bạn đang thực hành đều đặn mỗi ngày — không cần hoành tráng, chỉ cần nhất quán. Đó là cách duy nhất tạo ra thay đổi thực sự. Ngược: Bạn đang không nhất quán — bắt đầu nhiều thứ nhưng không đủ kiên nhẫn để thấy kết quả.",
      advice: "10,000 giờ — sự thành thạo không đến qua tài năng, nó đến qua nỗ lực nhất quán."
    },
    colors: ["#55aa44","#88cc77","#336622"],
    bg: "linear-gradient(160deg,#0f2a0a 0%,#1a3a15 100%)"
  },
  {
    id: 72, name: "Nine of Pentacles", nameVi: "Chín Xu", suit: "pentacles",
    numeral: "IX", symbol: "🦅",
    upright: "Bạn đang tự đứng vững trên đôi chân của mình — thành quả hiện tại là kết quả của nỗ lực thực sự. Hãy tận hưởng mà không cảm thấy có lỗi.",
    reversed: "Bạn đang phụ thuộc vào người khác về tài chính hoặc đang đi con đường không phù hợp để đạt được thứ mình muốn.",
    details: {
      love: "Xuôi: Yêu từ vị trí tự đủ đầy — không yêu vì cần ai đó lấp đầy khoảng trống, mà yêu vì chọn chia sẻ cuộc sống với người xứng đáng. Ngược: Phụ thuộc về tài chính vào người kia tạo ra sự mất cân bằng quyền lực trong mối quan hệ.",
      career: "Xuôi: Thành công thực sự nhờ nỗ lực của chính mình — được hưởng thụ xứng đáng và không cần ai công nhận. Ngược: Thành công bằng con đường không đúng đắn hoặc nhờ người khác mà không xây dựng được năng lực thực.",
      health: "Xuôi: Tự chăm sóc bản thân tốt — dành thời gian và nguồn lực cho sức khoẻ không phải là xa xỉ mà là đầu tư cần thiết. Ngược: Bỏ bê sức khoẻ vì quá tập trung vào việc kiếm tiền hoặc duy trì hình ảnh bề ngoài.",
      spirit: "Xuôi: Bạn đang cảm thấy đủ đầy từ bên trong — không cần ai xác nhận giá trị của mình. Đó là sự tự do thực sự. Ngược: Bạn đang dùng thành công bên ngoài để chứng minh giá trị của mình với người khác — nhưng thực ra vẫn đang tìm kiếm sự chấp thuận.",
      advice: "Sự thịnh vượng thực sự bắt đầu từ bên trong — khi bạn tự cảm thấy đủ, thế giới sẽ phản chiếu điều đó."
    },
    colors: ["#66cc55","#99ee88","#44aa33"],
    bg: "linear-gradient(160deg,#0a2a0a 0%,#1a4a10 100%)"
  },
  {
    id: 73, name: "Ten of Pentacles", nameVi: "Mười Xu", suit: "pentacles",
    numeral: "X", symbol: "🏠",
    upright: "Bạn đang xây dựng điều gì đó bền vững — không chỉ cho hiện tại mà còn cho tương lai. Đây là giai đoạn ổn định thực sự.",
    reversed: "Có xung đột gia đình về tài chính hoặc di sản, hoặc nền tảng bạn đang xây dựng chưa đủ vững.",
    details: {
      love: "Xuôi: Mối quan hệ đang xây dựng di sản chung — hôn nhân, gia đình, nhà cửa — những thứ bền vững theo thời gian và gắn kết nhiều thế hệ. Ngược: Xung đột gia đình chưa được giải quyết hoặc áp lực từ gia đình đang ảnh hưởng tiêu cực đến mối quan hệ.",
      career: "Xuôi: Sự nghiệp vững chắc lâu dài, có thể xây dựng được doanh nghiệp hoặc di sản nghề nghiệp đáng tự hào. Ngược: Tranh chấp tài chính gia đình hoặc vấn đề thừa kế cần được giải quyết minh bạch.",
      health: "Xuôi: Nền tảng gia đình ổn định và an toàn tạo ra môi trường sức khoẻ tốt lâu dài — yếu tố di truyền cần được chú ý phòng ngừa. Ngược: Căng thẳng từ mâu thuẫn gia đình ảnh hưởng nghiêm trọng đến sức khoẻ tinh thần và thể chất.",
      spirit: "Xuôi: Những gì bạn xây dựng hôm nay sẽ còn ý nghĩa lâu dài — cả với gia đình và những người đến sau. Hãy xây dựng với sự trân trọng đó. Ngược: Có điều gì đó trong nền tảng gia đình cần được giải quyết — đôi khi phá vỡ khuôn mẫu cũ là cần thiết, nhưng hãy làm với sự tôn trọng.",
      advice: "Những gì bạn xây dựng hôm nay sẽ trở thành di sản cho mai sau — hãy xây với sự trân trọng."
    },
    colors: ["#55cc44","#88ee77","#33aa22"],
    bg: "linear-gradient(160deg,#0a2a05 0%,#1a4a10 100%)"
  },
  {
    id: 74, name: "Page of Pentacles", nameVi: "Cậu Bé Xu", suit: "pentacles",
    numeral: "Pg", symbol: "📚",
    upright: "Bạn đang học hỏi và xây dựng nền tảng cho tương lai — kiên nhẫn và cẩn thận từng bước nhỏ.",
    reversed: "Bạn đang học nhiều nhưng không áp dụng được vào thực tế, hoặc đang trì hoãn việc bắt đầu.",
    details: {
      love: "Xuôi: Tiếp cận tình cảm cẩn thận và từ từ — đang học cách trở thành người bạn đời tốt hơn, chú ý từng chi tiết nhỏ. Ngược: Quá thực tế hoặc vật chất trong tình cảm, bỏ qua chiều cảm xúc quan trọng.",
      career: "Xuôi: Học nghề, thực tập hoặc nghiên cứu thực tế — đang xây dựng nền tảng vững chắc cho sự nghiệp tương lai. Ngược: Học lý thuyết nhưng không áp dụng được vào thực tế, cần tìm cơ hội trải nghiệm thực chiến.",
      health: "Xuôi: Tiếp cận sức khoẻ với sự học hỏi cẩn thận — tìm hiểu thông tin từ nguồn uy tín và bắt đầu thói quen mới từng bước nhỏ. Ngược: Biết điều cần làm nhưng chưa thực sự hành động — cần tìm cách vượt qua trì hoãn.",
      spirit: "Xuôi: Bạn đang tiếp cận mọi thứ với sự cởi mở và khiêm tốn — không ngại hỏi khi không biết. Đó là cách học nhanh nhất. Ngược: Bạn biết nhiều lý thuyết nhưng chưa thực hành — kiến thức không được áp dụng sẽ không có giá trị thực.",
      advice: "Kiến thức không áp dụng chỉ là thông tin — hãy biến những gì học được thành hành động cụ thể."
    },
    colors: ["#44bb44","#77dd77","#228822"],
    bg: "linear-gradient(160deg,#0a2a0a 0%,#1a4020 100%)"
  },
  {
    id: 75, name: "Knight of Pentacles", nameVi: "Hiệp Sĩ Xu", suit: "pentacles",
    numeral: "Kt", symbol: "🐎",
    upright: "Bạn đang tiến chậm nhưng chắc — đáng tin cậy và nhất quán. Không hào nhoáng nhưng luôn đến đích.",
    reversed: "Bạn đang cứng nhắc không chịu thay đổi dù tình hình đã khác, hoặc đang mất động lực và sa vào trì trệ.",
    details: {
      love: "Xuôi: Người bạn đời đáng tin cậy, cẩn thận và cam kết lâu dài — không hứa hào nhoáng nhưng luôn thực hiện điều đã hứa. Ngược: Cứng nhắc hoặc nhàm chán trong tình cảm, thiếu sự tự phát và lãng mạn bất ngờ.",
      career: "Xuôi: Làm việc cần cù và đáng tin cậy — luôn hoàn thành việc được giao đúng hạn và đúng chất lượng. Ngược: Cứng nhắc từ chối phương pháp mới hoặc mất động lực dẫn đến lười biếng.",
      health: "Xuôi: Tiếp cận sức khoẻ đều đặn và nhất quán — không cần thay đổi cực đoan, chỉ cần duy trì thói quen tốt mỗi ngày. Ngược: Cứng nhắc không chịu thay đổi thói quen xấu dù biết chúng đang ảnh hưởng đến sức khoẻ.",
      spirit: "Xuôi: Bạn đang nhất quán mỗi ngày với những thứ quan trọng — không cần thay đổi liên tục. Sự ổn định đó đang xây dựng thứ gì đó vững chắc. Ngược: Bạn đang bám vào cách cũ dù nó không còn hiệu quả — đôi khi cần linh hoạt thay vì cứng nhắc.",
      advice: "Rùa thắng thỏ không phải vì chậm — mà vì không bao giờ dừng lại."
    },
    colors: ["#44bb33","#77dd66","#228811"],
    bg: "linear-gradient(160deg,#0a2a05 0%,#183a10 100%)"
  },
  {
    id: 76, name: "Queen of Pentacles", nameVi: "Nữ Hoàng Xu", suit: "pentacles",
    numeral: "Q", symbol: "🌺",
    upright: "Bạn đang chăm sóc những người xung quanh và tạo ra môi trường ổn định, ấm áp — đây là dạng lãnh đạo thực tế và có giá trị.",
    reversed: "Bạn đang quá tập trung vào vật chất hoặc chăm sóc người khác đến mức bỏ bê chính mình.",
    details: {
      love: "Xuôi: Ấm áp, nuôi dưỡng và thực tế trong tình cảm — tạo ra mái ấm ổn định nơi người kia cảm thấy được chăm sóc và an toàn. Ngược: Quá chú tâm vào vật chất và sắp xếp nhà cửa mà bỏ bê chiều cảm xúc trong quan hệ.",
      career: "Xuôi: Quản lý tài chính và tài nguyên khéo léo, tạo môi trường làm việc ổn định và nuôi dưỡng sự phát triển. Ngược: Quá chú tâm vào tiền bạc và hiệu quả mà bỏ qua các giá trị con người và mối quan hệ.",
      health: "Xuôi: Chăm sóc sức khoẻ bản thân và người thân một cách thực tế — ăn uống lành mạnh, môi trường sống trong lành, chú ý đến cơ thể. Ngược: Bỏ bê bản thân vì quá bận chăm lo cho người khác — đây là lúc cần đặt oxy mask lên mình trước.",
      spirit: "Xuôi: Bạn đang tìm thấy ý nghĩa trong những việc bình thường mỗi ngày — nấu ăn, chăm sóc, dọn dẹp. Đó là cách sống có chiều sâu. Ngược: Bạn đang quá bận với trách nhiệm vật chất đến mức mất kết nối với bản thân — cần dành thời gian cho mình.",
      advice: "Sự phong phú thực sự bao gồm cả sức khỏe, gia đình và kết nối — không chỉ tài khoản ngân hàng."
    },
    colors: ["#55cc44","#88ee77","#33aa22"],
    bg: "linear-gradient(160deg,#0a2a08 0%,#1a4018 100%)"
  },
  {
    id: 77, name: "King of Pentacles", nameVi: "Vua Xu", suit: "pentacles",
    numeral: "K", symbol: "👑",
    upright: "Bạn đã xây dựng được thành công thực sự qua nỗ lực lâu dài — đáng tin cậy, thực tế, và có kết quả cụ thể để chứng minh.",
    reversed: "Bạn đang đặt tài chính và vật chất lên trên mọi thứ khác — kể cả những người quan trọng với bạn.",
    details: {
      love: "Xuôi: Người bạn đời ổn định và đáng tin cậy — cung cấp nền tảng vững chắc cho gia đình và chứng minh tình yêu qua hành động cụ thể hơn lời nói. Ngược: Đặt tài chính và công việc lên trên tình cảm, hoặc dùng của cải để kiểm soát người thân.",
      career: "Xuôi: Đỉnh cao thành công kinh doanh — lãnh đạo thực tế với kết quả cụ thể và uy tín được xây dựng qua thời gian dài. Ngược: Tham lam và thiếu đạo đức trong kinh doanh, đặt lợi nhuận lên trên mọi thứ khác.",
      health: "Xuôi: Dùng thành công vật chất để đầu tư vào sức khoẻ tốt nhất có thể — không tiếc nguồn lực cho việc chăm sóc bản thân lâu dài. Ngược: Bị cuốn vào việc tích luỹ tài sản đến mức bỏ bê sức khoẻ — đừng chờ đến khi ốm mới nhớ đến cơ thể.",
      spirit: "Xuôi: Bạn đang chứng minh rằng có thể vừa thành công trong cuộc sống thực tế vừa không mất đi những giá trị quan trọng hơn. Ngược: Bạn đang để việc kiếm tiền và tích lũy chiếm hết không gian — đến mức không còn chỗ cho những thứ thực sự có ý nghĩa.",
      advice: "Thực sự giàu có nghĩa là có đủ để chia sẻ và vẫn còn dư — không phải tích trữ mà không dùng."
    },
    colors: ["#66cc44","#99ee77","#448822"],
    bg: "linear-gradient(160deg,#0a2a05 0%,#1a4010 100%)"
  }
];
