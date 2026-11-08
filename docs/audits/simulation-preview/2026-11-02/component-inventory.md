# `src/components/simulation` — Component inventory

Static source inspection, 2026-11-02, branch `improve/vuongnq/2656_sync-UI-simulator`.
Scope: `src/components/simulation/**` and its tightly coupled dependency
`src/components/iphone-preview/**`. Written to support issue #2656
(đồng bộ UI/layout Mô phỏng vs Trang chủ) — planning/reference only, no code
changed by this report.

**Cập nhật 2026-11-03** — đối chiếu lại với working tree sau khi component simulator được
sửa (chưa commit). Thay đổi quan sát được: `HeaderSection`, `InfoCardCarousel`,
`ExclusiveTouchCarousel`, `MarketingAction` nay nhận props để ghi đè nội dung thay vì hardcode
cứng; thêm `defaultPageComponents.tsx` 2 hàm builder mới `buildHomeComponents`/
`buildMarketingComponents` và file mới `src/components/simulation/types/simulation-theme.types.ts`
(`SimulationThemeConfig`); 3 consumer (`simulationModalContent.tsx`,
`SplashScreenMarketingPreview.tsx`, `BackgroundMainPreview/index.tsx`) đã migrate sang 2 hàm
builder này kèm `background-main-theme.mapper.ts` mới. Các mục bên dưới đã được cập nhật theo
trạng thái mới; phần nào vẫn giữ nguyên hiện trạng cũ được ghi rõ "chưa đổi/còn tồn tại".

## 1. Cấu trúc component

```text
src/components/
├── iphone-preview/                     # Khung iPhone mock dùng chung (ngoài src/components/simulation)
│   ├── index.tsx                       # IphonePreview: bọc react-mockframe (device 'iPhone 17'), auto-fit zoom theo container
│   ├── body.tsx                        # BodySection: nền trang (ảnh nền + scroll container cơ bản), dùng trong HomePage
│   └── modal.tsx                       # openIphonePreviewModal: helper mở modal chứa preview (width 472, maxHeight...)
│
└── simulation/
    ├── simulationLayout.tsx            # SimulationLayout: IphonePreview + vùng cuộn kéo-thả (pointer drag) + Spin loading + nền tùy biến
    ├── types/
    │   └── simulation-theme.types.ts   # MỚI: SimulationThemeConfig — gom type props của Header/ExclusiveTouch/InfoCards/MarketingAction thành 1 theme config
    ├── components/
    │   ├── HeaderSection.tsx           # Header "Trang chủ": avatar + lời chào theo giờ + icon tin nhắn/QR + badge số — nay nhận props avatarUrl/notificationCount
    │   ├── FeatureMenu.tsx             # Lưới icon 3x3 (Vay trả góp, Vay tiền mặt, Thẻ tín dụng...) + badge "Sắp ra mắt"
    │   ├── HomeBannerCarousel.tsx      # Carousel banner Home (AntD Carousel), tự load ảnh từ assets/simulation/banners/*
    │   ├── ExclusiveTouchCarousel.tsx  # Section "Chạm độc quyền": tiêu đề ảnh + badge VIP + carousel kéo ngang — nay nhận prop products[] (mặc định vẫn 7 product type cũ)
    │   ├── LoansHeading.tsx            # Heading "Vay phổ biến" + badge "Điền mã VIP" (ẩn được qua prop hideVip)
    │   ├── InfoCardCarousel.tsx        # Carousel card ưu đãi (InfoCard nội bộ) — nay nhận prop cards[] (title/duration/document/amount...), mặc định vẫn là text mẫu cũ
    │   ├── NeoButton.tsx               # Button trình bày "neo-morphism" dùng chung (forwardRef, nhận mọi props <button>)
    │   ├── Spacer.tsx                  # Khoảng trống dọc, nhận prop height
    │   ├── PopupAdv.tsx                # Overlay popup quảng cáo (ảnh hoặc placeholder text)
    │   ├── MarketingAction.tsx         # Nút CTA cố định đáy cho trang Marketing — nay nhận prop label (mặc định "Khám phá ngay"), vẫn không có onClick
    │   ├── MarketingBannerCarousel.tsx # Carousel banner Marketing, tự load ảnh từ assets/simulation/marketings/*
    │   ├── MarketingBodySection.tsx    # Khung trang Marketing (full height, position relative)
    │   ├── ApiResponseEmpty.tsx        # Overlay "không có dữ liệu" full khung, nhận message tùy biến
    │   ├── defaultPageComponents.tsx   # defaultHomeComponents/defaultMarketingComponents (giữ nguyên, legacy) + MỚI: buildHomeComponents()/buildMarketingComponents() (nhận theme + bannerSlot + includeExclusiveTouch)
    │   └── products/
    │       └── ProductLayout.tsx       # Card sản phẩm theo productTypeCode (LOYALTY/WHITELIST/GAME/EVENT/CREDITCARD/LIVESTREAM/CBNV + default)
    └── pages/
        ├── home/HomePage.tsx           # Lắp BodySection + components[] (mặc định defaultHomeComponents)
        └── marketing/MarketingPage.tsx # Lắp MarketingBodySection + components[] (mặc định defaultMarketingComponents)
```

