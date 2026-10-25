# demo-layout

**Bản phác thảo UI dùng để chốt quyết định, không phải code production.**
Dựng để trình bày cho team HDS Admin và chốt các điểm còn mở về cách tổ chức
layout cho một màn danh sách có kéo thả sắp xếp thứ tự + form cài đặt.

## Đây KHÔNG phải

- Không phải HDS Admin thật. Không path API thật, không permission constant
  thật, không tên module thật, không dòng code nào copy từ repo HDS.
- Không phải nguồn sự thật cho quyết định cuối cùng — sau khi team chốt, quyết
  định phải chuyển thành rule trong `.claude/rules/` của repo HDS Admin, không
  nằm lại ở đây.

## Dữ liệu

Toàn bộ dữ liệu trong `src/data/demo-data.ts` là **sinh ngẫu nhiên**, chỉ giữ
đúng *hình dáng* dữ liệu thật (độ dài tên, định dạng tiền, phân bố trạng thái).
File này được commit và deploy lên GitHub Pages.

Repo này là **private nhưng trang deploy công khai trên internet** — đây là
giới hạn của GitHub Pages trên tài khoản cá nhân (site riêng tư chỉ có với
organization trên GitHub Enterprise Cloud). Vì vậy:

- **Không bao giờ** đưa dữ liệu thật/nhạy cảm vào `src/data/demo-data.ts` hay
  bất kỳ file nào được commit.
- Nếu cần demo với dữ liệu thật (hình dáng giống thật hơn), dùng nút
  **"Nhập dữ liệu local"** trong app để nạp một file JSON từ máy — file đó
  không bao giờ được commit. Thư mục `local-data/` nằm trong `.gitignore`
  chính vì lý do này; đặt file ở đó nếu muốn giữ nó trên máy giữa các lần demo.

## Chạy local

```bash
npm install
npm run dev
```

## Build + kiểm tra

```bash
npm run typecheck
npm run build
```

`npm run build` cũng copy `dist/index.html` thành `dist/404.html`, vì GitHub
Pages không có server-side rewrite — nếu không làm vậy, một deep link như
`/offer-types/offer-5` sẽ trả 404 trước khi app kịp load.

## Deploy

GitHub Actions (`.github/workflows/deploy-pages.yml`) build và deploy lên
GitHub Pages ở mỗi lần push nhánh `main`. Không commit thư mục `dist`.

## Stack

Vite + React 18 + TypeScript, Ant Design 5, React Router 7, TanStack Query 5,
dnd-kit. Soi theo stack HDS Admin để code demo dễ đối chiếu, nhưng không mang
theo Redux, React Hook Form, hay i18next — những thứ không cần cho bản phác
thảo này.

## Hai nền layout đang so sánh

- **A — Drawer gắn child route**: `/offer-types/:id`, `/offer-types/create`.
  List không unmount khi Drawer mở.
- **B — Full page**: `/offer-types/:id/edit`. Có nút "Mở toàn trang" trong
  Drawer để chuyển sang nền B cho đúng item.

Form (`OfferTypeForm`) dùng chung cho cả hai nền — không biết nó đang nằm
trong Drawer hay trang.

## Ba thí nghiệm (đang bổ sung)

1. Guard unsaved-changes khi đóng overlay bằng Hủy / X / mask / ESC.
2. Kéo thả sắp xếp thứ tự trên danh sách có phân trang — 3 chế độ.
3. Lỗi validation nằm trên tab đang ẩn, so với layout section + Anchor.

Xem `/decisions` trong app để biết trạng thái từng điểm quyết định.
