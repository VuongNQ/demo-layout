# API Import Excel sản phẩm vay — tài liệu tích hợp FE

Service: **admin-api** · Base path: `/portal/v1/schemes/import` · Local: `http://localhost:8182`
Header chung: `Authorization: Bearer <token>`, `Content-Type: application/json`

## Luồng gọi

```
1. POST /presigned-upload-url   { fileName, contentType }        -> { key, url, method }
2. PUT  <url>                   body = file .xlsx                 -- gọi thẳng S3, Content-Type giống bước 1
3. POST /validate               { key }                           -> stage + Preview; PASSED thì có importId
4. POST /publish                { importId | itemIds, displaySetCode }
```

---

## 1. Lấy presigned URL upload file

`POST /portal/v1/schemes/import/presigned-upload-url` · Quyền: `product:create:cash_loan`

**Request**
```json
{
  "fileName": "Template_Import_SanPhamVay.xlsx",
  "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}
```
| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| fileName | string | Có | Phải đuôi `.xlsx` |
| contentType | string | Có | Chỉ nhận content type .xlsx ở trên; sai → 400 `IF001` |

**Response 200**
```json
{
  "key": "content/1761123456789-3f2a.../Template_Import_SanPhamVay.xlsx",
  "url": "https://<bucket>.s3...amazonaws.com/content/...?X-Amz-Signature=...",
  "method": "PUT",
  "expiresAt": "2026-10-22T15:30:00+07:00"
}
```
FE `PUT` file lên `url` với đúng `Content-Type` đã gửi, giữ `key` để gọi bước 3.

---

## 2. Kiểm tra file (nút Kiểm tra)

`POST /portal/v1/schemes/import/validate`

**Request**
```json
{ "key": "content/1761123456789-3f2a.../Template_Import_SanPhamVay.xlsx" }
```
| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| key | string | Có | `key` từ bước 1. Không thuộc `content/` hoặc chưa upload xong → 400 `IF001` |

### 2.1 Thứ tự kiểm tra và màn hình theo `stage`

Hệ thống kiểm tra lần lượt 3 tầng, **tầng trước hết lỗi mới chạy tầng sau**. Field `stage` cho biết dừng ở tầng nào:

| `stage` | `valid` | Nghĩa | FE hiển thị |
|---|---|---|---|
| `FILE` | false | Sai cấu trúc file (đuôi, dung lượng, sheet, header, số dòng) | Khối lỗi "File chưa đúng cấu trúc — «n» lỗi" từ `fileErrors`. `rows` rỗng, `summary` toàn 0 |
| `FORMAT` | false | Đọc được file nhưng còn lỗi định dạng / logic giữa các ô | Preview tô đỏ ô lỗi, nút Import disable |
| `REFERENCE` | false | Đã qua định dạng, còn dữ liệu không khớp hệ thống (mã không tồn tại, đã tồn tại, không hoạt động) | Preview tô đỏ ô lỗi, nút Import disable |
| `PASSED` | true | Hết lỗi, đã phân loại dòng | **Màn phân loại** theo `rows[].category`, nút Import enable, có `importId` |

Lưu ý:
- Một lần kiểm tra chỉ trả **một loại** lỗi ô: còn lỗi `FORMAT` thì chưa có lỗi `REFERENCE`. Sửa hết lỗi `FORMAT` rồi kiểm tra lại mới thấy lỗi `REFERENCE` (nếu có).
- Khi `stage = FORMAT`, dòng `VALID` chỉ nghĩa là chưa có lỗi định dạng; dòng đó vẫn có thể bị lỗi `REFERENCE` ở lần kiểm tra sau.

### 2.2 Response — `stage = PASSED`

