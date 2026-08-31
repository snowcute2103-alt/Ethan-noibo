export interface ReportMetric {
  label: string;
  value: string;
  description?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface ReportRow {
  label: string;
  value: string;
  secondary?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface AnalyticsPageRow {
  path: string;
  views: string;
  activeUsers: string;
  viewsPerUser: string;
  engagementTime: string;
  eventCount: string;
  keyEvents: string;
}

export interface WebsiteReport {
  id: string;
  date: string;
  periodLabel: string;
  analytics: {
    metrics: ReportMetric[];
    countries: ReportRow[];
    pages: ReportRow[];
    channels: ReportRow[];
    pagesAndScreens: {
      period: string;
      metrics: ReportMetric[];
      rows: AnalyticsPageRow[];
    };
  };
  searchConsole: {
    metrics: ReportMetric[];
    insights: ReportMetric[];
    queries: ReportRow[];
    pages: ReportRow[];
    countries: ReportRow[];
    devices: ReportRow[];
    highlights: ReportMetric[];
  };
  lighthouse: {
    scores: ReportMetric[];
    metrics: ReportMetric[];
  };
}

/**
 * Mỗi phần tử là một snapshot độc lập. Khi có báo cáo mới, thêm phần tử mới vào
 * đầu mảng để giữ nguyên lịch sử và tự động hiển thị ngày mới trong bộ chọn.
 */
export const WEBSITE_REPORTS: WebsiteReport[] = [
  {
    id: '2026-08-27',
    date: '27/08/2026',
    periodLabel: 'Dữ liệu tổng hợp đến ngày 27/08/2026',
    analytics: {
      metrics: [
        { label: 'Người dùng hoạt động / Active users', value: '410', description: 'Số người dùng có tương tác với website trong kỳ báo cáo.', change: '37,1%', trend: 'down' },
        { label: 'Lượt sự kiện / Event count', value: '2.000', description: 'Tổng số tương tác được Google Analytics ghi nhận.', change: '43,3%', trend: 'down' },
        { label: 'Sự kiện chính / Key events', value: '0', description: 'Số hành động quan trọng được đánh dấu là sự kiện chính.', trend: 'neutral' },
        { label: 'Người dùng mới / New users', value: '409', description: 'Số người lần đầu truy cập website trong kỳ báo cáo.', change: '43,5%', trend: 'down' },
      ],
      countries: [
        { label: 'Việt Nam', value: '387', change: '37,4%', trend: 'down' },
        { label: 'Hoa Kỳ', value: '13', change: '31,6%', trend: 'down' },
        { label: 'Đức', value: '3', trend: 'neutral' },
        { label: 'Nhật Bản', value: '3', change: '200%', trend: 'up' },
        { label: 'Úc', value: '1', trend: 'neutral' },
        { label: 'Trung Quốc', value: '1', trend: 'neutral' },
        { label: 'Hồng Kông', value: '1', trend: 'neutral' },
      ],
      pages: [
        { label: 'Ethan Ecom | Cross-border E-commerce', value: '511', change: '11,7%', trend: 'down' },
        { label: 'Ethan Tuyển Dụng | 16 vị trí đang mở', value: '54', change: '90,3%', trend: 'down' },
        { label: 'Giới thiệu Ethan Ecom', value: '32', change: '8,6%', trend: 'down' },
        { label: 'Tuyển dụng KTV Vận hành', value: '31', change: '65,6%', trend: 'down' },
        { label: 'Câu chuyện | Ethan Ecom', value: '15', change: '50%', trend: 'up' },
      ],
      channels: [
        { label: 'Paid Social', value: '276', change: '13,8%', trend: 'down' },
        { label: 'Organic Social', value: '70', change: '44,4%', trend: 'down' },
        { label: 'Organic Search', value: '51', change: '31,1%', trend: 'down' },
        { label: 'Direct', value: '42', change: '19,2%', trend: 'down' },
        { label: 'Paid Other', value: '38', change: '81%', trend: 'down' },
        { label: 'Unassigned', value: '14', trend: 'neutral' },
        { label: 'Cross-network', value: '2', trend: 'neutral' },
      ],
      pagesAndScreens: {
        period: '30/07–26/08/2026 · 28 ngày',
        metrics: [
          { label: 'Lượt xem / Views', value: '5.427', description: 'Tổng số lượt xem trang được Google Analytics ghi nhận trong 28 ngày.' },
          { label: 'Người dùng hoạt động / Active users', value: '2.044', description: 'Số người dùng có tương tác với các trang trong kỳ báo cáo.' },
          { label: 'Lượt xem mỗi người dùng / Views per active user', value: '2,66', description: 'Số lượt xem trung bình trên mỗi người dùng hoạt động.' },
          { label: 'Thời gian tương tác / Average engagement time', value: '34 giây', description: 'Thời gian tương tác trung bình trên mỗi người dùng hoạt động.' },
          { label: 'Lượt sự kiện / Event count', value: '12.869', description: 'Tổng số sự kiện phát sinh trên các trang.' },
          { label: 'Sự kiện chính / Key events', value: '0', description: 'Chưa có sự kiện nào được đánh dấu là sự kiện chính trong kỳ.' },
        ],
        rows: [
          { path: '/tuyen-dung', views: '3.123', activeUsers: '1.109', viewsPerUser: '2,82', engagementTime: '12 giây', eventCount: '6.585', keyEvents: '0' },
          { path: '/', views: '1.417', activeUsers: '908', viewsPerUser: '1,56', engagementTime: '25 giây', eventCount: '4.084', keyEvents: '0' },
          { path: '/gioi-thieu', views: '146', activeUsers: '78', viewsPerUser: '1,87', engagementTime: '59 giây', eventCount: '349', keyEvents: '0' },
          { path: '/tuyen-dung-ky-thuat-van-hanh-may-san-xuat', views: '130', activeUsers: '80', viewsPerUser: '1,63', engagementTime: '45 giây', eventCount: '374', keyEvents: '0' },
          { path: '/tuyen-dung-seller-tmdt', views: '65', activeUsers: '40', viewsPerUser: '1,63', engagementTime: '1 phút 33 giây', eventCount: '147', keyEvents: '0' },
          { path: '/cau-chuyen', views: '55', activeUsers: '32', viewsPerUser: '1,72', engagementTime: '40 giây', eventCount: '137', keyEvents: '0' },
          { path: '/tuyen-dung-chuyen-vien-it-ai', views: '54', activeUsers: '30', viewsPerUser: '1,80', engagementTime: '1 phút 36 giây', eventCount: '139', keyEvents: '0' },
          { path: '/tuyen-dung-designer-pod', views: '52', activeUsers: '38', viewsPerUser: '1,37', engagementTime: '46 giây', eventCount: '141', keyEvents: '0' },
          { path: '/tam-nhin', views: '45', activeUsers: '32', viewsPerUser: '1,41', engagementTime: '34 giây', eventCount: '112', keyEvents: '0' },
          { path: '/tuyen-dung-designer-emb', views: '42', activeUsers: '19', viewsPerUser: '2,21', engagementTime: '53 giây', eventCount: '95', keyEvents: '0' },
        ],
      },
    },
    searchConsole: {
      metrics: [
        { label: 'Tổng lượt nhấp / Total clicks', value: '138', description: 'Số lần người dùng nhấp vào website từ kết quả Google Search.' },
        { label: 'Tổng lượt hiển thị / Impressions', value: '834', description: 'Số lần website xuất hiện trong kết quả Google Search.' },
        { label: 'CTR trung bình / Average CTR', value: '16,5%', description: 'Tỷ lệ lượt nhấp trên tổng lượt hiển thị.' },
        { label: 'Vị trí trung bình / Average position', value: '11,9', description: 'Vị trí trung bình cao nhất của website trên kết quả tìm kiếm.' },
      ],
      insights: [
        { label: 'Lượt nhấp / Clicks (28 ngày)', value: '104', change: '206%', trend: 'up' },
        { label: 'Lượt hiển thị / Impressions (28 ngày)', value: '726', change: '572%', trend: 'up' },
      ],
      queries: [
        { label: 'ethan ecom', value: '56', secondary: '98' },
        { label: 'ethanecom', value: '17', secondary: '28' },
        { label: 'ecommerce tuyển dụng', value: '1', secondary: '35' },
        { label: 'tuyển dụng ecommerce', value: '1', secondary: '34' },
        { label: 'tuyển dụng ecom', value: '1', secondary: '3' },
        { label: 'e-commerce tuyển dụng', value: '1', secondary: '2' },
        { label: 'ecom', value: '0', secondary: '18' },
        { label: 'việc làm ecommerce', value: '0', secondary: '9' },
        { label: 'ecommerce manager tuyển dụng', value: '0', secondary: '8' },
        { label: 'tuyển dụng designer', value: '0', secondary: '7' },
        { label: 'ecom tuyển dụng', value: '0', secondary: '7' },
        { label: 'tuyển dụng thiết kế khuôn', value: '0', secondary: '6' },
        { label: 'ethan', value: '0', secondary: '5' },
        { label: 'ecom job', value: '0', secondary: '5' },
        { label: 'tuyển dụng thiết kế sản phẩm', value: '0', secondary: '4' },
        { label: 'designer tuyển dụng', value: '0', secondary: '4' },
        { label: 'tuyển dụng thiết kế đồ họa', value: '0', secondary: '4' },
        { label: 'ethan group', value: '0', secondary: '3' },
        { label: 'tuyển dụng ecommerce manager', value: '0', secondary: '3' },
        { label: 'tuyen dung designer', value: '0', secondary: '3' },
      ],
      pages: [
        { label: 'ethanecom.com/', value: '105', secondary: '462' },
        { label: 'ethanecom.com/tuyen-dung-seller-tmdt', value: '4', secondary: '176' },
        { label: 'ethanecom.com/lien-he', value: '4', secondary: '68' },
        { label: 'ethanecom.com/tuyen-dung', value: '4', secondary: '46' },
        { label: 'ethanecom.com/gioi-thieu', value: '2', secondary: '124' },
        { label: 'ethanecom.com/tuyen-dung-designer-pod', value: '2', secondary: '97' },
      ],
      countries: [
        { label: 'Vietnam', value: '124', secondary: '716' },
        { label: 'United States', value: '12', secondary: '34' },
        { label: 'Spain', value: '1', secondary: '4' },
        { label: 'Australia', value: '1', secondary: '1' },
        { label: 'Indonesia', value: '0', secondary: '14' },
        { label: 'Thailand', value: '0', secondary: '9' },
        { label: 'India', value: '0', secondary: '9' },
        { label: 'France', value: '0', secondary: '5' },
        { label: 'Germany', value: '0', secondary: '4' },
        { label: 'Philippines', value: '0', secondary: '4' },
        { label: 'Netherlands', value: '0', secondary: '3' },
        { label: 'United Kingdom', value: '0', secondary: '3' },
        { label: 'Algeria', value: '0', secondary: '3' },
        { label: 'Singapore', value: '0', secondary: '2' },
        { label: 'Poland', value: '0', secondary: '2' },
        { label: 'United Arab Emirates', value: '0', secondary: '2' },
        { label: 'Pakistan', value: '0', secondary: '2' },
        { label: 'Ukraine', value: '0', secondary: '2' },
        { label: 'Bangladesh', value: '0', secondary: '2' },
        { label: 'Mexico', value: '0', secondary: '2' },
      ],
      devices: [
        { label: 'Desktop', value: '70', secondary: '524' },
        { label: 'Mobile', value: '66', secondary: '300' },
        { label: 'Tablet', value: '2', secondary: '10' },
      ],
      highlights: [
        { label: 'Lượt nhấp từ Việt Nam / Vietnam click share', value: '89,9%' },
        { label: 'Lượt nhấp từ trang chủ / Homepage click share', value: '76,1%' },
        { label: 'Lượt nhấp từ desktop / Desktop click share', value: '50,7%' },
        { label: 'Lượt nhấp từ 2 từ khóa thương hiệu / Brand-query click share', value: '52,9%' },
      ],
    },
    lighthouse: {
      scores: [
        { label: 'Hiệu suất / Performance', value: '95', description: 'Đánh giá tốc độ tải và khả năng phản hồi của website.' },
        { label: 'Khả năng tiếp cận / Accessibility', value: '100', description: 'Đánh giá mức độ thuận tiện cho mọi nhóm người dùng.' },
        { label: 'Thực hành tốt / Best Practices', value: '100', description: 'Đánh giá các tiêu chuẩn kỹ thuật và bảo mật phổ biến.' },
        { label: 'Tối ưu tìm kiếm / SEO', value: '100', description: 'Đánh giá khả năng website được công cụ tìm kiếm hiểu và lập chỉ mục.' },
      ],
      metrics: [
        { label: 'Hiển thị nội dung đầu tiên / FCP', value: '1,0 giây', description: 'Thời gian nội dung đầu tiên xuất hiện trên màn hình.' },
        { label: 'Hiển thị nội dung lớn nhất / LCP', value: '1,3 giây', description: 'Thời gian phần nội dung chính lớn nhất hiển thị.' },
        { label: 'Tổng thời gian chặn / TBT', value: '50 ms', description: 'Tổng thời gian trang bị chặn và chưa thể tương tác.' },
        { label: 'Độ dịch chuyển bố cục / CLS', value: '0,024', description: 'Mức độ các thành phần bị dịch chuyển ngoài ý muốn.' },
        { label: 'Chỉ số tốc độ / Speed Index', value: '1,2 giây', description: 'Tốc độ nội dung hiển thị hoàn chỉnh trong khung nhìn.' },
      ],
    },
  },
];
