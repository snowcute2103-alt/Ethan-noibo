import type { Severity, Visibility } from './types';

export interface PolicyRule {
  text: string;
  penalty?: string;
  severity?: Severity;
}

export interface PolicyGroup {
  heading: string;
  rules: PolicyRule[];
}

/** Quy định điều hành dạng có cấu trúc (mục · phạt) — khác thông báo thường, cần nhấn mức độ nghiêm trọng riêng biệt. */
export interface Policy {
  id: string;
  title: string;
  effectiveDate: string;
  intro: string;
  groups: PolicyGroup[];
  notes: PolicyRule[];
  visibility: Visibility;
}

export const POLICIES: Policy[] = [
  {
    id: 'quy-dinh-cham-cong-de-xuat-luong',
    title: 'Quy định chấm công, đề xuất và bảng lương',
    effectiveDate: '15/08/2026',
    intro:
      'Do số lượng nhân sự ngày càng đông, để đảm bảo tính đồng bộ và kỷ luật chung, cả nhà vui lòng làm theo các quy định dưới đây để không ai bị phạt.',
    groups: [
      {
        heading: 'Chấm công và đề xuất',
        rules: [
          {
            text: 'Quên chấm công chỉ được duyệt nếu tạo đề xuất trong vòng 2 ngày kể từ ngày quên.',
            severity: 'info',
          },
          {
            text: 'Đề xuất tăng ca phải tạo ngay trong ngày làm việc đó. Qua ngày hôm sau sẽ không được duyệt.',
            severity: 'info',
          },
          {
            text: 'Mọi đề xuất bắt buộc phải tag tên quản lý trực tiếp; riêng đề xuất tăng ca thì tag quản lý trực tiếp vào mục người duyệt. Không tag, đề xuất sẽ không được duyệt.',
            severity: 'info',
          },
          {
            text: 'Đề xuất time off phải tạo trước giờ bắt đầu nghỉ.',
            penalty: 'Tạo muộn — phạt 50.000đ',
            severity: 'warning',
          },
          {
            text: 'Đi trễ thì tạo đề xuất ngay lúc bắt đầu lên ca.',
            penalty: 'Sai quy định — phạt 50.000đ',
            severity: 'warning',
          },
          {
            text: 'Đi trễ mà cố tình tạo đề xuất quên chấm công để né phạt.',
            penalty: 'Phát hiện — sa thải ngay lập tức',
            severity: 'critical',
          },
        ],
      },
      {
        heading: 'Bảng công và khiếu nại',
        rules: [
          { text: 'Bảng công hàng tháng gửi vào ngày 2. Cả nhà có 1 ngày để khiếu nại.', severity: 'info' },
          {
            text: 'Đề xuất tạo từ ngày 4 của tháng cũ trở đi sẽ không được tính vào bảng công đã gửi.',
            severity: 'warning',
          },
        ],
      },
      {
        heading: 'Về tiền phạt',
        rules: [
          {
            text: 'Toàn bộ tiền phạt sẽ bỏ vào heo đất đặt tại mỗi văn phòng. Cuối năm dùng số tiền này để giúp đỡ trẻ em khó khăn.',
            severity: 'info',
          },
        ],
      },
    ],
    notes: [
      {
        text: 'Các quy định trên áp dụng từ ngày 15/08/2026, để cả nhà có thời gian xử lý các đề xuất cũ. Sau mốc này, đề xuất OT quá 24h sẽ không tạo được nữa.',
      },
      { text: 'Lương được thanh toán từ ngày 4 đến ngày 6 đầu tháng.' },
    ],
    visibility: { departments: 'all' },
  },
];