```json
{
  "key": "content/.../Template_Import_SanPhamVay.xlsx",
  "fileName": "Template_Import_SanPhamVay.xlsx",
  "valid": true,
  "stage": "PASSED",
  "importId": 15,
  "fileErrors": [],
  "summary": {
    "totalRows": 3, "validRows": 3, "invalidRows": 0, "errorCells": 0,
    "createRows": 2, "updateRows": 1, "reviewRows": 0, "unchangedRows": 1
  },
  "columns": [],
  "rows": [
    {
      "rowNumber": 2,
      "itemId": 101,
      "importType": "CREATE",
      "category": "NEW",
      "reviewReasons": [],
      "status": "VALID",
      "errorCells": 0,
      "cells": [
        {
          "columnIndex": 1, "column": "A", "header": "Mã sản phẩm*",
          "rawValue": "SP01", "value": "SP01", "source": "INPUT", "errors": []
        },
        {
          "columnIndex": 9, "column": "I", "header": "Loại hạn mức vay",
          "rawValue": null, "value": "Khoảng", "source": "DERIVED", "errors": []
        },
        {
          "columnIndex": 16, "column": "P", "header": "Đơn vị",
          "rawValue": null, "value": "Theo năm", "source": "DEFAULT", "errors": []
        }
      ]
    }
  ]
}
```

### 2.3 Response — còn lỗi ô (`stage = FORMAT` / `REFERENCE`)

```json
{
  "key": "content/.../Template_Import_SanPhamVay.xlsx",
  "fileName": "Template_Import_SanPhamVay.xlsx",
  "valid": false,
  "stage": "FORMAT",
  "importId": null,
  "fileErrors": [],
  "summary": {
    "totalRows": 3, "validRows": 2, "invalidRows": 1, "errorCells": 2,
    "createRows": 3, "updateRows": 0, "reviewRows": 0, "unchangedRows": 0
  },
  "columns": [
    { "columnIndex": 10, "column": "J", "header": "Số tiền vay tối thiểu*", "errorCells": 1 },
    { "columnIndex": 11, "column": "K", "header": "Số tiền vay tối đa*", "errorCells": 1 }
  ],
  "rows": [
    {
      "rowNumber": 3,
      "itemId": null,
      "importType": "CREATE",
      "category": null,
      "reviewReasons": [],
      "status": "INVALID",
      "errorCells": 2,
      "cells": [
        {
          "columnIndex": 10, "column": "J", "header": "Số tiền vay tối thiểu*",
          "rawValue": "10000000", "value": "10000000", "source": "INPUT",
          "errors": [
            {
              "code": "PORTAL_CV_PRDIMP_001",
              "message": "Số tiền vay tối đa đang nhỏ hơn số tiền vay tối thiểu",
              "type": "FORMAT"
            }
          ]
        }
      ]
    }
  ]
}
```
Với `stage = REFERENCE` cấu trúc giống hệt, chỉ khác `errors[].type = "REFERENCE"`, ví dụ:
```json
{ "code": "PORTAL_CV_PRDIMP_056", "message": "Ngành hàng không tồn tại hoặc hoạt động", "type": "REFERENCE" }
```

### 2.4 Response — `stage = FILE`

```json
{
  "key": "content/.../Template_Cu.xlsx",
  "fileName": "Template_Cu.xlsx",
  "valid": false,
  "stage": "FILE",
  "importId": null,
  "fileErrors": [
    { "code": "PORTAL_CV_PRDIMP_026", "message": "Cột 13 có tiêu đề \"Bước nhảy thời hạn vay\", tiêu đề đúng là \"Thời gian tối thiểu*\"" },
    { "code": "PORTAL_CV_PRDIMP_028", "message": "Thừa cột \"Bộ hiển thị\" tại vị trí 24" }
  ],
  "summary": {
    "totalRows": 0, "validRows": 0, "invalidRows": 0, "errorCells": 0,
    "createRows": 0, "updateRows": 0, "reviewRows": 0, "unchangedRows": 0
  },
  "columns": [],
  "rows": []
}
```

### 2.5 Mô tả field