Quan hệ dựng trang:

```text
SimulationLayout (simulation/)
  └─ IphonePreview (iphone-preview/index.tsx)   # khung thiết bị + auto-zoom
       └─ <div> nền + vùng cuộn kéo-thả          # scroll container riêng của SimulationLayout
            └─ children                          # thường là HomePage hoặc MarketingPage

HomePage (simulation/pages/home)
  └─ BodySection (iphone-preview/body.tsx)       # nền ảnh + base style
       └─ components: ReactNode[]                # mảng component Home được truyền vào/mặc định
```

Mọi style dùng Emotion `css` prop (`/** @jsxImportSource @emotion/react */`), không có file
`.module.scss` nào trong cây này — khác với target SCSS Modules cho component mới
(`.claude/rules/10-styling.md`); đây là khu vực Emotion hiện hữu, không nằm trong phạm vi
audit này để đổi.

## 2. Cách sử dụng

Hai cách lắp màn hình phổ biến quan sát được ở các consumer hiện tại:

**Cách A — dùng nguyên `HomePage`/`MarketingPage` với mặc định:**
```tsx
<SimulationLayout>
  <HomePage />                 {/* render defaultHomeComponents */}
</SimulationLayout>
```

**Cách B — tự lắp danh sách `components` tùy biến (phổ biến hơn trong thực tế):**
```tsx
const homeComponents = [
  <HeaderSection key='header' />,
  <HomeBannerCarousel key='banners' />,   // bản local của module, KHÔNG phải bản trong simulation/components
  <FeatureMenu key='menu' />,
  <ExclusiveTouchCarousel key='exclusive-touch' backgroundImage={...} />,
  <LoansHeading key='loans-heading' hideVip />,
  <InfoCardCarousel key='info-cards' backgroundImage={...} backgroundImages={...} />,
  <Spacer key='small-spacer' height={8} />,
  <Spacer key='bottom-spacer' height={24} />
];

<SimulationLayout fitHeightToContainer backgroundImage={...} loading={...}>
  <HomePage components={homeComponents} backgroundImage={null} />
</SimulationLayout>
```

**Cách C — dùng builder `buildHomeComponents`/`buildMarketingComponents` (mới, 2026-11-03):**

```tsx
import { buildHomeComponents } from '@/components/simulation/components/defaultPageComponents';

const homeComponents = buildHomeComponents({
  theme: mapBackgroundMainPreviewModelToThemeConfig(model), // SimulationThemeConfig
  bannerSlot: <HomeBannerCarousel key='banners' />,
  bottomSpacerHeight: 24
  // includeExclusiveTouch mặc định true; truyền false để tắt (dùng ở simulationModalContent.tsx)
});

<SimulationLayout fitHeightToContainer backgroundImage={...} loading={...}>
  <HomePage components={homeComponents} backgroundImage={null} />
</SimulationLayout>
```

`buildHomeComponents`/`buildMarketingComponents` nhận 1 `theme?: SimulationThemeConfig`
(`header`/`exclusiveTouch`/`loansHeading`/`infoCards`/`marketingAction`) để truyền tiếp xuống
từng component con qua props mới, cộng `bannerSlot` (banner carousel do consumer tự chọn —
builder không áp đặt bản banner nào) và `extra?: ReactNode[]` để chèn thêm khối. Đây là cách
dựng **được khuyến nghị cho consumer mới** thay vì Cách B (tự liệt kê từng component), vì nó
đồng bộ thứ tự khối ở 1 chỗ.

