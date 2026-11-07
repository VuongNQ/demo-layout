# Biến môi trường — HDS Admin Portal

Bảng tra cứu và điền giá trị thực tế cho từng môi trường. Copy từ phần
"Biến môi trường" trong [`README.md`](../README.md); xem file đó để biết
giải thích chi tiết, quy tắc Vite (`VITE_*`), và lưu ý bảo mật.

> Giá trị `VITE_*` được nhúng vào bundle JS lúc build (không phải runtime) —
> đổi giá trị đồng nghĩa với phải build lại. Không điền secret/credential
> thật vào các biến bắt buộc; chúng chỉ nên là URL/ID cấu hình công khai.

## 1. Mô tả biến

### Biến bắt buộc

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `VITE_FE_HOST` | ✅ | Địa chỉ gốc (origin) của chính ứng dụng FE; dùng để dựng `redirectUri` cho MSAL (`${VITE_FE_HOST}/redirect`) — phải khớp URI đã đăng ký trên Microsoft Entra admin center/App Registration. |
| `VITE_API_HOST` | ✅ | Địa chỉ gốc của API Gateway backend. Mọi request qua `ApiFetcher` dùng host này làm base URL. |
| `VITE_MSAL_TENANT_ID` | ✅ | Tenant ID (GUID) của tổ chức trên Microsoft Entra ID (Azure AD). |
| `VITE_MSAL_APP_ID` | ✅ | Client ID (Application ID) của App Registration dùng cho đăng nhập MSAL. |
| `VITE_MSAL_APP_ID_AUDIENCES` | ✅ | Danh sách scope (phân tách bằng khoảng trắng) yêu cầu khi đăng nhập, ví dụ `api://<app-id>/access_as_user openid profile offline_access`. |

### Biến đã khai báo kiểu nhưng chưa dùng trong luồng hiện tại

Chỉ điền giá trị nếu team xác nhận cần dùng thật (`NEEDS-TEAM-DECISION`, xem README).

| Biến | Mô tả |
|---|---|
| `VITE_MICROSOFT_GRAPH_URL` | Dự kiến endpoint gốc Microsoft Graph API; chưa có nơi gọi thực tế trong `src/`. |
| `VITE_LATEST_FE_HOST` | Dự phòng cho FE host của môi trường "latest/staging"; chưa dùng. |
| `VITE_LATEST_API_HOST` | Dự phòng cho API host của môi trường "latest/staging"; chưa dùng. |
| `VITE_PROD_FE_HOST` | Dự phòng cho FE host của môi trường production; chưa dùng. |
| `VITE_PROD_API_HOST` | Dự phòng cho API host của môi trường production; chưa dùng. |

## 2. Giá trị môi trường Dev

| Biến | Giá trị |
|---|---|
| `VITE_FE_HOST` | https://admin-dci.hangtragop.info.vn |
| `VITE_API_HOST` | https://admin-gw-dci.hangtragop.info.vn/api/admin/portal |
| `VITE_MSAL_TENANT_ID` | 1868e6bf-ca11-4031-b80b-47af3bef756f |
| `VITE_MSAL_APP_ID` | e02beec4-642f-44c6-aa21-01af9486948f |
| `VITE_MSAL_APP_ID_AUDIENCES` | api://b7db7ee5-6f5a-4fbf-b758-46a7f0a93187/access_as_user openid profile offline_access |

## 3. Giá trị môi trường UAT

| Biến | Giá trị |
|---|---|
| `VITE_FE_HOST` | https://mdmc.hangtragop.vn |
| `VITE_API_HOST` | https://mdmc-gw.hangtragop.vn/api/admin/portal |
| `VITE_MSAL_TENANT_ID` | |
| `VITE_MSAL_APP_ID` | |
| `VITE_MSAL_APP_ID_AUDIENCES` | |