| Field | Kiểu | Ghi chú |
|---|---|---|
| valid | boolean | `true` khi không lỗi file và không ô lỗi (= `stage: PASSED`) → bật nút Import |
| stage | `FILE` \| `FORMAT` \| `REFERENCE` \| `PASSED` | Tầng kiểm tra dừng lại, xem 2.1 |
| importId | number \| null | Có khi `PASSED`; dùng để phát hành |
| fileErrors | `{code, message}[]` | Lỗi cấp file, chỉ có khi `stage = FILE` |
| summary.totalRows | number | Tổng số dòng dữ liệu (không tính dòng trống hoàn toàn) |
| summary.validRows / invalidRows | number | Số dòng không lỗi / có lỗi |
| summary.errorCells | number | Tổng số ô lỗi |
| summary.createRows / updateRows | number | Số dòng theo cột Loại Import |
| summary.reviewRows | number | Số dòng REVIEW (không phát hành); 0 khi chưa `PASSED` |
| summary.unchangedRows | number | Số dòng UNCHANGED (không phát hành); 0 khi chưa `PASSED` |
| columns | `{columnIndex, column, header, errorCells}[]` | Chip tổng hợp lỗi theo cột, chỉ gồm cột có lỗi, theo thứ tự cột |
| rows[].rowNumber | number | Số dòng trong Excel (dòng dữ liệu đầu = 2) |
| rows[].itemId | number \| null | Dùng để phát hành từng dòng; null khi chưa `PASSED` |
| rows[].importType | `CREATE` \| `UPDATE` \| null | null khi Loại Import trống / sai |
| rows[].category | xem bảng dưới \| null | null khi chưa `PASSED` |
| rows[].reviewReasons | string[] | Lý do REVIEW, rỗng với loại khác |
| rows[].status | `VALID` \| `INVALID` | Dòng có ô lỗi hay không |
| rows[].errorCells | number | Số ô lỗi của dòng |
| rows[].cells | CellResult[] | Đủ 22 ô theo thứ tự template |
| cells[].rawValue | string \| null | Giá trị gốc trong file; ô lỗi hiển thị giá trị này, null → "(trống)" |
| cells[].value | string \| null | Giá trị hệ thống sẽ lưu |
| cells[].source | `INPUT` \| `DERIVED` \| `DEFAULT` | `DERIVED` → nhãn "(tự suy ra)", `DEFAULT` → "(mặc định)" |
| cells[].errors | `{code, message, type}[]` | Tooltip "Mã – Nội dung"; không rỗng → viền đỏ |
| cells[].errors[].type | `FORMAT` \| `REFERENCE` | Loại lỗi, xem 2.6 |

**`rows[].category`** (chỉ có khi `PASSED`)

| Giá trị | Ý nghĩa | Phát hành được |
|---|---|---|
| `NEW` | Loại Import = Tạo mới | Có |
| `UPDATE` | Cập nhật, có ít nhất một ô khác giá trị hiện tại | Có |
| `REVIEW` | Hợp lệ nhưng cần xem lại, lý do trong `reviewReasons` | Không |
| `UNCHANGED` | Cập nhật nhưng mọi ô có nhập đều trùng giá trị hiện tại | Không |

**Giá trị tự suy ra / mặc định** (`source`)
- `DERIVED`: Loại hạn mức vay (cột I), Loại thời hạn vay (cột L) khi để trống
- `DEFAULT`: Đơn vị (cột P) để trống khi Tạo mới → "Theo năm"

### 2.6 Mã lỗi

**Lỗi cấp file (`fileErrors[].code`)** — `stage = FILE`

| Mã | Nội dung |
|---|---|
| PORTAL_CV_PRDIMP_013 | File «tên file» không đúng định dạng. Chỉ chấp nhận file .xlsx |
| PORTAL_CV_PRDIMP_014 | File «tên file» vượt dung lượng tối đa 5 MB |
| PORTAL_CV_PRDIMP_031 | Không đọc được file «tên file». File có thể bị hỏng hoặc đặt mật khẩu |
| PORTAL_CV_PRDIMP_017 | Không tìm thấy sheet "Template" trong file. Vui lòng dùng template mới nhất |
| PORTAL_CV_PRDIMP_026 | Cột «vị trí» có tiêu đề "«trong file»", tiêu đề đúng là "«template»" |
| PORTAL_CV_PRDIMP_027 | Thiếu cột "«tiêu đề»" tại vị trí «vị trí» |
| PORTAL_CV_PRDIMP_028 | Thừa cột "«tiêu đề»" tại vị trí «vị trí» |
| PORTAL_CV_PRDIMP_016 | File không có dữ liệu sản phẩm từ dòng 2 trở đi |
| PORTAL_CV_PRDIMP_015 | File có «n» dòng dữ liệu, vượt giới hạn 500 dòng mỗi lần import |