Ghi chú quan trọng khi dùng:

- `defaultHomeComponents`/`defaultMarketingComponents` (export cũ, static) **vẫn giữ nguyên
  hiện trạng cũ** — `defaultHomeComponents` vẫn thiếu `ExclusiveTouchCarousel`. Builder mới
  (`buildHomeComponents`) đã sửa đúng vấn đề này cho consumer nào migrate sang, nhưng
  `PopupPreview.tsx` (mục 3) **chưa migrate**, vẫn spread `...defaultHomeComponents` (Cách A)
  nên preview của nó vẫn thiếu khối "Chạm độc quyền" so với layout Home thật.
- `SimulationLayout` chỉ nhận `children`, không có khái niệm Header/CTA riêng — toàn bộ cấu
  trúc Header/Content/CTA (yêu cầu #7 trong ticket #2656) do consumer tự quyết định qua thứ tự
  phần tử trong mảng `components`/builder, không có hợp đồng component ép buộc.
- `IphonePreview` luôn dùng `device='iPhone 17'` cố định (không đổi được qua props) — mọi
  preview trong repo đều giả lập cùng 1 kích thước thiết bị. **Chưa đổi** ở lần cập nhật này.
- Nhiều module có **bản sao cục bộ** của cùng một loại component thay vì tái dùng bản trong
  `src/components/simulation/components/` (xem mục 4 "trùng lặp/song song"). **Chưa đổi.**

## 3. Đang được sử dụng ở đâu (consumer map)

| File/Component dùng chung | Consumer (module-local) |
|---|---|
| `simulationLayout.tsx` | `contents/popup/.../PopupPreview.tsx`; `contents/banner/simulation/simulationModalContent.tsx`; `products/exclusive-touch/.../ExclusiveTouchPreview.tsx`; `products/configuration/product-labels/shared/MobilePreviewFrame.tsx`; `system/theme-management/background-main/.../BackgroundMainPreview/index.tsx` |
| `pages/home/HomePage.tsx` | `PopupPreview.tsx`; `simulationModalContent.tsx`; `ExclusiveTouchPreview.tsx`; `BackgroundMainPreview/index.tsx` |
| `pages/marketing/MarketingPage.tsx` | `simulationModalContent.tsx`; `system/splash-screen/components/preview/SplashScreenMarketingPreview.tsx` |
| `components/HeaderSection.tsx` | `ExclusiveTouchPreview.tsx` (import trực tiếp, chưa migrate); gián tiếp qua `buildHomeComponents` trong `simulationModalContent.tsx`/`BackgroundMainPreview/index.tsx` |
| `components/FeatureMenu.tsx` | `ExclusiveTouchPreview.tsx` (trực tiếp) + gián tiếp qua `buildHomeComponents` (2 consumer trên) |
| `components/LoansHeading.tsx` | gián tiếp qua `buildHomeComponents` (`simulationModalContent.tsx`, `BackgroundMainPreview/index.tsx`); không còn consumer import trực tiếp |
| `components/InfoCardCarousel.tsx` | gián tiếp qua `buildHomeComponents` (2 consumer trên) |
| `components/ExclusiveTouchCarousel.tsx` | gián tiếp qua `buildHomeComponents` (`BackgroundMainPreview/index.tsx`; `simulationModalContent.tsx` gọi với `includeExclusiveTouch: false` nên không render) |
| `components/HomeBannerCarousel.tsx` | chỉ `ExclusiveTouchPreview.tsx` (các nơi khác dùng bản local riêng, xem mục 4) — **không đổi** |
| `components/Spacer.tsx` | `ExclusiveTouchPreview.tsx` (trực tiếp) + gián tiếp qua `buildHomeComponents` |
| `components/MarketingAction.tsx` | gián tiếp qua `buildMarketingComponents` (`simulationModalContent.tsx`, `SplashScreenMarketingPreview.tsx`); không còn consumer import trực tiếp |
| `components/MarketingBannerCarousel.tsx`, `MarketingBodySection.tsx` | chỉ dùng gián tiếp qua `MarketingPage.tsx` (không có consumer import trực tiếp nào khác) — **không đổi** |
| `components/ApiResponseEmpty.tsx` | chỉ `ExclusiveTouchPreview.tsx` — **không đổi** |
| `components/defaultPageComponents.tsx` | `defaultHomeComponents`: chỉ `PopupPreview.tsx` (chưa migrate). **Mới:** `buildHomeComponents`/`buildMarketingComponents`: `simulationModalContent.tsx`, `SplashScreenMarketingPreview.tsx`, `BackgroundMainPreview/index.tsx` |
| `components/PopupAdv.tsx` | chỉ `contents/popup/components/simulation/PopupPreview.tsx` — **không đổi** |
| `types/simulation-theme.types.ts` (`SimulationThemeConfig`) | MỚI — dùng bởi `defaultPageComponents.tsx` và `background-main/utils/background-main-theme.mapper.ts` (mapper mới, chỉ phục vụ `BackgroundMainPreview`) |
| `components/NeoButton.tsx` | **không** qua Home/Marketing page — dùng trực tiếp ở `required-information-mobile-preview.tsx`, `product-labels/shared/MobilePreviewFrame.tsx`, `product-labels/shared/CreditCardMobilePreview.tsx` |
| `components/products/ProductLayout.tsx` | chỉ qua `ExclusiveTouchCarousel.tsx` (trong `simulation/components/`) |
| `iphone-preview/*` (IphonePreview, BodySection, modal) | tất cả các nơi trên + `contents/banner/list.tsx`; `products/exclusive-touch/views/ExclusiveTouchPage.tsx`; `system/splash-screen/SplashScreenList.tsx`; `system/splash-screen/components/preview/SplashScreenFormPreview.tsx` |

**Phạm vi task #2656 (đã chốt):** chỉ sửa
`src/modules/system/theme-management/background-main/components/BackgroundMainPreview/index.tsx`.
Sau thay đổi 2026-11-03, component này không còn import trực tiếp từng component con — nó gọi
`buildHomeComponents({ theme: mapBackgroundMainPreviewModelToThemeConfig(model), ... })`, nghĩa
là `SimulationLayout`, `HomePage`, `HeaderSection`, `FeatureMenu`, `ExclusiveTouchCarousel`,
`LoansHeading`, `InfoCardCarousel`, `Spacer` vẫn là **dependency gián tiếp** qua builder dùng
chung. Builder này cũng được `simulationModalContent.tsx` và `SplashScreenMarketingPreview.tsx`
dùng — sửa style/behaviour bên trong các component con hoặc trong `buildHomeComponents` chính
nó vẫn lan sang các consumer đó; chỉ phần truyền vào qua `SimulationThemeConfig`
(`mapBackgroundMainPreviewModelToThemeConfig`) là riêng của `BackgroundMainPreview` — xem
`.claude/rules/01-architecture.md`/`07-component.md` về audit consumer trước khi đổi shared
component.

## 4. Các phần đang hardcode

### 4.0 Đã được sửa ở lần cập nhật 2026-11-03 (không còn hardcode cứng, nhưng vẫn còn default text mẫu)

- **`InfoCardCarousel.tsx`** — nay nhận `cards?: InfoCardData[]` (`title`, `duration`,
  `durationUnit`, `document`, `amount`, `amountUnit`, `backgroundImage` cho từng card riêng).
  Khi không truyền `cards`, vẫn fallback về 5 card rỗng dùng default text cũ
  (`"Giáo viên - Bác sĩ"`, `"18-24 tháng"`, `"35"`...) qua helper `getValue`. **Lưu ý:**
  `BackgroundMainPreview` (qua `mapBackgroundMainPreviewModelToThemeConfig`) hiện **chỉ** truyền
  `backgroundImage`/`backgroundImages` vào `infoCards`, chưa truyền `cards` — nghĩa là phần text
  (title/duration/document/amount) của preview này **vẫn đang hiển thị dữ liệu mẫu**, chưa phải
  dữ liệu thật, dù component đã có khả năng nhận.
- **`HeaderSection.tsx`** — nay nhận `avatarUrl?: string`, `notificationCount?: number`
  (mặc định `8`). Lời chào theo giờ hệ thống và tên người dùng vẫn không có prop (vẫn cố định).
- **`MarketingAction.tsx`** — nay nhận `label?: string` (mặc định `"Khám phá ngay"`). Vẫn
  **chưa có** `onClick`/`href` — nút vẫn không thể gắn hành vi qua props.
- **`ExclusiveTouchCarousel.tsx`** — nay nhận `products?: ProductLayoutProps[]`; khi không
  truyền, dùng `DEFAULT_PRODUCT_TYPE_CODES` (đặt tên hằng số, cùng 7 giá trị cũ) thay vì mảng
  literal inline. Nhãn `"Điền mã VIP"` **vẫn hardcode** (vẫn trùng với `LoansHeading.tsx`, xem 4.3).

### 4.1 Hardcode nội dung/text không nhận qua props — còn tồn tại

- **`PopupAdv.tsx`** — text placeholder khi thiếu ảnh (`"Bạn cần upload hình ảnh..."`) và icon
  đóng là ký tự `"X"` thường (không phải icon component) đều cố định trong file. **Không đổi.**
- **`ExclusiveTouchCarousel.tsx`** — nhãn `"Điền mã VIP"` hardcode, trùng với `LoansHeading.tsx`
  (4.3). **Không đổi.**
- **`defaultPageComponents.tsx`** — `defaultHomeComponents` (export cũ, static) vẫn hardcode
  đúng 1 bộ khối cố định, vẫn thiếu `ExclusiveTouchCarousel`. **Không đổi** — nhưng nay có
  đường thoát: consumer nên migrate sang `buildHomeComponents({ includeExclusiveTouch: true })`
  thay vì tiếp tục dùng `defaultHomeComponents`. `PopupPreview.tsx` là consumer duy nhất còn lại
  chưa migrate (xem mục 3).

### 4.2 Hardcode cấu hình/kích thước thiết bị & style — còn tồn tại, không đổi

- **`iphone-preview/index.tsx`** — `IPHONE_FRAME_WIDTH`/`IPHONE_FRAME_HEIGHT`
  (393×852 + padding 12px) và `device='iPhone 17'` cố định, không có prop chọn thiết bị khác —
  ảnh hưởng trực tiếp tới yêu cầu AC8 (kiểm safe-area trên nhiều loại thiết bị: không thể giả
  lập Android/iPhone khác từ component này).
- **`NeoButton.tsx`** — toàn bộ màu/box-shadow/kích thước (height 48px, font-size 18px...) cố
  định trong `css`, không expose token/biến để tuỳ biến theo theme.
- **`ProductLayout.tsx`** — mỗi `productTypeCode` có **default copy text + default ảnh** hardcode
  (ví dụ LOYALTY mặc định `"30 triệu - 1,1tr/tháng"`, `"Gói VIP"`...). Khác với InfoCardCarousel,
  ở đây có prop ghi đè (`title`, `label`, `document`...) nên đây là "default mẫu" hợp lý, không
  phải lỗi — nêu để phân biệt rõ với 4.1. Đây chính là pattern mà `InfoCardCarousel`/
  `HeaderSection`/`MarketingAction`/`ExclusiveTouchCarousel` vừa được sửa theo (4.0).

### 4.3 Trùng lặp / song song (không hẳn là hardcode nhưng cùng nhóm rủi ro đồng bộ) — còn tồn tại, không đổi

- **Nhãn "Điền mã VIP"** lặp y hệt ở cả `LoansHeading.tsx` và `ExclusiveTouchCarousel.tsx`
  (2 bản `vipStyles`/`vipLabelStyles`/`searchIconStyles` gần như giống hệt nhau, định nghĩa
  2 lần).
- **`HomeBannerCarousel`** tồn tại 2 bản độc lập: `src/components/simulation/components/HomeBannerCarousel.tsx`
  (dùng `import.meta.glob` tự động nạp ảnh tĩnh) và
  `src/modules/contents/banner/simulation/HomeBannerCarousel.tsx` (dùng Redux banner thật) —
  `BackgroundMainPreview` dùng bản thứ hai, không dùng bản trong `simulation/components/`.
- **`ExclusiveTouchCarousel`** cũng có bản riêng ở
  `src/modules/products/exclusive-touch/components/simulation/ExclusiveTouchCarousel.tsx`
  (ngoài bản dùng chung trong `simulation/components/`) — cần xác nhận bản nào là nguồn thật khi
  sửa cho task #2656.

### 4.4 Dead/commented code (không phải hardcode nhưng vi phạm `.claude/rules/00-general.md` phần Comments) — còn tồn tại, không đổi

- `ExclusiveTouchCarousel.tsx` dòng 11-39: toàn bộ `InfoCard` cũ bị comment để lại nguyên khối,
  không xoá (thay đổi 2026-11-03 không đụng tới khối comment này).
- `ProductLayout.tsx`: mỗi `case` đều có 1 dòng debug comment còn sót
  (`{/* <div style={{...}}>LOYALTY</div> */}`, `WHITELIST`, `GAME`, `EVENT`, `CREDITCARD`,
  `LIVESTREAM`, `CBNV`) — 7 dòng rải rác.
- `LoansHeading.tsx` dòng 10: alt text bị lỗi encoding `"Kho?n vay ph? bi?n"` (đáng lẽ
  `"Khoản vay phổ biến"`).

## 5. Tổng kết nhanh cho task #2656 (sau cập nhật 2026-11-03)

Đã giải quyết:

1. `InfoCardCarousel`, `HeaderSection`, `ExclusiveTouchCarousel`, `MarketingAction` nay nhận
   props để ghi đè nội dung (4.0) — hạ tầng để hiển thị dữ liệu thật đã sẵn sàng.
2. `buildHomeComponents`/`buildMarketingComponents` + `SimulationThemeConfig` tạo 1 điểm lắp
   layout dùng chung, và `BackgroundMainPreview` đã migrate sang builder này, giảm trùng lặp
   code lắp `homeComponents` thủ công.

Vẫn còn thiếu / cần làm tiếp để preview `BackgroundMainPreview` phản ánh đúng layout "Trang chủ"
thật và đạt AC của ticket #2656:

1. `mapBackgroundMainPreviewModelToThemeConfig` (mapper riêng của `BackgroundMainPreview`) hiện
   **chưa** truyền `cards` cho `infoCards`, nên phần text (title/duration/document/amount) của
   card "Ưu đãi hấp dẫn khác" trong preview này **vẫn đang là dữ liệu mẫu**, dù
   `InfoCardCarousel` đã có khả năng nhận dữ liệu thật — cần xác nhận nguồn dữ liệu thật trước
   khi nối `cards` vào mapper.
2. Không có token/biến thiết bị trong `iphone-preview` để test AC8 (nhiều loại màn
   hình/safe-area) mà không sửa code cứng — **chưa đổi**.
3. `PopupPreview.tsx` vẫn dùng `defaultHomeComponents` tĩnh (thiếu `ExclusiveTouchCarousel`) —
   không thuộc phạm vi task #2656 (không phải `BackgroundMainPreview`) nhưng nên lưu ý nếu phạm
   vi mở rộng sau này.
4. Trước khi sửa style trong `HeaderSection`/`FeatureMenu`/`LoansHeading`/`InfoCardCarousel`/
   `ExclusiveTouchCarousel`/`Spacer`/`SimulationLayout`/`buildHomeComponents` để khớp Figma, cần
   audit lại các consumer khác liệt kê ở mục 3 — các file này (kể cả builder) giờ được dùng
   chung bởi `simulationModalContent.tsx` và `SplashScreenMarketingPreview.tsx` ngoài
   `BackgroundMainPreview`, nên blast radius không giảm so với trước, chỉ gọn code hơn.
5. Các hardcode/dead-code còn lại ở mục 4.1–4.4 (PopupAdv text, nhãn "Điền mã VIP" trùng lặp,
   component song song HomeBannerCarousel/ExclusiveTouchCarousel, comment chết trong
   ExclusiveTouchCarousel/ProductLayout, alt text lỗi encoding ở LoansHeading) — **chưa đổi**,
   vẫn giữ nguyên hiện trạng như audit 2026-11-02.
