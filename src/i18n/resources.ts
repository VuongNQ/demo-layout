const experimentExtra = {
  vi: { leaveTitle: 'Rời khỏi trang?', leaveContent: 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời khỏi?', leave: 'Rời khỏi', stay: 'Ở lại', log: 'Nhật ký', clearLog: 'Xóa nhật ký', noEvents: 'Chưa có sự kiện nào.' },
  en: { leaveTitle: 'Leave this page?', leaveContent: 'You have unsaved changes. Are you sure you want to leave?', leave: 'Leave', stay: 'Stay', log: 'Event log', clearLog: 'Clear log', noEvents: 'No events yet.' }
} as const;

const pageExtra = {
  vi: {
    promotion: { saved: 'Đã lưu.' },
    forms: { feeTitle: 'Biểu phí: {{name}}', addOnTitle: 'Sản phẩm kèm theo: {{name}}', back: '← Quay lại danh sách', importLocal: 'Nhập dữ liệu local', importArrayError: 'Tệp JSON phải là một mảng OfferType[]', importSuccess: 'Đã nạp {{count}} bản ghi từ tệp local.', importError: 'Không thể đọc tệp: {{message}}' },
    offer: { importAction: 'Nhập dữ liệu local' },
    experiments: { status: 'Trạng thái' }
  },
  en: {
    promotion: { saved: 'Saved.' },
    forms: { feeTitle: 'Fee: {{name}}', addOnTitle: 'Add-on product: {{name}}', back: '← Back to list', importLocal: 'Import local data', importArrayError: 'JSON file must contain an OfferType[] array', importSuccess: 'Loaded {{count}} records from the local file.', importError: 'Could not read file: {{message}}' },
    offer: { importAction: 'Import local data' },
    experiments: { status: 'Status' }
  }
} as const;

const baseResources = {
  vi: {
    common: {
      language: 'Ngôn ngữ', vietnamese: 'Tiếng Việt', english: 'English',
      platforms: 'Nền tảng', claude: 'Claude', chatgpt: 'ChatGPT', compare: 'So sánh',
      open: 'Mở', prototype: 'Bản phác thảo', fictional: 'Dữ liệu hư cấu',
      save: 'Lưu', cancel: 'Hủy', close: 'Đóng', clear: 'Xóa', loading: 'Đang tải…', discardChanges: 'Hủy thay đổi', unsavedChanges: 'Có thay đổi chưa lưu', leavePage: 'Rời khỏi trang?', unsavedConfirm: 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời khỏi?', leave: 'Rời khỏi', stay: 'Ở lại',
      available: 'Khả dụng', unavailable: 'Chưa khả dụng', legacyUrl: 'URL tương thích cũ', documentTitle: 'Demo layout — bản phác thảo'
    },
    navigation: {
      switcher: 'Chuyển nền tảng', primary: 'Điều hướng chính', breadcrumb: 'Đường dẫn',
      landing: 'Chọn nền tảng', workspace: 'Không gian làm việc', home: 'Trang chủ',
      products: 'Sản phẩm', offerManagement: 'Quản lý ưu đãi', offerTypes: 'Loại ưu đãi',
      productSync: 'Đồng bộ sản phẩm', productSettings: 'Cài đặt sản phẩm', productLabels: 'Nhãn sản phẩm', productParameters: 'Tham số sản phẩm',
      fees: 'Biểu phí', promotions: 'Khuyến mãi', promotionTypes: 'Loại khuyến mãi',
      requiredInformation: 'Thông tin bắt buộc', displayInformationSets: 'Bộ hiển thị', addOns: 'Sản phẩm kèm theo',
      popularLoans: 'Vay phổ biến', attractiveOffer: 'Ưu đãi nổi bật', exclusiveTouch: 'Gán theo loại hiển thị',
      system: 'Hệ thống', backgroundManagement: 'Quản lý ảnh nền', backgroundLocks: 'Cài đặt ảnh nền',
      experiments: 'Thí nghiệm', unsaved: '1. Bảo vệ thay đổi chưa lưu', reorder: '2. Sắp xếp và phân trang',
      tabs: '3. Tab và liên kết neo', decisions: 'Quyết định bố cục', demoFooter: 'Demo layout v0.1 — nội bộ, không công khai',
      landingTitle: 'Chọn không gian làm việc', landingIntro: 'Đây là các bản mẫu thiết kế hư cấu để đánh giá. Chọn nền tảng để khám phá màn hình hoặc so sánh cùng một tác vụ giữa các đề xuất.',
      landingClaude: 'Khám phá bản mẫu hiện có, biểu mẫu, drawer và thí nghiệm bố cục.', landingChatgpt: 'Đánh giá không gian vận hành độc lập và showcase Design System.',
      landingCompare: 'Thực hiện các kịch bản hư cấu song song và ghi nhận quan sát, quyết định.', landingNote: 'Nội dung dùng dữ liệu hư cấu. Đề xuất ghi trong Compare không phải quyết định được phê duyệt cho sản phẩm.',
      missingBreadcrumb: 'Tuyến này không có breadcrumb vì không có mục menu (giống ca background-main-lock trong repo tham chiếu).'
    },
    claude: {
      shellTitle: 'Demo layout — bản phác thảo (không phải HDS Admin thật)',
      notFound: 'Không tìm thấy tuyến', search: 'Tìm kiếm', filter: 'Lọc', actions: 'Thao tác',
      configure: 'Cài đặt', status: 'Trạng thái', code: 'Mã', name: 'Tên', feeName: 'Tên phí', effectiveDate: 'Ngày hiệu lực',
      active: 'Đang hoạt động', inactive: 'Ngừng hoạt động', standalone: 'Độc lập', cashLoan: 'Vay tiền mặt',
      creditCard: 'Thẻ tín dụng', offsetLoan: 'Vay cấn trừ', application: 'Áp dụng', value: 'Giá trị',
      addOnName: 'Tên sản phẩm', distribution: 'Phân phối', partner: 'Đối tác liên kết', fee: 'Phí',
      activateSelected: 'Kích hoạt mục đã chọn', deactivateSelected: 'Vô hiệu hóa mục đã chọn',
      routeGap: 'Trang này không có mục trong menu điều hướng.',
      offer: { create: 'Tạo loại ưu đãi', settings: 'Cài đặt: {{name}}', fullPage: 'Mở toàn trang', cancel: 'Hủy', save: 'Lưu', name: 'Tên ưu đãi', status: 'Trạng thái', active: 'Đang hoạt động', draft: 'Bản nháp', inactive: 'Ngừng hoạt động', general: 'Thông tin chung', description: 'Mô tả', code: 'Mã', discountPercent: 'Giảm giá (%)', discountAmount: 'Giảm giá (số tiền)', minOrder: 'Giá trị đơn hàng tối thiểu', eligibility: 'Điều kiện áp dụng', segments: 'Phân khúc khách hàng', newCustomers: 'Khách hàng mới', vipCustomers: 'Khách hàng VIP', businessCustomers: 'Khách hàng doanh nghiệp', individualCustomers: 'Khách hàng cá nhân', requiresApproval: 'Cần phê duyệt', combinable: 'Có thể kết hợp', firstTimeOnly: 'Chỉ lần đầu', maxRedemptions: 'Số lần sử dụng tối đa', notifications: 'Thông báo', notifyExpiry: 'Thông báo khi hết hạn', channel: 'Kênh thông báo', email: 'Email', sms: 'SMS', push: 'Push', none: 'Không', ownerEmail: 'Email chủ sở hữu', reminderDays: 'Số ngày nhắc trước', reminderError: 'Không được nhắc trước quá 30 ngày', createNew: '+ Tạo mới', tableName: 'Tên', tableStatus: 'Trạng thái', order: 'Thứ tự', configure: 'Cài đặt' },
      productSettings: { general: 'Thông tin chung', productName: 'Tên sản phẩm', productCode: 'Mã sản phẩm', rateTiers: 'Biểu lãi suất theo hạn mức', baseRate: 'Lãi suất cơ bản (%)', from: 'Từ', to: 'Đến', rate: 'Lãi suất (%)', addTier: 'Thêm bậc lãi suất', customerConditions: 'Điều kiện khách hàng', audience: 'Đối tượng', individual: 'Cá nhân', business: 'Doanh nghiệp', minAge: 'Tuổi tối thiểu', maxAge: 'Tuổi tối đa', minRevenue: 'Doanh thu tối thiểu/năm', businessTypes: 'Loại hình doanh nghiệp', household: 'Hộ kinh doanh', limitedCompany: 'Công ty TNHH', jointStock: 'Công ty cổ phần', privateEnterprise: 'Doanh nghiệp tư nhân', requiredDocuments: 'Hồ sơ yêu cầu', documentName: 'Tên hồ sơ', required: 'Bắt buộc', addDocument: 'Thêm hồ sơ', advanced: 'Cấu hình nâng cao', enableAdvanced: 'Bật cấu hình nâng cao', approvalWorkflow: 'Luồng phê duyệt', automatic: 'Tự động', oneApprover: '1 người phê duyệt', committee: 'Hội đồng', riskThreshold: 'Ngưỡng điểm rủi ro', title: 'Cài đặt sản phẩm: {{name}}', saveSuccess: 'Đã lưu.', dirty: 'Có thay đổi chưa lưu — {{name}}', back: '← Quay lại danh sách', tierCount: 'Số bậc lãi suất', configure: 'Cài đặt' }
      ,forms: { required: 'Bắt buộc', feeCode: 'Mã phí', feeName: 'Tên phí', appliesTo: 'Áp dụng cho', feeType: 'Loại phí', unit: 'Đơn vị', value: 'Giá trị', effectiveDate: 'Ngày hiệu lực', addOnCode: 'Mã', addOnName: 'Tên sản phẩm', distribution: 'Phân phối', associatedPartner: 'Đối tác liên kết', feeVnd: 'Phí (VND)', promotionName: 'Tên khuyến mãi', promotionCode: 'Mã', offerType: 'Loại ưu đãi', startDate: 'Ngày bắt đầu', endDate: 'Ngày kết thúc', assignedProducts: 'Sản phẩm áp dụng', promotionTypeName: 'Tên loại khuyến mãi', code: 'Mã', status: 'Trạng thái', infoName: 'Tên thông tin', inputType: 'Kiểu nhập', supplyMethod: 'Cách cung cấp', previewImage: 'Ảnh xem trước', backgroundName: 'Tên', customerSegments: 'Phân khúc khách hàng', validity: 'Thời gian hiệu lực', fromDate: 'Từ ngày', toDate: 'Đến ngày' },
      pages: {
        sync: { matched: 'Khớp dữ liệu', mismatched: 'Lệch dữ liệu', pending: 'Đang chờ', run: 'Đồng bộ ngay', history: 'Lịch sử đồng bộ', product: 'Sản phẩm', status: 'Trạng thái', lastSync: 'Đồng bộ lần cuối', viewDiff: 'Xem khác biệt', close: 'Đóng', field: 'Trường', source: 'Nguồn', target: 'Đích', started: 'Bắt đầu', finished: 'Kết thúc', result: 'Kết quả', changes: 'Số thay đổi', operator: 'Người chạy', syncing: 'Đang đồng bộ', reconciling: 'Đang đối soát dữ liệu', processing: 'Đang xử lý…', complete: 'Hoàn tất', syncedCount: 'Đã đồng bộ {{count}} sản phẩm', prompt: 'Nhấn “Đồng bộ ngay” để bắt đầu.', success: 'Thành công', failed: 'Thất bại' },
        promotion: { add: 'Thêm khuyến mãi', code: 'Mã', name: 'Tên khuyến mãi', offerType: 'Loại ưu đãi', period: 'Hiệu lực', status: 'Trạng thái', edit: 'Sửa', createTitle: 'Thêm khuyến mãi', title: 'Khuyến mãi: {{name}}', created: 'Đã tạo khuyến mãi.', saved: 'Đã lưu.', back: '← Quay lại danh sách', cancel: 'Hủy', create: 'Tạo mới', startDate: 'Ngày bắt đầu', endDate: 'Ngày kết thúc', assignedProducts: 'Sản phẩm áp dụng', draft: 'Bản nháp', active: 'Đang hoạt động', expired: 'Hết hạn' },
        promotionType: { add: 'Thêm loại khuyến mãi', configure: 'Cài đặt: {{name}}', name: 'Tên loại khuyến mãi', code: 'Mã', status: 'Trạng thái', edit: 'Sửa', active: 'Đang hoạt động', inactive: 'Ngừng hoạt động', draft: 'Bản nháp', cancel: 'Hủy', save: 'Lưu' },
        requiredInfo: { code: 'Mã', name: 'Tên thông tin', inputType: 'Kiểu nhập', supplyMethod: 'Cách cung cấp', status: 'Trạng thái', configure: 'Cài đặt', title: 'Thông tin bắt buộc: {{name}}', history: 'Lịch sử thay đổi', time: 'Thời gian', actor: 'Người thực hiện', action: 'Hành động', back: '← Quay lại danh sách', saved: 'Đã lưu.', active: 'Đang hoạt động', inactive: 'Ngừng hoạt động', inputTypes: { TEXT: 'Văn bản', NUMBER: 'Số', EMAIL: 'Email', ADDRESS: 'Địa chỉ', DATE_TIME: 'Ngày giờ', PHONE_NUMBER: 'Số điện thoại', FAMILY_RELATIVE: 'Người thân', DROP_DOWN: 'Danh sách thả xuống', RADIO_GROUP: 'Nhóm lựa chọn' }, supplyMethods: { TYPING: 'Nhập liệu', SELECTION: 'Chọn', RADIO_GROUP: 'Nhóm lựa chọn', COMPOSED: 'Kết hợp' } },
        displaySet: { image: 'Ảnh', code: 'Mã', name: 'Tên bộ hiển thị', productLine: 'Dòng sản phẩm', app: 'Hiện ở App', web: 'Hiện ở Web', status: 'Trạng thái', configure: 'Cài đặt', imageLabel: 'Ảnh hiển thị', chooseImage: 'Chọn ảnh (demo, không tải ảnh thật)', cashLoan: 'Vay tiền mặt (CL)', creditCard: 'Thẻ tín dụng (CD)', labels: 'Nhãn sản phẩm', requiredSet: 'Bộ thông tin bắt buộc', fees: 'Biểu phí áp dụng', active: 'Đang hoạt động', inactive: 'Ngừng hoạt động', title: 'Bộ hiển thị: {{name}}', back: '← Quay lại danh sách', saved: 'Đã lưu.', productLines: { CL: 'Vay tiền mặt', CD: 'Thẻ tín dụng' } },
        background: { image: 'Ảnh', name: 'Tên', status: 'Trạng thái', segments: 'Phân khúc', order: 'Thứ tự', configure: 'Cài đặt', preview: 'Ảnh xem trước', chooseImage: 'Chọn ảnh (demo, không tải ảnh thật)', active: 'Đang hoạt động', draft: 'Bản nháp', inactive: 'Ngừng hoạt động', validity: 'Thời gian hiệu lực', from: 'Từ ngày', to: 'Đến ngày', cancel: 'Hủy', save: 'Lưu' },
        assigned: { empty: 'Chưa gán sản phẩm nào', add: 'Thêm sản phẩm vào danh sách', moveUp: 'Chuyển lên', moveDown: 'Chuyển xuống', remove: 'Xóa sản phẩm khỏi danh sách' },
        popularLoans: { title: 'Sản phẩm vay phổ biến', description: 'Chọn và sắp xếp các sản phẩm vay tiền mặt hiển thị trong mục “Phổ biến” trên ứng dụng.', dirty: 'Có thay đổi chưa lưu — Sản phẩm vay phổ biến', history: 'Lịch sử thay đổi', time: 'Thời gian', actor: 'Người thực hiện', action: 'Hành động', saved: 'Đã lưu.' },
        attractiveOffer: { title: 'Ưu đãi nổi bật', dirty: 'Có thay đổi chưa lưu — Ưu đãi nổi bật', enabled: 'Đang bật', disabled: 'Đang tắt', name: 'Tên ưu đãi', history: 'Lịch sử thay đổi', time: 'Thời gian', actor: 'Người thực hiện', action: 'Hành động', saved: 'Đã lưu.' },
        exclusiveTouch: { title: 'Gán sản phẩm theo loại hiển thị', search: 'Tìm theo tên loại', all: 'Tất cả trạng thái', active: 'Đang hoạt động', inactive: 'Ngừng hoạt động', type: 'Loại hiển thị', status: 'Trạng thái', count: 'Số sản phẩm đã gán', assign: 'Gán sản phẩm', mobilePreview: 'Xem trước trên di động', segments: 'Phân khúc khách hàng', startDate: 'Ngày bắt đầu', savePreview: 'Lưu bản xem trước', saved: 'Đã lưu bản xem trước.', sampleGrid: 'Mẫu lưới hiển thị', staticNote: 'Mẫu tĩnh, không phải dữ liệu thật.', drawerTitle: 'Gán sản phẩm: {{name}}', cancel: 'Hủy', save: 'Lưu' },
        experiments: { unsavedTitle: 'Thí nghiệm 1 — Bảo vệ thay đổi chưa lưu khi đóng lớp phủ', instruction: 'Nhập nội dung vào drawer rồi đóng bằng Hủy, nút X, bấm vào lớp phủ hoặc phím Escape. Xem nhật ký bên dưới để biết guard có được kích hoạt không.', localTitle: 'A — Drawer dùng state cục bộ (setOpen)', localDescription: 'Mô phỏng drawer không gắn với route — chỉ bật hoặc tắt bằng useState.', routeTitle: 'B — Drawer gắn với route con (navigate)', routeDescription: 'Mô phỏng drawer được mở và đóng bằng điều hướng route thực.', openDrawer: 'Mở drawer', drawerForm: 'Biểu mẫu demo (state cục bộ)', routeDrawerForm: 'Biểu mẫu demo (gắn route con)', note: 'Ghi chú (nhập nội dung rồi thử đóng)', dirty: 'Có thay đổi chưa lưu (isDirty = true), nhưng không có kiểm tra khi đóng.', guardedDirty: 'Có thay đổi chưa lưu (isDirty = true) — đóng bằng bất kỳ cách nào sẽ được guard kiểm tra.', clean: 'Chưa có thay đổi.', cancel: 'Hủy', save: 'Lưu', localClose: '[State cục bộ] Đóng qua {{source}} — không có điều hướng nên guard không được hỏi.', routeClose: '[Gắn route] Đóng qua {{source}} — điều hướng về danh sách nên guard được hỏi.', savedLog: '[Gắn route] Nhấn Lưu — demo giả định đã lưu, đặt isDirty về false rồi điều hướng.', genericDrawer: 'Drawer gắn với route', saveDemo: 'Lưu (demo, không lưu thật)', reorderTitle: 'Thí nghiệm 2 — Sắp xếp kéo thả trên danh sách phân trang', reorderIntro: 'Cùng một dữ liệu offer-type (120 mục), ba cách tải và sắp xếp khác nhau. NEEDS-TEAM-DECISION #8: chọn một chế độ cho mọi màn hình cần sắp xếp.', paginated: 'Phân trang (hiện tại)', sortMode: 'Chế độ sắp xếp riêng', positionMode: 'Nhập vị trí trực tiếp', pageBoundary: 'Thử ở trang 1: kéo mục xuống cuối danh sách rồi sang trang 2. Mục sẽ không chuyển sang trang 2 vì dnd-kit chỉ xử lý các mục đang hiển thị trên trang hiện tại. Đây là giới hạn của thao tác trên dữ liệu phân trang.', allItems: 'Tải toàn bộ danh sách (không phân trang) một lần. Có thể kéo mục từ đầu đến cuối mà không bị giới hạn bởi ranh giới trang. Chọn “Lưu thứ tự” để ghi thay đổi; trước khi lưu, thay đổi chỉ nằm trong trình duyệt.', keyboardMove: 'Không cần kéo thả: nhập vị trí mong muốn rồi nhấn Enter. Thao tác này áp dụng trên toàn danh sách nhưng kém trực quan hơn kéo thả.', saveOrder: 'Lưu thứ tự', dirtyNotice: 'Có thay đổi chưa lưu', name: 'Tên', order: 'Thứ tự', tabsTitle: 'Thí nghiệm 3 — Lỗi kiểm tra trong tab so với phần và liên kết neo', tabsIntro: 'Cả hai biểu mẫu có cùng một lỗi được điền sẵn: số ngày nhắc trước là 45, vượt giới hạn 30, nằm ở nhóm cuối cùng (Thông báo). Nhấn Lưu ở mỗi bên mà không chuyển đến nhóm đó trước rồi so sánh.', reset: 'Đặt lại cả hai biểu mẫu', tabs: 'A — Tab', anchor: 'B — Phần + liên kết neo', valid: 'Hợp lệ.', tabValid: 'Hợp lệ — giữ nguyên lỗi 45 ngày để tiếp tục minh họa.', genericError: 'Không thể lưu: vẫn còn lỗi kiểm tra. Không chỉ rõ tab nào — hãy tự tìm.', anchorError: 'Không thể lưu — xem trường lỗi đã được cuộn đến bên dưới.', general: 'Thông tin chung', eligibility: 'Điều kiện áp dụng', notifications: 'Thông báo', discount: 'Giảm giá (%)', segment: 'Phân khúc khách hàng', requiresApproval: 'Cần phê duyệt', maxRedemptions: 'Số lần sử dụng tối đa', channel: 'Kênh thông báo', ownerEmail: 'Email chủ sở hữu', reminderDays: 'Số ngày nhắc trước', reminderError: 'Không được nhắc trước quá 30 ngày' },
        decisions: { title: 'Quyết định cần chốt', intro: '8 điểm NEEDS-TEAM-DECISION từ đợt đánh giá bố cục. Ghi chú được lưu trong trình duyệt này, không gửi đi đâu và chỉ để dùng trong buổi họp.', placeholder: 'Ghi quyết định của nhóm trong buổi họp — lưu trên thiết bị này, không gửi đi đâu', offerThreshold: '1. Ngưỡng Drawer so với trang toàn màn hình', offerThresholdContext: 'offer-type (30 trường, 120 mục) dùng cả hai cách bố trí; background-locks (6 trường, 10 mục) chỉ dùng Drawer. Chốt tiêu chí: số trường, Tabs hay nhóm?', offerLink: 'Xem offer-types (A/B)', brandToken: '2. Giá trị token màu thương hiệu', brandTokenContext: 'colorPrimary hiện là #1677ff (mặc định AntD 5), chỉ là giá trị tạm. Cần xác định màu thương hiệu và nguồn sự thật duy nhất trong repo sản phẩm.', unsaved: '3. Guard khi đóng lớp phủ có thay đổi chưa lưu', unsavedContext: 'Khi đóng Drawer bằng Hủy, X, lớp phủ hoặc Escape, guard có được hỏi không? Kết quả khác nhau giữa state cục bộ và route.', runUnsaved: 'Chạy thí nghiệm 1', breadcrumb: '4. Breadcrumb cho route không có mục menu', breadcrumbContext: 'Route /offer-types/:id/edit không có mục menu nên breadcrumb trống, giống trường hợp background-main-lock. Có cần hành vi khác không?', openFullPage: 'Xem (mở mục rồi chọn “Mở toàn trang”)', search: '5. Tìm kiếm toàn cục (Ctrl+K)', searchContext: 'Khuyến nghị ban đầu: chưa làm trước go-live vì chưa có registry field settings và guard đã có phương án bàn phím. Cần xác nhận lại.', depth: '6. Sidebar tầng 3', depthContext: 'Menu demo có ba tầng (Sản phẩm > Quản lý ưu đãi > Loại ưu đãi). Giữ cấu trúc này hay rút còn hai tầng và dùng tab dọc trong Settings?', editRoute: '7. Mẫu route sửa cho Drawer', editRouteContext: 'Promotion Type thực thiếu route sửa; PROMOTION_MANAGEMENT_EDIT không được dùng. Offer Type dùng chung route :id cho xem/sửa và có nút mở toàn trang. Có áp dụng mẫu này cho Promotion Type không?', offerLinkShort: 'Xem offer-types', reorder: '8. Kéo thả kết hợp phân trang', reorderContext: 'Offer Type (có phân trang, kéo trong trang) và Background Locks (không phân trang) đang khác nhau. Chọn một chế độ dùng chung.', runReorder: 'Chạy thí nghiệm 2', items: { 'drawer-vs-page-threshold': { title: '1. Ngưỡng Drawer so với trang toàn màn hình', context: 'Offer Type (30 trường, 120 mục) dùng cả hai cách bố trí; Background Locks (6 trường, 10 mục) chỉ dùng Drawer. Chốt tiêu chí: số trường, Tabs hay nhóm?' }, 'brand-token': { title: '2. Giá trị token màu thương hiệu', context: 'colorPrimary hiện là #1677ff (mặc định Ant Design 5), chỉ là giá trị tạm. Cần xác định màu thương hiệu và nguồn sự thật duy nhất trong repo sản phẩm.' }, 'unsaved-changes-overlay': { title: '3. Guard khi đóng lớp phủ có thay đổi chưa lưu', context: 'Khi đóng Drawer bằng Hủy, X, lớp phủ hoặc Escape, guard có được hỏi không? Kết quả khác nhau giữa state cục bộ và route.' }, 'breadcrumb-no-menu': { title: '4. Breadcrumb cho route không có mục menu', context: 'Route /offer-types/:id/edit không có mục menu nên breadcrumb trống, giống trường hợp background-main-lock. Có cần hành vi khác không?' }, 'global-search': { title: '5. Tìm kiếm toàn cục (Ctrl+K)', context: 'Khuyến nghị ban đầu: chưa làm trước go-live vì chưa có registry field settings và guard đã có phương án bàn phím. Cần xác nhận lại.' }, 'sidebar-depth': { title: '6. Sidebar tầng 3', context: 'Menu demo có ba tầng (Sản phẩm > Quản lý ưu đãi > Loại ưu đãi). Giữ cấu trúc này hay rút còn hai tầng và dùng tab dọc trong Settings?' }, 'edit-route-pattern': { title: '7. Mẫu route sửa cho Drawer', context: 'Promotion Type thực thiếu route sửa; PROMOTION_MANAGEMENT_EDIT không được dùng. Offer Type dùng chung route :id cho xem/sửa và có nút mở toàn trang. Có áp dụng mẫu này cho Promotion Type không?' }, 'reorder-pagination-mode': { title: '8. Kéo thả kết hợp phân trang', context: 'Offer Type (có phân trang, kéo trong trang) và Background Locks (không phân trang) đang khác nhau. Chọn một chế độ dùng chung.' } } }
      }
    },
    chatgpt: {
      workspaceTitle: 'Không gian vận hành doanh nghiệp', designPlayground: 'Bản thử nghiệm thiết kế',
      overview: 'Tổng quan', showcase: 'Trưng bày Design System', operations: 'Vận hành', designSystem: 'Design System',
      skip: 'Chuyển đến nội dung', primaryNavigation: 'Điều hướng không gian ChatGPT', fictionalDisclaimer: 'Bản thử nghiệm hư cấu · không có dữ liệu thật',
      overviewTitle: 'Không gian vận hành', overviewDescription: 'Điểm bắt đầu tập trung cho tác vụ vận hành và đánh giá thiết kế.',
      showcaseTitle: 'Trưng bày Design System', showcaseDescription: 'Ví dụ thử nghiệm về nền tảng, trạng thái và biểu mẫu.',
      workspaceFoundation: 'Nền tảng không gian làm việc', foundationDescription: 'Shell độc lập này tạo thứ bậc trang rõ ràng cho các màn hình vận hành hư cấu trong tương lai.',
      reviewShowcase: 'Xem showcase Design System', lifecycleExamples: 'Ví dụ vòng đời giao diện', loadingTitle: 'Đang tải', emptyTitle: 'Trống', errorTitle: 'Lỗi',
      loadingExample: 'Đang tải hàng đợi công việc hư cấu…', emptyExample: 'Không có bản ghi hư cấu phù hợp với bộ lọc này', errorExample: 'Yêu cầu mẫu thất bại', errorHelp: 'Thử lại thao tác hoặc điều chỉnh bộ lọc.',
      routeLoadError: 'Không thể tải trang này', routeLoadHelp: 'Thử lại hoặc quay về tổng quan không gian làm việc.',
      typography: 'Kiểu chữ và màu ngữ nghĩa', typographyCaption: 'Tỷ lệ DS-01 cho bản thử nghiệm · giá trị sản xuất chưa được phê duyệt',
      sectionHeading: 'Tiêu đề phần · 20/28/600', componentHeading: 'Tiêu đề thành phần · 16/24/600',
      bodyLarge: 'Nội dung lớn · 16/24/400', body: 'Nội dung · 14/20/400.', bodyEmphasis: 'Nội dung nhấn mạnh · 14/20/600.',
      statusVariants: 'Các biến thể StatusBadge', statusExamples: 'Chỉ là ví dụ trình bày. Từng miền tự quyết định ánh xạ trạng thái.',
      success: 'Thành công', warning: 'Cảnh báo', error: 'Lỗi', information: 'Thông tin', neutral: 'Trung tính', accent: 'Nhấn mạnh',
      tablePattern: 'Mẫu bảng dễ đọc', reference: 'Mã tham chiếu', workItem: 'Hạng mục', owner: 'Người phụ trách', exampleState: 'Trạng thái ví dụ',
      exampleQueue: 'Hàng chờ đánh giá mẫu', fictionalOperator: 'Nhân viên hư cấu', exampleAudit: 'Kiểm tra cấu hình mẫu', fictionalReviewer: 'Người đánh giá hư cấu', ready: 'Sẵn sàng', pending: 'Đang chờ',
      requestForm: 'Biểu mẫu yêu cầu hư cấu', requestIntro: 'Biểu mẫu minh họa cách nhóm trường và khôi phục lỗi. Không gửi dữ liệu lên máy chủ.',
      reviewFields: 'Kiểm tra các trường sau', requestCompleted: 'Đã hoàn tất yêu cầu mẫu (mô phỏng)',
      requestDetails: 'Chi tiết yêu cầu', requestTitle: 'Tiêu đề yêu cầu', titleHelp: 'Dùng nhãn ngắn, cụ thể cho tác vụ hư cấu này.',
      enterTitle: 'Nhập tiêu đề yêu cầu.', titlePlaceholder: 'Ví dụ: Kiểm tra cài đặt demo', category: 'Danh mục',
      categoryHelp: 'Chọn loại công việc demo phù hợp nhất.', selectCategory: 'Chọn danh mục', chooseCategory: 'Chọn danh mục.', review: 'Đánh giá', configuration: 'Cấu hình',
      ownerNotes: 'Người phụ trách và ghi chú', ownerEmail: 'Email người phụ trách', emailHelp: 'Định dạng ví dụ: operator@example.test',
      enterEmail: 'Nhập email người phụ trách.', validEmail: 'Nhập địa chỉ email hợp lệ.', optionalNote: 'Thêm ghi chú không bắt buộc',
      note: 'Ghi chú tùy chọn', noteHelp: 'Chỉ thêm ngữ cảnh nếu hữu ích cho người đánh giá.',
      saveExample: 'Lưu yêu cầu mẫu', clearForm: 'Xóa biểu mẫu', brandPrimary: 'Màu thương hiệu chính', brandSecondary: 'Màu thương hiệu phụ',
      brandOrange: 'Màu cam thương hiệu', brandYellow: 'Màu vàng thương hiệu', brandSun: 'Màu nắng thương hiệu'
    },
    compare: {
      workspace: 'Không gian so sánh', title: 'So sánh đề xuất Claude và ChatGPT', index: 'Danh sách kịch bản', scenarioRegister: 'Danh mục kịch bản',
      indexIntro: 'Dùng cùng một tác vụ và tiêu chí hư cấu trên mỗi nền tảng. Ghi nhận riêng quan sát, sau đó ghi trạng thái bản nháp cục bộ.',
      availabilityIntro: 'Màn hình kịch bản Claude hiện khả dụng. ChatGPT có tổng quan và showcase; các màn hình nghiệp vụ tương ứng chưa khả dụng.',
      scenario: 'Kịch bản', decision: 'Quyết định', task: 'Tác vụ và kết quả mong đợi', expected: 'Mong đợi', steps: 'Các bước tái hiện',
      evaluation: 'Ma trận đánh giá', criterionCheck: 'Tiêu chí và cách kiểm tra', claudeObservation: 'Quan sát Claude', chatgptObservation: 'Quan sát ChatGPT', evidenceNotes: 'Ghi chú bằng chứng',
      sameCheck: 'Dùng cùng một phép kiểm tra trên mỗi nền tảng. Ghi hành vi quan sát được vào cột riêng. Bằng chứng có thể là tên ảnh chụp, mã issue hoặc liên kết an toàn. Để trống nếu chưa kiểm tra.',
      noteHelp: 'Quan sát hoặc bằng chứng', chatgptUntested: 'Chưa kiểm tra — màn hình chưa khả dụng',
      decisionRecord: 'Ghi nhận quyết định', localDraftNotice: 'Mọi trạng thái ở đây chỉ là bản nháp lưu trong trình duyệt. Approved chỉ ghi nhận lựa chọn bản nháp cục bộ, không phải phê duyệt chính thức của nhóm hay sản phẩm. Ghi chú người phụ trách, ngày, lý do và bằng chứng là tùy chọn.',
      status: 'Trạng thái', open: 'Mở', testing: 'Đang kiểm thử', recommended: 'Đề xuất', approved: 'Đã duyệt (bản nháp cục bộ)', rejected: 'Từ chối',
      decisionOwner: 'Người phụ trách quyết định', ownerPlaceholder: 'Nhóm hoặc người đánh giá', decisionDate: 'Ngày quyết định', rationale: 'Lý do',
      rationalePlaceholder: 'Vì sao chọn trạng thái này? Nêu quan sát và đánh đổi.', openQuestions: 'Câu hỏi còn mở',
      saved: 'Ghi chú đã lưu trong trình duyệt này.', storageUnavailable: 'Không thể lưu trong trình duyệt. Hãy tải CSV trước khi rời trang.',
      downloadCsv: 'Tải CSV so sánh bản nháp cục bộ', csvHint: 'CSV có một dòng cho mỗi tiêu chí cùng ID kịch bản cố định, URL hai nền tảng, quan sát, bằng chứng, trạng thái, người phụ trách và lý do. Ô trống nghĩa là chưa kiểm tra. Ghi chú chỉ lưu trong trình duyệt này; tên tệp tải xuống đánh dấu đây là bản nháp cục bộ.',
      allScenarios: '← Tất cả kịch bản', openScreen: 'Mở màn hình {{platform}}', legacyUrl: 'URL tương thích cũ',
      destinationLabel: 'Đích đến', taskLabel: 'Tác vụ', skip: 'Chuyển đến nội dung',
      noChatgptScreen: 'Chưa có màn hình kịch bản tương ứng. Không ghi nhận kết quả cho đến khi màn hình đó có sẵn.',
      fictional: 'Kịch bản hư cấu. Các màn hình nền tảng mở qua tuyến riêng.', unknown: 'Không tìm thấy kịch bản', returnIndex: 'Trở về danh sách kịch bản',
      taskCompletion: 'Hoàn thành tác vụ', navigationContext: 'Ngữ cảnh điều hướng', keyboardPath: 'Thao tác bàn phím', narrowWidth: 'Màn hình hẹp', operatorConfidence: 'Độ rõ ràng cho người vận hành',
      validationRecovery: 'Khôi phục lỗi kiểm tra', deepLink: 'Liên kết trực tiếp', exitPathCoverage: 'Các cách thoát', focusReturn: 'Trả lại tiêu điểm',
      crossPageAccuracy: 'Độ chính xác qua trang', saveConflictFeedback: 'Lưu và xung đột', errorDiscovery: 'Tìm lỗi', errorFocus: 'Tiêu điểm lỗi',
      actionReachability: 'Khả năng tiếp cận thao tác', dirtySaveState: 'Trạng thái chỉnh sửa và lưu',
      scenarioTitle: {
        'drawer-vs-full-page': 'Drawer và chỉnh sửa toàn trang', 'unsaved-changes': 'Thay đổi chưa lưu', 'reorder-pagination': 'Sắp xếp khi có phân trang',
        'tabs-vs-anchor': 'Tab và liên kết neo khi kiểm tra lỗi', 'contextual-save': 'Vị trí thanh lưu theo ngữ cảnh'
      },
      scenarioRecord: {
        'drawer-vs-full-page': 'Ưu đãi hư cấu offer-1', 'unsaved-changes': 'Bản nháp drawer hư cấu', 'reorder-pagination': 'Danh sách 120 ưu đãi hư cấu',
        'tabs-vs-anchor': 'Ưu đãi hư cấu với reminderDaysBefore = 45', 'contextual-save': 'Cài đặt sản phẩm hư cấu product-setting-1'
      },
      scenarioTask: {
        'drawer-vs-full-page': 'Sửa mô tả ưu đãi hư cấu rồi quay lại danh sách.', 'unsaved-changes': 'Thay đổi một trường rồi thử Hủy, đóng, mặt nạ, Escape, Back, chuyển nền tảng và tải lại.',
        'reorder-pagination': 'Chuyển ưu đãi qua ranh giới trang và xác minh thứ tự mới.', 'tabs-vs-anchor': 'Gửi biểu mẫu có nhóm cuối chứa nhắc trước 45 ngày trong khi giới hạn là 30 ngày.',
        'contextual-save': 'Sửa cài đặt trong biểu mẫu dài, chuyển giữa các phần rồi lưu hoặc hủy.'
      },
      scenarioExpected: {
        'drawer-vs-full-page': 'Thay đổi được lưu một lần, có thể tìm thấy phản hồi kiểm tra và đích quay lại rõ ràng.', 'unsaved-changes': 'Mỗi cách thoát đều báo trạng thái chưa lưu và cho phép ở lại hoặc bỏ thay đổi có chủ ý.',
        'reorder-pagination': 'Người vận hành đặt được vị trí đích, lưu rõ ràng và xác minh thứ tự cuối.', 'tabs-vs-anchor': 'Người vận hành thấy vị trí lỗi, đến được trường, sửa lỗi và gửi được biểu mẫu.',
        'contextual-save': 'Nút lưu và thao tác luôn dễ tìm mà không che trường hoặc gửi nhầm.'
      },
      criterionChecks: {
        completion: 'Người vận hành hoàn thành được tác vụ và nhận biết kết quả đã lưu không?', context: 'Người vận hành quay lại đúng danh sách và giữ được ngữ cảnh hữu ích không?',
        keyboard: 'Có thể hoàn thành tác vụ và khôi phục lỗi bằng bàn phím không?', narrow: 'Có thể truy cập trường, thao tác và phản hồi ở màn hình hẹp không?',
        confidence: 'Thao tác tiếp theo và kết quả có rõ ràng mà không cần đoán không?', validation: 'Có thể tìm và sửa trường lỗi trên từng kiểu giao diện không?',
        'deep-link': 'Tải trực tiếp có cung cấp cách đóng hoặc quay lại hữu ích không?', 'exit-paths': 'Hủy, X, mặt nạ, Escape, Back, liên kết và tải lại có nhất quán không?',
        focus: 'Tiêu điểm có trở về điều khiển hữu ích sau khi đóng drawer không?', 'cross-page': 'Có thể chuyển mục qua trang và đặt đúng thứ hạng không?',
        'save-feedback': 'Thứ tự chờ và đã lưu có rõ, kể cả khi thứ tự cũ gây lỗi không?', 'error-discovery': 'Lỗi nhóm cuối có được đặt tên và hiển thị sau khi lưu không?',
        'error-focus': 'Tóm tắt hoặc điều hướng có đưa tiêu điểm đến trường không?', 'action-reach': 'Có thể truy cập Lưu và Hủy trong suốt biểu mẫu dài không?',
        'dirty-state': 'Trạng thái đã sửa, đang lưu, đã lưu và lỗi có rõ không?'
      },
      criterionLabels: { completion: 'Hoàn thành tác vụ', context: 'Ngữ cảnh điều hướng', keyboard: 'Thao tác bàn phím', narrow: 'Màn hình hẹp', confidence: 'Độ tin cậy của người vận hành', validation: 'Khôi phục kiểm tra', 'deep-link': 'Liên kết trực tiếp', 'exit-paths': 'Các cách thoát', focus: 'Trả lại tiêu điểm', 'cross-page': 'Độ chính xác qua trang', 'save-feedback': 'Phản hồi lưu và xung đột', 'error-discovery': 'Tìm lỗi', 'error-focus': 'Tiêu điểm lỗi', 'action-reach': 'Khả năng tiếp cận thao tác', 'dirty-state': 'Trạng thái chỉnh sửa và lưu' },
      scenarioStep: {
        'drawer-vs-full-page': ['Mở offer-1 từ danh sách bằng drawer.', 'Sửa mô tả rồi kiểm tra Lưu và Hủy.', 'Thử lại bằng liên kết chỉnh sửa toàn trang với cùng bản ghi hư cấu.', 'Tải lại từng liên kết trực tiếp và kiểm tra đường quay lại.'],
        'unsaved-changes': ['Mở drawer cục bộ và nhập bản nháp.', 'Thử từng cách đóng và ghi lại nhật ký sự kiện.', 'Lặp lại trong drawer gắn với tuyến.', 'Thử các cách thoát tương tự ở ChatGPT khi có.'],
        'reorder-pagination': ['Thử kéo trong trang 1 rồi kiểm tra trang 2.', 'Thử chế độ sắp xếp tất cả và thao tác Lưu.', 'Thử nhập vị trí trực tiếp.', 'Lặp lại thao tác tương đương ở ChatGPT khi có.'],
        'tabs-vs-anchor': ['Để nguyên giá trị sai được điền sẵn.', 'Lưu ở biến thể Tabs và tìm lỗi.', 'Đặt lại rồi lưu ở biến thể phần và liên kết neo.', 'Lặp lại với ChatGPT khi có.'],
        'contextual-save': ['Mở bản ghi cài đặt sản phẩm hư cấu.', 'Đổi trường gần đầu và gần cuối biểu mẫu.', 'Kiểm tra thanh thao tác phía trên và cách hủy.', 'So sánh với vị trí lưu trong ChatGPT khi có.']
      }
    },
    validation: { required: 'Trường này là bắt buộc.', invalid: 'Giá trị không hợp lệ.' }
  },
  en: {
    common: {
      language: 'Language', vietnamese: 'Tiếng Việt', english: 'English', platforms: 'Platforms', claude: 'Claude', chatgpt: 'ChatGPT', compare: 'Compare',
      open: 'Open', prototype: 'Prototype', fictional: 'Fictional data', save: 'Save', cancel: 'Cancel', close: 'Close', clear: 'Clear', loading: 'Loading…', discardChanges: 'Discard changes', unsavedChanges: 'Unsaved changes', leavePage: 'Leave this page?', unsavedConfirm: 'You have unsaved changes. Are you sure you want to leave?', leave: 'Leave', stay: 'Stay',
      available: 'Available', unavailable: 'Unavailable', legacyUrl: 'Legacy-compatible URL', documentTitle: 'Demo layout — prototype'
    },
    navigation: {
      switcher: 'Platform switcher', primary: 'Primary navigation', breadcrumb: 'Breadcrumb', landing: 'Choose a platform', workspace: 'Workspace', home: 'Home',
      products: 'Products', offerManagement: 'Offer management', offerTypes: 'Offer Types', productSync: 'Product Sync', productSettings: 'Product Settings', productLabels: 'Product Labels', productParameters: 'Product parameters',
      fees: 'Fees', promotions: 'Promotions', promotionTypes: 'Promotion Types', requiredInformation: 'Required Information', displayInformationSets: 'Display Information Sets', addOns: 'Add-ons',
      popularLoans: 'Popular Loans', attractiveOffer: 'Attractive Offer', exclusiveTouch: 'Assign by display type', system: 'System', backgroundManagement: 'Background management',
      backgroundLocks: 'Background Locks', experiments: 'Experiments', unsaved: '1. Unsaved changes guard', reorder: '2. Reorder and pagination', tabs: '3. Tabs vs Anchor',
      decisions: 'Layout decisions', demoFooter: 'Demo layout v0.1 — internal, not public',
      landingTitle: 'Choose a workspace', landingIntro: 'These are fictional design prototypes for review. Choose a platform to explore its current screens or compare the same task across proposals.',
      landingClaude: 'Explore the existing prototype, its forms, drawers and layout experiments.', landingChatgpt: 'Review the independent Enterprise Operations Workspace and Design System showcase.',
      landingCompare: 'Run paired fictional scenarios and record observations and decisions.', landingNote: 'Prototype content uses fictional data. A recommendation recorded in Compare is not an approved production decision.',
      missingBreadcrumb: 'This route has no breadcrumb because it has no menu entry (matching the background-main-lock case in the reference repository).'
    },
    claude: {
      shellTitle: 'Demo layout — prototype (not real HDS Admin)', notFound: 'Route not found', search: 'Search', filter: 'Filter', actions: 'Actions',
      configure: 'Configure', status: 'Status', code: 'Code', name: 'Name', feeName: 'Fee name', effectiveDate: 'Effective date', active: 'Active', inactive: 'Inactive', standalone: 'Standalone',
      cashLoan: 'Cash loan', creditCard: 'Credit card', offsetLoan: 'Offset loan', application: 'Applies to', value: 'Value', addOnName: 'Product name',
      distribution: 'Distribution', partner: 'Associated partner', fee: 'Fee', activateSelected: 'Activate selected', deactivateSelected: 'Deactivate selected', routeGap: 'This page has no navigation menu item.',
      offer: { create: 'Create offer type', settings: 'Settings: {{name}}', fullPage: 'Open full page', cancel: 'Cancel', save: 'Save', name: 'Offer name', status: 'Status', active: 'Active', draft: 'Draft', inactive: 'Inactive', general: 'General information', description: 'Description', code: 'Code', discountPercent: 'Discount (%)', discountAmount: 'Discount amount', minOrder: 'Minimum order value', eligibility: 'Eligibility', segments: 'Customer segments', newCustomers: 'New customers', vipCustomers: 'VIP customers', businessCustomers: 'Business customers', individualCustomers: 'Individual customers', requiresApproval: 'Requires approval', combinable: 'Can be combined', firstTimeOnly: 'First-time only', maxRedemptions: 'Maximum redemptions', notifications: 'Notifications', notifyExpiry: 'Expiry notification', channel: 'Notification channel', email: 'Email', sms: 'SMS', push: 'Push', none: 'None', ownerEmail: 'Owner email', reminderDays: 'Reminder days before expiry', reminderError: 'Reminder cannot be more than 30 days in advance', createNew: '+ Create new', tableName: 'Name', tableStatus: 'Status', order: 'Order', configure: 'Configure' },
      productSettings: { general: 'General information', productName: 'Product name', productCode: 'Product code', rateTiers: 'Interest rates by amount', baseRate: 'Base interest rate (%)', from: 'From', to: 'To', rate: 'Interest rate (%)', addTier: 'Add rate tier', customerConditions: 'Customer eligibility', audience: 'Customer type', individual: 'Individual', business: 'Business', minAge: 'Minimum age', maxAge: 'Maximum age', minRevenue: 'Minimum annual revenue', businessTypes: 'Business types', household: 'Household business', limitedCompany: 'Limited liability company', jointStock: 'Joint-stock company', privateEnterprise: 'Private enterprise', requiredDocuments: 'Required documents', documentName: 'Document name', required: 'Required', addDocument: 'Add document', advanced: 'Advanced configuration', enableAdvanced: 'Enable advanced configuration', approvalWorkflow: 'Approval workflow', automatic: 'Automatic', oneApprover: 'Single approver', committee: 'Committee', riskThreshold: 'Risk score threshold', title: 'Product settings: {{name}}', saveSuccess: 'Saved.', dirty: 'Unsaved changes — {{name}}', back: '← Back to list', tierCount: 'Rate tiers', configure: 'Configure' }
      ,forms: { required: 'Required', feeCode: 'Fee code', feeName: 'Fee name', appliesTo: 'Applies to', feeType: 'Fee type', unit: 'Unit', value: 'Value', effectiveDate: 'Effective date', addOnCode: 'Code', addOnName: 'Product name', distribution: 'Distribution', associatedPartner: 'Associated partner', feeVnd: 'Fee (VND)', promotionName: 'Promotion name', promotionCode: 'Code', offerType: 'Offer type', startDate: 'Start date', endDate: 'End date', assignedProducts: 'Applicable products', promotionTypeName: 'Promotion type name', code: 'Code', status: 'Status', infoName: 'Information name', inputType: 'Input type', supplyMethod: 'Supply method', previewImage: 'Preview image', backgroundName: 'Name', customerSegments: 'Customer segments', validity: 'Validity period', fromDate: 'From date', toDate: 'To date' }
    },
    chatgpt: {
      workspaceTitle: 'Enterprise Operations Workspace', designPlayground: 'Design playground', overview: 'Overview', showcase: 'Design System showcase', operations: 'Operations', designSystem: 'Design System',
      skip: 'Skip to content', primaryNavigation: 'ChatGPT workspace navigation', fictionalDisclaimer: 'Fictional prototype · no production data',
      overviewTitle: 'Operations workspace', overviewDescription: 'A focused starting point for operational tasks and design review.', showcaseTitle: 'Design System showcase',
      showcaseDescription: 'Prototype examples of foundations, states, and form behavior.', typography: 'Typography and semantic colors',
      workspaceFoundation: 'Workspace foundation', foundationDescription: 'This independent shell establishes a clear page hierarchy for future fictional operational screens.',
      reviewShowcase: 'Review the Design System showcase', lifecycleExamples: 'Interface lifecycle examples', loadingTitle: 'Loading', emptyTitle: 'Empty', errorTitle: 'Error',
      loadingExample: 'Loading a fictional work queue…', emptyExample: 'No fictional records match these filters', errorExample: 'Example request failed', errorHelp: 'Try the action again or adjust the filters.',
      routeLoadError: 'This page could not load', routeLoadHelp: 'Try again, or return to the workspace overview.',
      typographyCaption: 'Prototype DS-01 scale · numeric production approval remains unresolved', sectionHeading: 'Section heading · 20/28/600', componentHeading: 'Component heading · 16/24/600',
      bodyLarge: 'Body large · 16/24/400', body: 'Body · 14/20/400.', bodyEmphasis: 'Body emphasis · 14/20/600.', statusVariants: 'StatusBadge variants',
      statusExamples: 'Presentation examples only. Domain features decide their own status mappings.', success: 'Success', warning: 'Warning', error: 'Error', information: 'Information', neutral: 'Neutral', accent: 'Accent',
      tablePattern: 'Readable table pattern', reference: 'Reference', workItem: 'Work item', owner: 'Owner', exampleState: 'Example state', requestForm: 'Fictional request form',
      exampleQueue: 'Example review queue', fictionalOperator: 'Fictional operator', exampleAudit: 'Example configuration audit', fictionalReviewer: 'Fictional reviewer', ready: 'Ready', pending: 'Pending',
      requestIntro: 'This form demonstrates grouping and validation recovery. It does not save data to a server.', reviewFields: 'Review these fields', requestCompleted: 'Example request completed (simulation only)',
      requestDetails: 'Request details', requestTitle: 'Request title', titleHelp: 'Use a short, specific label for this fictional task.', enterTitle: 'Enter a request title.',
      titlePlaceholder: 'For example, Review demo settings', category: 'Category', categoryHelp: 'Choose the closest demo work type.', selectCategory: 'Select a category', chooseCategory: 'Choose a category.',
      review: 'Review', configuration: 'Configuration', ownerNotes: 'Owner and notes', ownerEmail: 'Owner email', emailHelp: 'Format example: operator@example.test',
      enterEmail: 'Enter an owner email.', validEmail: 'Enter a valid email address.', optionalNote: 'Add an optional note', note: 'Optional note', noteHelp: 'Add context only if it helps a reviewer.',
      saveExample: 'Save example request', clearForm: 'Clear form', brandPrimary: 'Brand primary', brandSecondary: 'Brand secondary', brandOrange: 'Brand orange', brandYellow: 'Brand yellow', brandSun: 'Brand sun'
    },
    compare: {
      workspace: 'Compare workspace', title: 'Compare Claude and ChatGPT proposals', index: 'Scenario index', scenarioRegister: 'Scenario register',
      indexIntro: 'Use the same fictional task and criterion on each platform. Record observations separately, then document a local draft status.',
      availabilityIntro: 'Claude scenario screens are available. ChatGPT currently has an overview and showcase; matching business scenarios remain unavailable.',
      scenario: 'Scenario', decision: 'Decision', task: 'Task and expected outcome', expected: 'Expected', steps: 'Reproduction steps', evaluation: 'Evaluation matrix',
      criterionCheck: 'Criterion and check', claudeObservation: 'Claude observation', chatgptObservation: 'ChatGPT observation', evidenceNotes: 'Evidence notes',
      sameCheck: 'Use the same check on each platform. Put observed behavior in its own column. Evidence can be a screenshot filename, issue ID or safe link. Leave a cell blank when untested.',
      noteHelp: 'Observation or evidence', chatgptUntested: 'Untested — screen unavailable', decisionRecord: 'Decision record',
      localDraftNotice: 'All statuses here are browser-local drafts. Approved records only a local draft selection; it is not formal team or production approval. Owner, date, rationale and evidence are optional handoff notes.',
      status: 'Status', open: 'Open', testing: 'Testing', recommended: 'Recommended', approved: 'Approved (local draft)', rejected: 'Rejected',
      decisionOwner: 'Decision owner', ownerPlaceholder: 'Team or reviewer', decisionDate: 'Decision date', rationale: 'Rationale', rationalePlaceholder: 'Why this status? Cite observations and tradeoffs.', openQuestions: 'Open questions',
      saved: 'Notes saved in this browser.', storageUnavailable: 'Browser storage is unavailable. Download the CSV before leaving this page.', downloadCsv: 'Download local-draft comparison CSV',
      csvHint: 'The CSV has one row per criterion, fixed scenario IDs, both platform URLs, observations, evidence, status, owner and rationale. Blank observations mean untested. Notes are stored only in this browser under a Compare namespace; the downloaded filename identifies this as a local draft.',
      allScenarios: '← All scenarios', openScreen: 'Open {{platform}} screen', legacyUrl: 'Legacy-compatible URL',
      destinationLabel: 'Destination', taskLabel: 'Task', skip: 'Skip to content',
      noChatgptScreen: 'No matching scenario screen is available yet. Do not record a result until it exists.', fictional: 'Fictional scenarios. Platform screens open through separate routes.', unknown: 'Scenario not found', returnIndex: 'Return to scenario index',
      taskCompletion: 'Task completion', navigationContext: 'Navigation context', keyboardPath: 'Keyboard path', narrowWidth: 'Narrow width', operatorConfidence: 'Operator confidence',
      validationRecovery: 'Validation recovery', deepLink: 'Deep link', exitPathCoverage: 'Exit path coverage', focusReturn: 'Focus return', crossPageAccuracy: 'Cross-page accuracy',
      saveConflictFeedback: 'Save and conflict feedback', errorDiscovery: 'Error discovery', errorFocus: 'Error focus', actionReachability: 'Action reachability', dirtySaveState: 'Dirty and save state',
      scenarioTitle: {
        'drawer-vs-full-page': 'Drawer vs full-page edit', 'unsaved-changes': 'Unsaved changes', 'reorder-pagination': 'Reorder with pagination',
        'tabs-vs-anchor': 'Tabs vs anchor validation', 'contextual-save': 'Contextual save placement'
      },
      scenarioRecord: {
        'drawer-vs-full-page': 'Fictional offer offer-1', 'unsaved-changes': 'Fictional drawer draft', 'reorder-pagination': 'Fictional 120-offer list',
        'tabs-vs-anchor': 'Fictional offer with reminderDaysBefore = 45', 'contextual-save': 'Fictional product settings product-setting-1'
      },
      scenarioTask: {
        'drawer-vs-full-page': 'Edit the fictional offer description, then return to the list.', 'unsaved-changes': 'Change a field, then try Cancel, close, mask, Escape, Back, platform navigation and refresh.',
        'reorder-pagination': 'Move an offer across a page boundary and verify the resulting order.', 'tabs-vs-anchor': 'Submit a form whose last group contains a 45-day reminder against a 30-day limit.',
        'contextual-save': 'Edit a setting in a long form, move between sections, then save or discard.'
      },
      scenarioExpected: {
        'drawer-vs-full-page': 'The change is saved once, the operator can find validation feedback, and the return destination is clear.', 'unsaved-changes': 'Every exit path communicates the unsaved state and permits a deliberate stay or discard choice.',
        'reorder-pagination': 'The operator can express the target position, save it explicitly, and verify the final order.', 'tabs-vs-anchor': 'The operator sees the error location, reaches the field, fixes it and can submit.',
        'contextual-save': 'Save state and actions stay discoverable without hiding fields or creating accidental submissions.'
      },
      criterionChecks: {
        completion: 'Can the operator finish the task and identify the saved result?', context: 'Can the operator return to the right list and retain useful context?',
        keyboard: 'Can the task be completed and errors recovered using a keyboard?', narrow: 'Are fields, actions and feedback reachable at a narrow viewport?',
        confidence: 'Is the next action and outcome clear without guessing?', validation: 'Can the operator locate and fix a failing field in each substrate?',
        'deep-link': 'Does direct loading provide a usable close or back destination?', 'exit-paths': 'Do Cancel, X, mask, Escape, Back, link and refresh behave consistently?',
        focus: 'Does focus return to a useful control after a closed drawer?', 'cross-page': 'Can an item move beyond the current page and land at the intended rank?',
        'save-feedback': 'Is the pending and committed order visible, including a stale-order failure?', 'error-discovery': 'Is the final-group error named and visible after Save?',
        'error-focus': 'Can summary or navigation move focus to the invalid field?', 'action-reach': 'Are Save and Discard reachable throughout a long form?',
        'dirty-state': 'Are changed, saving, saved and failed states clear?'
      },
      criterionLabels: { completion: 'Task completion', context: 'Navigation context', keyboard: 'Keyboard path', narrow: 'Narrow width', confidence: 'Operator confidence', validation: 'Validation recovery', 'deep-link': 'Deep link', 'exit-paths': 'Exit path coverage', focus: 'Focus return', 'cross-page': 'Cross-page accuracy', 'save-feedback': 'Save and conflict feedback', 'error-discovery': 'Error discovery', 'error-focus': 'Error focus', 'action-reach': 'Action reachability', 'dirty-state': 'Dirty and save state' },
      scenarioStep: {
        'drawer-vs-full-page': ['Open offer-1 from the list as a drawer.', 'Edit its description and inspect Save and Cancel.', 'Repeat through the full-page edit link with the same fictional record.', 'Reload each deep link and check the return path.'],
        'unsaved-changes': ['Open the local drawer and type a draft.', 'Try each close path and note the event log.', 'Repeat in the route-bound drawer.', 'Repeat the same exit paths in ChatGPT when available.'],
        'reorder-pagination': ['Try page-local drag on page 1 and inspect page 2.', 'Try all-item sort mode and its Save action.', 'Try direct position entry.', 'Repeat comparable actions in ChatGPT when available.'],
        'tabs-vs-anchor': ['Leave the prefilled invalid value untouched.', 'Save in the Tabs variant and locate the error.', 'Reset, then save in the section and anchor variant.', 'Repeat with ChatGPT when available.'],
        'contextual-save': ['Open the fictional product settings record.', 'Change a field near the top and another near the bottom.', 'Inspect the top contextual bar and discard behavior.', 'Compare with ChatGPT save placement when available.']
      }
    },
      pages: {
        sync: { matched: 'Matched', mismatched: 'Mismatched', pending: 'Pending', run: 'Sync now', history: 'Sync history', product: 'Product', status: 'Status', lastSync: 'Last synced', viewDiff: 'View differences', close: 'Close', field: 'Field', source: 'Source', target: 'Target', started: 'Started', finished: 'Finished', result: 'Result', changes: 'Changes', operator: 'Triggered by', syncing: 'Syncing', reconciling: 'Reconciling data', processing: 'Processing…', complete: 'Complete', syncedCount: 'Synced {{count}} products', prompt: 'Select “Sync now” to begin.', success: 'Success', failed: 'Failed' },
        promotion: { add: 'Add promotion', code: 'Code', name: 'Promotion name', offerType: 'Offer type', period: 'Effective period', status: 'Status', edit: 'Edit', createTitle: 'Add promotion', title: 'Promotion: {{name}}', created: 'Promotion created.', back: '← Back to list', cancel: 'Cancel', create: 'Create', startDate: 'Start date', endDate: 'End date', assignedProducts: 'Applicable products', draft: 'Draft', active: 'Active', expired: 'Expired' },
        promotionType: { add: 'Add promotion type', configure: 'Settings: {{name}}', name: 'Promotion type name', code: 'Code', status: 'Status', edit: 'Edit', active: 'Active', inactive: 'Inactive', draft: 'Draft', cancel: 'Cancel', save: 'Save' },
        requiredInfo: { code: 'Code', name: 'Information name', inputType: 'Input type', supplyMethod: 'Supply method', status: 'Status', configure: 'Configure', title: 'Required information: {{name}}', history: 'Change history', time: 'Time', actor: 'Changed by', action: 'Action', back: '← Back to list', saved: 'Saved.', active: 'Active', inactive: 'Inactive', inputTypes: { TEXT: 'Text', NUMBER: 'Number', EMAIL: 'Email', ADDRESS: 'Address', DATE_TIME: 'Date and time', PHONE_NUMBER: 'Phone number', FAMILY_RELATIVE: 'Family member', DROP_DOWN: 'Dropdown', RADIO_GROUP: 'Radio group' }, supplyMethods: { TYPING: 'Typing', SELECTION: 'Selection', RADIO_GROUP: 'Radio group', COMPOSED: 'Combined' } },
        displaySet: { image: 'Image', code: 'Code', name: 'Display information set name', productLine: 'Product line', app: 'Show in App', web: 'Show on Web', status: 'Status', configure: 'Configure', imageLabel: 'Display image', chooseImage: 'Choose image (demo only; no upload)', cashLoan: 'Cash loan (CL)', creditCard: 'Credit card (CD)', labels: 'Product labels', requiredSet: 'Required information set', fees: 'Applicable fees', active: 'Active', inactive: 'Inactive', title: 'Display set: {{name}}', back: '← Back to list', saved: 'Saved.', productLines: { CL: 'Cash loan', CD: 'Credit card' } },
        background: { image: 'Image', name: 'Name', status: 'Status', segments: 'Segments', order: 'Order', configure: 'Configure', preview: 'Preview image', chooseImage: 'Choose image (demo only; no upload)', active: 'Active', draft: 'Draft', inactive: 'Inactive', validity: 'Effective period', from: 'From date', to: 'To date', cancel: 'Cancel', save: 'Save' },
        assigned: { empty: 'No products assigned', add: 'Add a product to the list', moveUp: 'Move up', moveDown: 'Move down', remove: 'Remove product from list' },
        popularLoans: { title: 'Popular loan products', description: 'Choose and order cash loan products shown in the app’s “Popular” section.', dirty: 'Unsaved changes — Popular loan products', history: 'Change history', time: 'Time', actor: 'Changed by', action: 'Action', saved: 'Saved.' },
        attractiveOffer: { title: 'Featured offer', dirty: 'Unsaved changes — Featured offer', enabled: 'Enabled', disabled: 'Disabled', name: 'Offer name', history: 'Change history', time: 'Time', actor: 'Changed by', action: 'Action', saved: 'Saved.' },
        exclusiveTouch: { title: 'Assign products by display type', search: 'Search by type name', all: 'All statuses', active: 'Active', inactive: 'Inactive', type: 'Display type', status: 'Status', count: 'Assigned products', assign: 'Assign products', mobilePreview: 'Mobile preview', segments: 'Customer segments', startDate: 'Start date', savePreview: 'Save preview', saved: 'Preview saved.', sampleGrid: 'Display grid sample', staticNote: 'Static sample; not real data.', drawerTitle: 'Assign products: {{name}}', cancel: 'Cancel', save: 'Save' },
        experiments: { unsavedTitle: 'Experiment 1 — Protecting unsaved changes when closing overlays', instruction: 'Enter text in a drawer, then close with Cancel, X, mask click or Escape. Check the log below to see whether the guard runs.', localTitle: 'A — Drawer with local state (setOpen)', localDescription: 'A drawer not bound to a route, opened and closed with useState.', routeTitle: 'B — Drawer bound to a child route (navigate)', routeDescription: 'A drawer opened and closed through real route navigation.', openDrawer: 'Open drawer', drawerForm: 'Demo form (local state)', routeDrawerForm: 'Demo form (child route)', note: 'Note (type something, then try closing)', dirty: 'Unsaved changes (isDirty = true), but close is not checked.', guardedDirty: 'Unsaved changes (isDirty = true) — the guard checks every close path.', clean: 'No changes yet.', cancel: 'Cancel', save: 'Save', localClose: '[Local state] Closed through {{source}} — no navigation occurs, so the guard is not asked.', routeClose: '[Route-bound] Closed through {{source}} — navigation returns to the list, so the guard is asked.', savedLog: '[Route-bound] Save selected — demo treats it as saved, clears isDirty and navigates.', genericDrawer: 'Route-bound drawer', saveDemo: 'Save (demo only; does not really save)', reorderTitle: 'Experiment 2 — Drag reordering on a paginated list', reorderIntro: 'The same offer-type data (120 items), loaded and ordered in three ways. NEEDS-TEAM-DECISION #8: choose a mode for all reorderable screens.', paginated: 'Pagination (current)', sortMode: 'Dedicated sort mode', positionMode: 'Enter position', pageBoundary: 'Try page 1: drag an item to the bottom, then go to page 2. It will not move there because dnd-kit only handles items rendered on the current page. This is a limitation of reordering paginated data.', allItems: 'Load the whole list once without pagination. Items can move from the beginning to the end without a page boundary. Select “Save order” to persist; before saving, changes exist only in this browser.', keyboardMove: 'No dragging required: enter the target position and press Enter. This applies across the full list but is less direct than dragging.', saveOrder: 'Save order', dirtyNotice: 'Unsaved changes', name: 'Name', order: 'Order', tabsTitle: 'Experiment 3 — Validation errors in tabs vs sections and anchors', tabsIntro: 'Both forms start with the same error: a 45-day reminder exceeds the 30-day limit in the final Notifications group. Select Save on each side without navigating there first, then compare.', reset: 'Reset both forms', tabs: 'A — Tabs', anchor: 'B — Sections + anchor', valid: 'Valid.', tabValid: 'Valid — leave the 45-day error unchanged to continue the demonstration.', genericError: 'Save failed: validation errors remain. The tab is not identified; find it manually.', anchorError: 'Save failed — see the field scrolled into view below.', general: 'General information', eligibility: 'Eligibility', notifications: 'Notifications', discount: 'Discount (%)', segment: 'Customer segments', requiresApproval: 'Approval required', maxRedemptions: 'Maximum redemptions', channel: 'Notification channel', ownerEmail: 'Owner email', reminderDays: 'Reminder days before', reminderError: 'Reminder cannot exceed 30 days' },
        decisions: { title: 'Decisions to resolve', intro: 'Eight NEEDS-TEAM-DECISION items from the layout review. Notes are stored in this browser only, are not sent anywhere, and are intended for the meeting.', placeholder: 'Record the team decision during the meeting — stored on this device only', offerThreshold: '1. Drawer vs full-page threshold', offerThresholdContext: 'Offer Type (30 fields, 120 items) uses both layouts; Background Locks (6 fields, 10 items) uses a drawer only. Decide whether the threshold is field count, tabs or grouping.', offerLink: 'View Offer Types (A/B)', brandToken: '2. Actual brand color token', brandTokenContext: 'colorPrimary is currently #1677ff (Ant Design 5 default), a placeholder. Confirm the actual brand color and single source of truth in the product repository.', unsaved: '3. Unsaved-changes guard when closing overlays', unsavedContext: 'Should closing a drawer with Cancel, X, mask or Escape trigger the guard? Local-state and route-bound drawers behave differently.', runUnsaved: 'Run Experiment 1', breadcrumb: '4. Breadcrumb for routes without a menu item', breadcrumbContext: 'The /offer-types/:id/edit route has no menu item, so its breadcrumb is empty, like background-main-lock. Should it behave differently?', openFullPage: 'View (open an item, then select “Open full page”)', search: '5. Global search (Ctrl+K)', searchContext: 'Initial recommendation: defer before go-live because there is no field-settings registry and the guard has a keyboard fallback. Reconfirm this.', depth: '6. Third-level sidebar', depthContext: 'The demo menu has three levels (Products > Offer Management > Offer Types). Keep this depth or reduce it to two levels and use vertical tabs for Settings?', editRoute: '7. Drawer edit-route pattern', editRouteContext: 'The real Promotion Type lacks an edit route; PROMOTION_MANAGEMENT_EDIT is unused. Offer Type shares :id for view/edit and has an Open full page action. Should Promotion Type use this pattern?', offerLinkShort: 'View Offer Types', reorder: '8. Drag reordering with pagination', reorderContext: 'Offer Type (paginated, reorder within a page) differs from Background Locks (not paginated). Choose a shared mode.', runReorder: 'Run Experiment 2' }
      },
      validation: { required: 'This field is required.', invalid: 'This value is invalid.' }
  }
} as const;

function findPageResources(value: unknown): Record<string, any> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  if (record.sync && record.promotion && record.experiments && record.decisions) {
    return record as Record<string, any>;
  }
  for (const child of Object.values(record)) {
    const found = findPageResources(child);
    if (found) return found;
  }
  return undefined;
}