013 / 014 / 031 / 017 dừng ngay, chỉ trả một lỗi; các mã còn lại gom đủ rồi trả một lần.

**Lỗi ô `type = FORMAT`** — `stage = FORMAT`

| Mã | Nội dung | Ô tô đỏ |
|---|---|---|
| PORTAL_CV_PRDIMP_001 | Số tiền vay tối đa đang nhỏ hơn số tiền vay tối thiểu | J, K |
| PORTAL_CV_PRDIMP_002 | Thời hạn vay tối đa nhỏ hơn thời hạn vay tối thiểu | M, N |
| PORTAL_CV_PRDIMP_003 | Sản phẩm không có mã vip hoặc tập xem | R, S |
| PORTAL_CV_PRDIMP_004 | Sản phẩm không tồn tại cùng lúc mã vip và tập xem | R, S |
| PORTAL_CV_PRDIMP_005 | Mã VIP chỉ bao gồm chữ và số nguyên | S |
| PORTAL_CV_PRDIMP_007 | Trường thông tin «tên cột» không được bỏ trống | Ô bắt buộc đang trống |
| PORTAL_CV_PRDIMP_008 | Loại hạn mức vay không khớp với Số tiền vay tối thiểu và tối đa | I, J, K |
| PORTAL_CV_PRDIMP_009 | Loại thời hạn vay không khớp với Thời gian tối thiểu và tối đa | L, M, N |
| PORTAL_CV_PRDIMP_011 | Mã sản phẩm «mã» bị trùng với dòng «danh sách dòng» trong file | A (mọi dòng trùng) |
| PORTAL_CV_PRDIMP_024 | Thời hạn vay nhiều giá trị không nhập Thời gian tối đa | M, N |
| PORTAL_CV_PRDIMP_025 | Thời gian tối thiểu nhiều giá trị chỉ gồm số nguyên dương, không trùng, cách nhau dấu "," | M |
| PORTAL_CV_PRDIMP_032 | Giá trị "«giá trị»" không thuộc danh sách cho phép của cột «tên cột» | C, I, L, P |
| PRD_INVALID_INTEGER | «tên cột» phải là số nguyên | Ô sai |
| PRD_INVALID_POSITIVE_INTEGER | «tên cột» phải là số nguyên dương, không có dấu phân cách | Ô sai |
| PRD_INVALID_NUMBER | «tên cột» phải là số | Ô sai |
| PRD_INVALID_DISPLAY_SCHEDULE | Lịch hiển thị sai định dạng | H |
| PRD_DISPLAY_SCHEDULE_START_AFTER_END | Ngày bắt đầu hiển thị phải trước ngày kết thúc | H |

**Lỗi ô `type = REFERENCE`** — `stage = REFERENCE`

| Mã | Nội dung | Ô tô đỏ |
|---|---|---|
| PORTAL_CV_PRDIMP_010 | Mã sản phẩm «mã» đã tồn tại trên hệ thống (dòng Tạo mới) | A |
| PORTAL_CV_PRDIMP_033 | Mã sản phẩm «mã» không tồn tại trong danh sách sản phẩm vay (dòng Cập nhật) | A |
| PORTAL_CV_PRDIMP_056 | Ngành hàng không tồn tại hoặc hoạt động / Không được thay đổi Ngành hàng của sản phẩm khi cập nhật | D |
| PORTAL_CV_PRDIMP_006 | Tập khách hàng không tồn tại hoặc không khả dụng | R, T, U |
| PRD_NOT_FOUND | «tên cột» không tồn tại: «danh sách mã» | E (Nhãn), Q (Bảo hiểm), V (Ưu đãi tặng kèm) |

### 2.7 Thứ tự 22 cột template

Header dòng 1, sheet `Template`. Không có cột Bước nhảy thời hạn vay (luôn = 1) và cột Bộ hiển thị (chọn trên popup).

