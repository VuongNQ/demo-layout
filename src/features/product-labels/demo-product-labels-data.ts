export type ProductLabelProductLine = 'cash-loan' | 'credit-card';
export type ProductLabelStatus = 'active' | 'inactive';
export type ProductLabelClassification = 'eligibility' | 'display' | 'pricing';

// Fictional playground fixtures; these are not production DTOs or API data.
export type ProductLabel = {
  id: string;
  name: string;
  code: string;
  productLine: ProductLabelProductLine;
  status: ProductLabelStatus;
  classification?: ProductLabelClassification;
  associatedProductSummary?: string;
  updatedAt: string;
};

export const DEMO_PRODUCT_LABELS: ProductLabel[] = [
  { id: 'product-label-001', name: 'Hồ sơ linh hoạt', code: 'PL-FLEX-01', productLine: 'cash-loan', status: 'active', classification: 'eligibility', associatedProductSummary: 'Vay tiêu dùng tín chấp', updatedAt: '2026-10-18T09:30:00Z' },
  { id: 'product-label-002', name: 'Ưu đãi khách hàng mới', code: 'PL-NEW-02', productLine: 'cash-loan', status: 'active', classification: 'display', associatedProductSummary: 'Vay mua xe trả góp', updatedAt: '2026-10-16T14:15:00Z' },
  { id: 'product-label-003', name: 'Thu nhập ổn định', code: 'PL-INCOME-03', productLine: 'cash-loan', status: 'inactive', classification: 'eligibility', updatedAt: '2026-10-12T07:00:00Z' },
  { id: 'product-label-004', name: 'Hoàn tiền mua sắm', code: 'PL-CASHBACK-04', productLine: 'credit-card', status: 'active', classification: 'pricing', associatedProductSummary: 'Thẻ tín dụng Everyday', updatedAt: '2026-10-20T11:45:00Z' },
  { id: 'product-label-005', name: 'Thanh toán trực tuyến', code: 'PL-ONLINE-05', productLine: 'credit-card', status: 'active', classification: 'display', associatedProductSummary: 'Thẻ tín dụng Everyday', updatedAt: '2026-10-15T08:20:00Z' },
  { id: 'product-label-006', name: 'Ưu tiên du lịch', code: 'PL-TRAVEL-06', productLine: 'credit-card', status: 'inactive', classification: 'display', associatedProductSummary: 'Thẻ tín dụng Voyager', updatedAt: '2026-10-10T16:10:00Z' },
  { id: 'product-label-007', name: 'Khách hàng thân thiết', code: 'PL-LOYAL-07', productLine: 'cash-loan', status: 'active', classification: 'eligibility', associatedProductSummary: 'Vay kinh doanh nhỏ', updatedAt: '2026-10-08T10:00:00Z' },
  { id: 'product-label-008', name: 'Đăng ký không giấy tờ', code: 'PL-PAPERLESS-08', productLine: 'credit-card', status: 'active', associatedProductSummary: 'Thẻ tín dụng Voyager', updatedAt: '2026-10-06T12:25:00Z' },
  { id: 'product-label-009', name: 'Hạn mức khởi điểm', code: 'PL-START-09', productLine: 'cash-loan', status: 'inactive', classification: 'pricing', associatedProductSummary: 'Vay tiêu dùng tín chấp', updatedAt: '2026-10-02T05:40:00Z' },
  { id: 'product-label-010', name: 'Đề xuất chi tiêu', code: 'PL-SPEND-10', productLine: 'credit-card', status: 'active', classification: 'display', updatedAt: '2026-09-28T13:05:00Z' },
  { id: 'product-label-011', name: 'Hỗ trợ người đi làm', code: 'PL-WORK-11', productLine: 'cash-loan', status: 'active', classification: 'eligibility', associatedProductSummary: 'Vay mua xe trả góp', updatedAt: '2026-09-22T06:35:00Z' },
  { id: 'product-label-012', name: 'Giao dịch an tâm', code: 'PL-SAFE-12', productLine: 'credit-card', status: 'inactive', classification: 'display', associatedProductSummary: 'Thẻ tín dụng Everyday', updatedAt: '2026-09-18T15:55:00Z' }
];
