# Báo cáo: nâng cấp `src/components/simulation` hỗ trợ dữ liệu động & theme config

Thực hiện 2026-11-02, nhánh `portal-cham-vay`. Tiếp theo
[`2026-11-02-component-inventory.md`](./2026-11-02-component-inventory.md)
(audit tĩnh, không sửa code) — báo cáo này ghi lại các thay đổi code đã làm
sau audit đó.

## 1. Mở prop để nhận dữ liệu động

4 component dùng chung trong `src/components/simulation/components/` được
thêm prop optional để nhận dữ liệu thật, mặc định giữ nguyên nội dung hardcode
cũ — 5 consumer đang dùng các component này không cần sửa gì vẫn chạy y như
trước.

| Component | Prop mới | Mặc định (giữ hành vi cũ) |
| --- | --- | --- |
| `InfoCardCarousel.tsx` | `cards?: InfoCardData[]` (title/duration/document/amount/amountUnit/backgroundImage theo từng card) | Không truyền → vẫn render 5 card giống nhau |
| `ExclusiveTouchCarousel.tsx` | `products?: ProductLayoutProps[]` | Không truyền → vẫn render 7 loại sản phẩm demo cố định |
| `HeaderSection.tsx` | `avatarUrl?`, `notificationCount?` | Avatar + badge "8" như cũ |
| `MarketingAction.tsx` | `label?` | Label "Khám phá ngay" như cũ |

## 2. Gộp cách "lắp trang" thành 1 theme config chung

- Thêm `SimulationThemeConfig`
  (`src/components/simulation/types/simulation-theme.types.ts`) — mô tả dữ
  liệu theme cho Header/ExclusiveTouch/LoansHeading/InfoCards/MarketingAction.
- Thêm 2 hàm `buildHomeComponents()` / `buildMarketingComponents()` trong
  `defaultPageComponents.tsx` — nhận `theme` + `bannerSlot` (banner vẫn do
  từng module tự cung cấp, không gộp), trả về đúng mảng component để lắp
  trang Home/Marketing. `buildHomeComponents` nhận thêm
  `includeExclusiveTouch`/`bottomSpacerHeight` để mỗi consumer migrate giữ
  đúng layout cũ, không bị thêm/bớt section ngoài ý muốn.

Đã chuyển sang dùng builder (đã kiểm tra giữ đúng layout cũ):

- `simulationModalContent.tsx` (cả case HOME và MARKETING)
- `BackgroundMainPreview/index.tsx` (qua mapper mới
  `background-main/utils/background-main-theme.mapper.ts`)
- `SplashScreenMarketingPreview.tsx`

## 3. Chủ động không đổi

- **`PopupPreview.tsx`**: không có banner/theme thật để truyền, chuyển sang
  builder không có lợi ích → giữ nguyên.
- **`ExclusiveTouchPreview.tsx`**: phát hiện bản `ExclusiveTouchCarousel` cục
  bộ của module này và bản dùng chung **đã khác nhau về UI thật** (bản chung
  có thêm ảnh tiêu đề "Chạm độc quyền", cách lớp nền khác) — không phải chỉ
  khác nguồn dữ liệu. Nếu gộp sẽ làm đổi UI hiển thị thật, nên đã **revert,
  giữ nguyên file này**, và ghi nhận việc gộp 2 bản `ExclusiveTouchCarousel`
  là mục cần team quyết định riêng (`NEEDS-TEAM-DECISION`, không làm trong
  task này).

## 4. Kiểm tra đã chạy

- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run prettier --check` + `--write`: đã format lại theo chuẩn repo

## 5. Chưa kiểm tra

Chưa mở trình duyệt để so sánh trực quan trước/sau ở 3 consumer đã migrate
(`BackgroundMainPreview`, `simulationModalContent`,
`SplashScreenMarketingPreview`) — repo không có test runner nên không có
cách kiểm tự động.