| # | Cột | Header | # | Cột | Header |
|---|---|---|---|---|---|
| 1 | A | Mã sản phẩm* | 12 | L | Loại thời hạn vay |
| 2 | B | Tên sản phẩm* | 13 | M | Thời gian tối thiểu* |
| 3 | C | Loại Import* | 14 | N | Thời gian tối đa* |
| 4 | D | Ngành hàng* | 15 | O | Lãi suất theo dư nợ giảm dần* |
| 5 | E | Nhãn | 16 | P | Đơn vị |
| 6 | F | Hình ảnh sản phẩm | 17 | Q | Bảo hiểm khoản vay |
| 7 | G | Độ ưu tiên* | 18 | R | Tập Xem** |
| 8 | H | Lịch hiển thị | 19 | S | Tập xem theo mã VIP** |
| 9 | I | Loại hạn mức vay | 20 | T | Tập Áp dụng |
| 10 | J | Số tiền vay tối thiểu* | 21 | U | Tập Loại trừ |
| 11 | K | Số tiền vay tối đa* | 22 | V | Ưu đãi tặng kèm |

Cột `*` bắt buộc khi Tạo mới; Cập nhật chỉ bắt buộc Mã sản phẩm và Loại Import, ô trống = giữ nguyên giá trị hiện tại. Cột `**` bắt buộc nhập 1 trong 2 khi Tạo mới.

---

## 3. Phát hành (nút Import → Xác nhận)

`POST /portal/v1/schemes/import/publish` · Quyền: `product:create:cash_loan`

Chỉ gọi khi `/validate` trả `stage = PASSED`.

**Request — phát hành cả phiên**
```json
{ "importId": 15, "displaySetCode": "DS01" }
```
**Request — phát hành từng dòng**
```json
{ "itemIds": [101, 103], "displaySetCode": "DS01" }
```
| Field | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| importId | number | Khi không có itemIds | Phát hành mọi dòng NEW / UPDATE chưa phát hành của phiên |
| itemIds | number[] | Không | Có thì chỉ phát hành các dòng này; phải cùng một phiên; không được `[]` |
| displaySetCode | string | Có | Bộ hiển thị chọn trên popup Import. Hiện BE nhận nhưng chưa dùng |

**Response 200**
```json
{
  "importId": 15,
  "importCode": "IMP202610220001",
  "fileName": "Template_Import_SanPhamVay.xlsx",
  "publishStatus": "PUBLISHED",
  "totalRows": 3,
  "newRows": 2,
  "updateRows": 0,
  "reviewRows": 0,
  "unchangedRows": 1,
  "publishedRows": 2,
  "publishedAt": "2026-10-22T14:05:11.123+07:00",
  "publishedBy": "admin@hdsaison.com.vn",
  "publishedItems": [
    { "itemId": 101, "rowNumber": 2, "productCode": "SP01", "category": "NEW", "productId": 501, "publishStatus": "PUBLISHED" }
  ],
  "reviewItems": []
}
```
| Field | Ghi chú |
|---|---|
| importCode | Mã import `IMP + yyyyMMdd + 4 số`, sinh ở lần phát hành đầu tiên của phiên, các lần sau giữ nguyên; dùng cho toast "Mã import: …" |
| publishStatus | Trạng thái phiên, xem bảng dưới |
| newRows / updateRows / reviewRows / unchangedRows | Số dòng theo phân loại sau lần phát hành này |
| publishedRows | Tổng số dòng đã phát hành của phiên (cộng dồn các lần) |
| publishedItems | Các dòng vừa phát hành trong lần gọi này; `productId` là sản phẩm vừa tạo / cập nhật |
| reviewItems | Các dòng lần này kiểm tra lại thấy lỗi (dữ liệu hệ thống đã đổi sau lúc Kiểm tra) nên chuyển REVIEW, không phát hành: `{itemId, rowNumber, productCode, reviewReasons}` |

**`publishStatus`**

| Giá trị | Ý nghĩa |
|---|---|
| `PENDING` | Chưa phát hành dòng nào |
| `PARTIALLY_PUBLISHED` | Đã phát hành một phần, còn dòng NEW / UPDATE chưa phát hành |
| `PUBLISHED` | Đã phát hành hết dòng NEW / UPDATE; gọi tiếp → 409 |

Dòng REVIEW / UNCHANGED không bao giờ được phát hành và không tính khi xét phiên đã phát hành hết.

**Lỗi**