const viPageResources = baseResources.vi.claude.pages;
const enPageResources = findPageResources(baseResources.en)! as typeof viPageResources;
const { items: unusedViDecisionItems, ...viDecisionResources } = viPageResources.decisions;
const { items: unusedEnDecisionItems, ...enDecisionResources } = enPageResources.decisions;

export const resources = {
  ...baseResources,
  vi: {
    ...baseResources.vi,
    claude: {
      ...baseResources.vi.claude,
      pages: {
        ...viPageResources,
        productLabels: {
          title: 'Nhãn sản phẩm', filters: 'Bộ lọc nhãn sản phẩm', search: 'Tìm theo tên hoặc mã nhãn', searchPlaceholder: 'Tên hoặc mã nhãn',
          productLineFilter: 'Lọc theo dòng sản phẩm', allProductLines: 'Tất cả dòng sản phẩm', statusFilter: 'Lọc theo trạng thái', allStatuses: 'Tất cả trạng thái',
          name: 'Tên nhãn', code: 'Mã nhãn', productLine: 'Dòng sản phẩm', status: 'Trạng thái', actions: 'Thao tác',
          viewDetails: 'Xem chi tiết', viewDetailsFor: 'Xem chi tiết nhãn {{name}}',
          lines: { 'cash-loan': 'Vay tiền mặt', 'credit-card': 'Thẻ tín dụng' },
          statuses: { active: 'Đang hoạt động', inactive: 'Ngừng hoạt động' },
          classifications: { eligibility: 'Phân loại điều kiện', display: 'Phân loại hiển thị', pricing: 'Phân loại giá' },
          empty: 'Không tìm thấy nhãn phù hợp.', range: '{{from}}–{{to}} / {{total}} nhãn', resultCount: 'Có {{count}} nhãn phù hợp.',
          quickView: 'Xem nhanh nhãn sản phẩm', quickViewTitle: 'Xem nhanh: {{name}}', recordId: 'Mã bản ghi: {{id}}',
          classification: 'Phân loại', associatedProduct: 'Sản phẩm liên quan', lastUpdated: 'Cập nhật lần cuối', notProvided: 'Chưa có thông tin',
          close: 'Đóng', notFoundTitle: 'Không tìm thấy nhãn', notFoundDescription: 'Không có nhãn sản phẩm với mã “{{id}}”.', returnToList: 'Quay lại danh sách'
        },
        decisions: viDecisionResources,
        promotion: { ...viPageResources.promotion, ...pageExtra.vi.promotion },
        forms: { ...pageExtra.vi.forms },
        offer: { ...baseResources.vi.claude.offer, ...pageExtra.vi.offer },
        experiments: { ...viPageResources.experiments, ...experimentExtra.vi, ...pageExtra.vi.experiments }
      }
    }
  },
  en: {
    ...baseResources.en,
    claude: {
      ...baseResources.en.claude,
      pages: {
        ...enPageResources,
        productLabels: {
          title: 'Product Labels', filters: 'Product Label filters', search: 'Search by label name or code', searchPlaceholder: 'Label name or code',
          productLineFilter: 'Filter by product line', allProductLines: 'All product lines', statusFilter: 'Filter by status', allStatuses: 'All statuses',
          name: 'Label name', code: 'Label code', productLine: 'Product line', status: 'Status', actions: 'Actions',
          viewDetails: 'View details', viewDetailsFor: 'View details for label {{name}}',
          lines: { 'cash-loan': 'Cash loan', 'credit-card': 'Credit card' },
          statuses: { active: 'Active', inactive: 'Inactive' },
          classifications: { eligibility: 'Eligibility classification', display: 'Display classification', pricing: 'Pricing classification' },
          empty: 'No matching labels found.', range: '{{from}}–{{to}} of {{total}} labels', resultCount: '{{count}} matching labels.',
          quickView: 'Product Label quick view', quickViewTitle: 'Quick view: {{name}}', recordId: 'Record ID: {{id}}',
          classification: 'Classification', associatedProduct: 'Associated product', lastUpdated: 'Last updated', notProvided: 'Not provided',
          close: 'Close', notFoundTitle: 'Label not found', notFoundDescription: 'No Product Label exists with ID “{{id}}”.', returnToList: 'Return to list'
        },
        decisions: enDecisionResources,
        promotion: { ...enPageResources.promotion, ...pageExtra.en.promotion },
        forms: { ...pageExtra.en.forms },
        offer: { ...baseResources.en.claude.offer, ...pageExtra.en.offer },
        experiments: { ...enPageResources.experiments, ...experimentExtra.en, ...pageExtra.en.experiments }
      }
    }
  }
} as const;