| HTTP | Khi nào |
|---|---|
| 400 | Thiếu `displaySetCode`; không có cả `importId` lẫn `itemIds`; `itemIds` rỗng / chứa null; `itemIds` thuộc nhiều phiên |
| 404 | Không tìm thấy phiên / dòng |
| 409 | Phiên đã PUBLISHED; dòng đã phát hành; dòng REVIEW / UNCHANGED; mã Tạo mới vừa bị người khác tạo trùng hoặc sản phẩm Cập nhật không còn tồn tại; phiên không còn dòng để phát hành |

---

## Đối chiếu với FE hiện tại (2026-11-05, revision `8562c125`)

> Bổ sung từ phiên tài liệu hóa `docs/modules/products/scheme-sync.md` §6. Nội dung các phần trên **không bị sửa**; các điểm dưới đây là chênh lệch cụ thể phát hiện khi đọc trực tiếp
> `src/services/products/scheme-import.service.ts`, `scheme-import.types.ts`, và
> `src/modules/products/configuration/scheme-sync/import/`. Mỗi điểm đánh dấu theo quy ước
> `docs/modules/TEMPLATE.md`: `CONFIRMED` (đọc trực tiếp từ FE source), `NEEDS-VERIFICATION`
> (cần xác nhận với backend thật, không thể quyết định chỉ từ FE).

1. **§3 heading "Phát hành (nút Import → Xác nhận)" — CONFIRMED sai mô tả hành vi FE.** Trong `ImportPreviewModal`, nút Xác nhận (Import) chỉ đóng modal và hiển thị kết quả phiên đã được validate — **không** gọi `/publish`. Phát hành là một hành động riêng, ở màn `PublishModal` của module `scheme-sync` cha, thực hiện sau và độc lập với bước xác nhận import.
2. **Thời điểm có `importCode` — mâu thuẫn, NEEDS-VERIFICATION với backend.** Tài liệu này (dòng ~344) nói `importCode` sinh ở lần phát hành đầu tiên. FE đọc và hiển thị `importCode` ngay từ response `/validate` (toast thành công sau xác nhận dùng `result.importCode`). Một trong hai phía đang mô tả sai hành vi backend thật; FE source không tự quyết định được bên nào đúng.
3. **"(trống)" cho `rawValue` null ở ô lỗi (mục 2.5) — CONFIRMED khác FE.** FE ưu tiên hiển thị `value` khi `rawValue` là null ở ô lỗi; chỉ hiện "(trống)" khi cả `rawValue` và `value` đều null.
4. **Tooltip lỗi "Mã – Nội dung" (mục 2.5) — CONFIRMED khác FE.** FE hiện chỉ hiển thị `message`, không hiển thị `code`, trong tooltip ô lỗi.
5. **`displaySetCode` bắt buộc (mục 3) — CONFIRMED khác kiểu FE.** Type FE (`PublishImportRequest`) khai báo `displaySetCode` là optional, không bắt buộc ở tầng kiểu; UI phát hành import hiện luôn gửi giá trị này khi người dùng chọn phát hành, nhưng ràng buộc "bắt buộc" không được FE tầng kiểu khẳng định.
6. **Quyền `product:create:cash_loan` (mục 1, 3) — CONFIRMED khác cổng FE.** FE gate toàn bộ luồng Import (mở modal, mọi mutation) bằng một quyền duy nhất, `product_scheme_sync_classification:edit` (hằng số tại `src/constants/permission.constant.ts:155-158`), không dùng `product:create:cash_loan`. Việc backend có áp `product:create:cash_loan` riêng ở các endpoint `presigned-upload-url`/`publish` hay không là `NEEDS-VERIFICATION`.
7. **Endpoint chưa được tài liệu hóa ở đây — không mâu thuẫn, chỉ thiếu.** FE còn gọi `GET .../template`, `GET .../{importId}/file`, `GET .../histories`, `GET .../items/{importId}`, `GET .../summary[/{importId}]`, và `GET/{id}` dưới `api/admin/portal/v1/schemes/publish/histories` — không mô tả trong tài liệu này.

Toàn bộ 4 bước chính (presigned URL → PUT S3 → validate → publish), enum `stage`/`category`/`cells[].source`, và cấu trúc 22 cột template (mục 2.7) đã được đối chiếu và **khớp** với FE hiện tại.