type DeepKeys<T> = T extends readonly unknown[]
  ? `${number}`
  : T extends object
    ? { [K in keyof T & string]: K | `${K}.${DeepKeys<T[K]>}` }[keyof T & string]
    : never;
type SameKeys<A, B> = Exclude<DeepKeys<A>, DeepKeys<B>> extends never
  ? Exclude<DeepKeys<B>, DeepKeys<A>> extends never ? true : false
  : false;
const commonKeyParity: SameKeys<typeof resources.vi.common, typeof resources.en.common> = true;
const navigationKeyParity: SameKeys<typeof resources.vi.navigation, typeof resources.en.navigation> = true;
const claudePageKeyParity: SameKeys<typeof resources.vi.claude.pages.sync, typeof resources.en.claude.pages.sync> = true;
const promotionKeyParity: SameKeys<typeof resources.vi.claude.pages.promotion, typeof resources.en.claude.pages.promotion> = true;
const promotionTypeKeyParity: SameKeys<typeof resources.vi.claude.pages.promotionType, typeof resources.en.claude.pages.promotionType> = true;
const requiredInfoKeyParity: SameKeys<typeof resources.vi.claude.pages.requiredInfo, typeof resources.en.claude.pages.requiredInfo> = true;
const displaySetKeyParity: SameKeys<typeof resources.vi.claude.pages.displaySet, typeof resources.en.claude.pages.displaySet> = true;
const backgroundKeyParity: SameKeys<typeof resources.vi.claude.pages.background, typeof resources.en.claude.pages.background> = true;
const assignedKeyParity: SameKeys<typeof resources.vi.claude.pages.assigned, typeof resources.en.claude.pages.assigned> = true;
const popularLoansKeyParity: SameKeys<typeof resources.vi.claude.pages.popularLoans, typeof resources.en.claude.pages.popularLoans> = true;
const attractiveOfferKeyParity: SameKeys<typeof resources.vi.claude.pages.attractiveOffer, typeof resources.en.claude.pages.attractiveOffer> = true;
const exclusiveTouchKeyParity: SameKeys<typeof resources.vi.claude.pages.exclusiveTouch, typeof resources.en.claude.pages.exclusiveTouch> = true;
const experimentsKeyParity: SameKeys<typeof resources.vi.claude.pages.experiments, typeof resources.en.claude.pages.experiments> = true;
const decisionsKeyParity: SameKeys<typeof resources.vi.claude.pages.decisions, typeof resources.en.claude.pages.decisions> = true;
const productLabelsKeyParity: SameKeys<typeof resources.vi.claude.pages.productLabels, typeof resources.en.claude.pages.productLabels> = true;
const formsKeyParity: SameKeys<typeof resources.vi.claude.pages.forms, typeof resources.en.claude.pages.forms> = true;
const offerPageKeyParity: SameKeys<typeof resources.vi.claude.pages.offer, typeof resources.en.claude.pages.offer> = true;
const claudeBaseKeyParity: SameKeys<Omit<typeof resources.vi.claude, 'pages'>, Omit<typeof resources.en.claude, 'pages'>> = true;
const chatgptKeyParity: SameKeys<typeof resources.vi.chatgpt, typeof resources.en.chatgpt> = true;
const compareKeyParity: SameKeys<typeof resources.vi.compare, typeof resources.en.compare> = true;
const validationKeyParity: SameKeys<typeof resources.vi.validation, typeof resources.en.validation> = true;
void [commonKeyParity, navigationKeyParity, claudePageKeyParity, promotionKeyParity, promotionTypeKeyParity, requiredInfoKeyParity, displaySetKeyParity, backgroundKeyParity, assignedKeyParity, popularLoansKeyParity, attractiveOfferKeyParity, exclusiveTouchKeyParity, experimentsKeyParity, decisionsKeyParity, productLabelsKeyParity, formsKeyParity, offerPageKeyParity, claudeBaseKeyParity, chatgptKeyParity, compareKeyParity, validationKeyParity];
