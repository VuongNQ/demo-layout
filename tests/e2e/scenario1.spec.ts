import { expect, test as baseTest, type Page } from '@playwright/test';

const scenarioKey = 'compare-workspace:v1:drawer-vs-full-page';
const csvHeaders = [
  'scenario_id', 'scenario', 'fictional_record', 'task', 'expected_outcome', 'reproduction_steps',
  'criterion_id', 'criterion', 'check', 'claude_url', 'claude_current_url', 'claude_availability',
  'chatgpt_url', 'chatgpt_availability', 'claude_observation', 'chatgpt_observation', 'evidence',
  'decision_status', 'decision_owner', 'decision_date', 'rationale', 'open_questions'
];

const test = baseTest.extend<{ noClientErrors: void }>({
  noClientErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
    await use();
    expect(errors, 'uncaught browser and console errors').toEqual([]);
  }, { auto: true }]
});

test.beforeEach(async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('combobox', { name: /ngôn ngữ|language/i })).toHaveValue('vi');
  await selectEnglish(page);
});

async function selectEnglish(page: Page) {
  const language = page.getByRole('combobox', { name: /ngôn ngữ|language/i });
  await language.selectOption('en');
  await expect(language).toHaveValue('en');
}

async function openScenario(page: Page) {
  await page.goto('compare/drawer-vs-full-page');
  await expect(page.getByRole('heading', { name: 'Product Detail Presentation Patterns' })).toBeVisible();
}

test.describe('Scenario 1 — Compare contract and entry points', () => {
  test('exposes all four ChatGPT pilot entry links without changing the stable scenario identity', async ({ page }) => {
    await openScenario(page);
    const destinations = page.getByRole('link');
    await expect(destinations.filter({ hasText: 'Product Labels' })).toHaveAttribute('href', /\/chatgpt\/product-labels$/);
    await expect(destinations.filter({ hasText: 'Promotion Types' })).toHaveAttribute('href', /\/chatgpt\/promotion-types$/);
    await expect(destinations.filter({ hasText: 'Promotion Offer' })).toHaveAttribute('href', /\/chatgpt\/promotions$/);
    const history = destinations.filter({ hasText: 'Promotion History' });
    await expect(history).toHaveAttribute('href', /\/chatgpt\/promotions$/);
    await expect(page.getByText(/Open Promotions, then select “View history”/)).toBeVisible();
    await expect(page).toHaveURL(/compare\/drawer-vs-full-page$/);
  });

  test('loads and preserves fictional saved observations, and exports the exact 22-column English CSV', async ({ page }) => {
    await page.addInitScript(({ key }) => {
      localStorage.setItem(key, JSON.stringify({
        status: 'testing', owner: '', decisionDate: '', rationale: '', openQuestions: '',
        notes: { completion: { claude: 'Seeded Claude note', chatgpt: 'Seeded ChatGPT note', evidence: 'Synthetic evidence' } }
      }));
    }, { key: scenarioKey });
    await openScenario(page);
    await expect(page.getByRole('textbox', { name: 'ChatGPT observation' }).first()).toHaveValue('Seeded ChatGPT note');
    expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}').status, scenarioKey)).toBe('testing');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('banner').getByRole('button', { name: 'Download local-draft comparison CSV' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('compare-matrix-local-draft.csv');
    const stream = await download.createReadStream();
    expect(stream).not.toBeNull();
    let content = '';
    for await (const chunk of stream!) content += chunk.toString('utf8');
    const firstLine = content.split('\r\n')[0].replace(/^\uFEFF/, '');
    expect(firstLine.split(',').map((cell) => cell.replace(/^"|"$/g, ''))).toEqual(csvHeaders);
    expect(content).toContain('Seeded ChatGPT note');
    expect(content).toContain('Seeded Claude note');
    expect(content).toContain('Synthetic evidence');
    expect(content).toContain('drawer-vs-full-page');
  });

  test('switches vi/en without changing the URL or discarding an observation', async ({ page }) => {
    await openScenario(page);
    const url = page.url();
    const observation = page.getByRole('textbox', { name: 'ChatGPT observation' }).first();
    await observation.fill('Observation retained across language switch');
    await selectEnglish(page);
    await expect(page).toHaveURL(url);
    await expect(page.getByRole('heading', { name: 'Product Detail Presentation Patterns' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'ChatGPT observation' }).first()).toHaveValue('Observation retained across language switch');
    const language = page.getByRole('combobox', { name: /ngôn ngữ|language/i });
    await language.selectOption('vi');
    await expect(language).toHaveValue('vi');
    await expect(page.getByRole('heading', { name: /Các cách trình bày chi tiết sản phẩm/ })).toBeVisible();
    await expect(page).toHaveURL(url);
    await expect(page.getByRole('textbox', { name: /Quan sát ChatGPT/ }).first()).toHaveValue('Observation retained across language switch');
    await language.selectOption('en');
    await expect(language).toHaveValue('en');
    await expect(page.getByRole('textbox', { name: 'ChatGPT observation' }).first()).toHaveValue('Observation retained across language switch');
  });
});

test.describe('Product Label — route-backed Quick View', () => {
  test('searches, filters, paginates, and opens the read-only nested Drawer', async ({ page }) => {
    await page.goto('chatgpt/product-labels');
    const search = page.getByRole('textbox').first();
    await search.fill('PL-CASHBACK-04');
    await expect(page).toHaveURL(/q=PL-CASHBACK-04/);
    await expect(page.getByRole('row').filter({ hasText: 'Hoàn tiền mua sắm' })).toBeVisible();
    await expect(page.getByRole('row')).toHaveCount(2);

    await search.fill('');
    await page.getByTitle('2', { exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole('row')).toHaveCount(5);

    await page.goto('chatgpt/product-labels');
    const productLine = page.getByRole('combobox', { name: 'Filter by product line' });
    await productLine.click();
    const productLinePopup = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();
    // AntD exposes hidden virtual-list role=option sentinels alongside visible
    // option content without a role; scope the visible text to the open popup.
    const creditCardOption = productLinePopup.getByText('Credit card', { exact: true });
    await expect(creditCardOption).toBeVisible();
    await creditCardOption.click();
    await expect(page).toHaveURL(/line=credit-card/);
    const status = page.getByRole('combobox', { name: 'Filter by status' });
    await status.click();
    const statusPopup = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();
    const inactiveOption = statusPopup.getByText('Inactive', { exact: true });
    await expect(inactiveOption).toBeVisible();
    await inactiveOption.click();
    await expect(page).toHaveURL(/status=inactive/);
    await expect(page.getByRole('row')).toHaveCount(3);

    await page.goto('chatgpt/product-labels?line=credit-card&status=inactive&page=1#product-labels-list-heading');
    const target = page.getByRole('link', { name: /View details for label Ưu tiên du lịch/i });
    await target.click();
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    expect(await drawer.evaluate((node) => document.body.contains(node))).toBe(true);
    await expect(drawer.getByRole('heading', { name: /Ưu tiên du lịch|Travel priority/i })).toBeVisible();
    await expect(drawer.getByRole('button', { name: /Close|Đóng/i }).last()).toBeVisible();
    await expect(drawer.getByRole('button', { name: /Save|Delete|Activate|Lưu|Xóa|Kích hoạt/i })).toHaveCount(0);
  });

  test('direct deep links preserve query/hash on Escape and restore focus to the row action', async ({ page }) => {
    await page.goto('chatgpt/product-labels?line=cash-loan&status=active&page=1#product-labels-list-heading');
    const trigger = page.getByRole('link', { name: /View details for label Hồ sơ linh hoạt/i });
    const triggerId = await trigger.getAttribute('id');
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/chatgpt\/product-labels\?line=cash-loan&status=active&page=1#product-labels-list-heading$/);
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe(triggerId);

    await page.goto('chatgpt/product-labels/product-label-001?line=credit-card&page=2#return');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('product-label-001')).toBeVisible();
    await page.getByRole('button', { name: /Close|Đóng/i }).last().click();
    await expect(page).toHaveURL(/chatgpt\/product-labels\?line=credit-card&page=2#return$/);
    await expect(page.getByRole('main')).toHaveCount(1);
  });

  test('recovers from an unknown record ID', async ({ page }) => {
    await page.goto('chatgpt/product-labels/no-such-label?q=PL-NEW-02#record');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Label not found|Không tìm thấy nhãn sản phẩm/i)).toBeVisible();
    await page.getByRole('button', { name: /Return to list|Quay lại danh sách/i }).click();
    await expect(page).toHaveURL(/chatgpt\/product-labels\?q=PL-NEW-02#record$/);
  });
});

test.describe('Promotion Type — Quick Edit Drawer', () => {
  test('validates the three-field form and saves a fictional edit', async ({ page }) => {
    await page.goto('chatgpt/promotion-types?source=e2e#row');
    await page.getByRole('button', { name: /Add promotion type|Thêm loại khuyến mãi/i }).click();
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    expect(await drawer.evaluate((node) => document.body.contains(node))).toBe(true);
    await expect(page.getByRole('heading', { name: /Add promotion type|Thêm loại khuyến mãi/i })).toBeVisible();
    await drawer.getByRole('button', { name: /Create|Tạo mới/i }).click();
    await expect(drawer.getByRole('alert').filter({ hasText: /Review the fields marked/ })).toBeVisible();
    await expect(drawer.getByText(/required|bắt buộc/i).first()).toBeVisible();

    await drawer.getByRole('textbox', { name: /Promotion type name|Tên loại khuyến mãi/i }).fill('Playwright sample type');
    await drawer.getByRole('textbox', { name: /Code|Mã/i }).fill('PW-TYPE-001');
    await drawer.getByRole('button', { name: /Create|Tạo mới/i }).click();
    await expect(page).toHaveURL(/chatgpt\/promotion-types\?source=e2e#row$/);
    await expect(page.getByText(/Promotion type saved|Đã lưu loại khuyến mãi/)).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'Playwright sample type' })).toBeVisible();
  });

  test('protects dirty close, supports Stay and Discard, and works with browser Back', async ({ page }) => {
    await page.goto('chatgpt/promotion-types');
    await page.getByRole('link', { name: /Edit promotion type|Sửa loại khuyến mãi/i }).first().click();
    const drawer = page.getByRole('dialog');
    const name = drawer.getByRole('textbox', { name: /Promotion type name|Tên loại khuyến mãi/i });
    await name.fill('Unsaved test draft');
    await page.goBack();
    await expect(page.getByText('Discard your changes and leave this form?')).toBeVisible();
    await page.getByRole('button', { name: 'Keep editing' }).click();
    await expect(name).toHaveValue('Unsaved test draft');
    await expect(page.getByText('Discard your changes and leave this form?')).toHaveCount(0);
    await page.goBack();
    await expect(page.getByText('Discard your changes and leave this form?')).toBeVisible();
    await page.getByRole('button', { name: 'Discard changes' }).click();
    await expect(page).toHaveURL(/chatgpt\/promotion-types$/);
  });
});

test.describe('Promotion Offer — Full Page Create/Edit', () => {
  test('shows required validation, preserves form values, and creates a record', async ({ page }) => {
    await page.goto('chatgpt/promotions/create?source=e2e#form');
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByRole('button', { name: /Create|Tạo mới/i }).click();
    await expect(page.getByRole('alert').filter({ hasText: /fix|lỗi|validation|required|bắt buộc/i }).first()).toBeVisible();
    await page.getByRole('textbox', { name: /Promotion name|Tên khuyến mãi/i }).fill('Browser-created offer');
    await page.getByRole('textbox').nth(1).fill('PW-OFFER-001');

    const products = page.getByRole('combobox', { name: /Applicable products|Sản phẩm áp dụng/i });
    await products.click();
    await products.press('ArrowDown');
    await products.press('Enter');
    await products.press('Escape');
    await page.getByRole('button', { name: /Create|Tạo mới/i }).click();
    await expect(page).toHaveURL(/chatgpt\/promotions\?source=e2e#form$/);
    await expect(page.getByRole('row').filter({ hasText: 'Browser-created offer' })).toBeVisible();
    await page.getByRole('button', { name: /Add promotion|Thêm khuyến mãi/i }).click();
    await page.getByRole('button', { name: /Cancel|Hủy/i }).click();
    await expect(page).toHaveURL(/chatgpt\/promotions\?source=e2e#form$/);
  });

  test('supports semantic dirty revert, Cancel, direct edit refresh, and navigation protection', async ({ page }) => {
    await page.goto('chatgpt/promotions/promotion-1/edit?source=e2e#details');
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const name = page.getByRole('textbox', { name: /Promotion name|Tên khuyến mãi/i });
    const original = await name.inputValue();
    await name.fill(`${original} changed`);
    const discardAction = page.getByRole('button', { name: 'Discard changes' });
    await expect(discardAction).toBeVisible();
    await name.fill(original);
    await expect(discardAction).toHaveCount(0);

    await name.fill(`${original} discard`);
    await page.getByRole('button', { name: /Back to list|Quay lại danh sách/i }).click();
    await expect(page.getByText('Discard your changes and leave this page?')).toBeVisible();
    await page.getByRole('button', { name: 'Stay' }).last().click();
    await expect(name).toHaveValue(`${original} discard`);
    await page.getByRole('button', { name: /Back to list|Quay lại danh sách/i }).click();
    const blockerDialog = page.getByRole('dialog', { name: 'Unsaved changes' });
    await expect(blockerDialog.getByText('Discard your changes and leave this page?')).toBeVisible();
    await blockerDialog.getByRole('button', { name: 'Discard changes' }).click();
    await expect(page).toHaveURL(/chatgpt\/promotions\?source=e2e#details$/);
  });
});

test.describe('Promotion History — Log Viewer Modal', () => {
  test('copies only selected event details and adds isolated comments with rapid-submit protection', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('chatgpt/promotions');
    await page.getByRole('button', { name: /View history for promotion|Xem lịch sử khuyến mãi/i }).first().click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(modal.getByText(/promotion-history-promotion-1-products/)).toBeVisible();

    await modal.getByRole('button', { name: /Copy event details|Sao chép chi tiết sự kiện/i }).click();
    await expect(modal.getByText(/Event details copied|Đã sao chép chi tiết sự kiện/i)).toBeVisible();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain('promotion-history-promotion-1-products');
    expect(clipboard).not.toContain('Comment that should not be copied');

    const comment = modal.getByRole('textbox', { name: /^Comment$|^Nhận xét$/i });
    const submit = modal.getByRole('button', { name: /Add comment|Thêm nhận xét/i });
    await comment.fill('Comment that should not be copied');
    await submit.dblclick();
    await expect(modal.getByText(/Comments \(1\)|Nhận xét \(1\)/)).toBeVisible();
    await expect(modal.getByText(/Sample comment added|Đã thêm nhận xét mẫu/i)).toBeVisible();
    await comment.fill('Comment that should not be copied');
    await expect(modal.getByText(/Sample comment added|Đã thêm nhận xét mẫu/i)).toHaveCount(0);
    await submit.click();
    await expect(modal.getByText(/Comments \(2\)|Nhận xét \(2\)/)).toBeVisible();

    const eventNav = modal.getByRole('navigation', { name: /Sample events|Sự kiện mẫu/i });
    await eventNav.getByRole('button').nth(1).click();
    await expect(modal.getByText(/Comments \(0\)|Nhận xét \(0\)/)).toBeVisible();
    await expect(modal.getByText('Comment that should not be copied')).toHaveCount(0);
    await eventNav.getByRole('button').first().click();
    await expect(modal.getByText(/Comments \(2\)|Nhận xét \(2\)/)).toBeVisible();
  });

  test('confirms unsent draft before Escape close and restores feedback and focus safely', async ({ page }) => {
    await page.goto('chatgpt/promotions');
    const trigger = page.getByRole('button', { name: /View history for promotion|Xem lịch sử khuyến mãi/i }).first();
    await trigger.click();
    const modal = page.getByRole('dialog');
    const comment = modal.getByRole('textbox', { name: /^Comment$|^Nhận xét$/i });
    await comment.fill('Unsent draft must be confirmed');
    await page.keyboard.press('Escape');
    await expect(modal.getByText(/Unsent comment|Nhận xét chưa gửi/)).toBeVisible();
    await modal.getByRole('button', { name: /Keep writing|Tiếp tục viết/i }).click();
    await expect(comment).toHaveValue('Unsent draft must be confirmed');
    await modal.getByRole('button', { name: /Close|Đóng/i }).last().click();
    await modal.getByRole('button', { name: /Discard draft|Hủy bản nháp/i }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toMatch(/View history|Xem lịch sử/);
  });
});

test.describe('Platform integration, keyboard, and responsive checks', () => {
  test('serves the four pilots only in the ChatGPT shell and preserves Claude baseline lists', async ({ page }) => {
    await page.goto('chatgpt/product-labels');
    await expect(page.getByRole('navigation', { name: /primary|chính/i })).toBeVisible();
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'HDS Admin Next' })).toHaveCount(0);

    await page.goto('claude/promotion-types');
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'PTYPE-001' })).toBeVisible();
    await expect(page.getByRole('button', { name: /View history|Xem lịch sử/i })).toHaveCount(0);
    await page.goto('claude/promotions');
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Edit', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /View history|Xem lịch sử/i })).toHaveCount(0);
  });

  test('keeps controls within 320px and desktop viewports and switches language accessibly', async ({ page }) => {
    for (const width of [320, 375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('chatgpt/product-labels');
      await expect(page.getByRole('main')).toHaveCount(1);
      const label = page.getByRole('link', { name: /view details for|xem chi tiết/i }).first();
      await label.click();
      const drawer = page.getByRole('dialog');
      await expect(drawer).toBeVisible();
      await expect.poll(async () => {
        const bounds = await drawer.boundingBox();
        return bounds ? bounds.x + bounds.width : Number.POSITIVE_INFINITY;
      }, { message: `Drawer right edge should settle within ${width}px` }).toBeLessThanOrEqual(width);
      const close = drawer.getByRole('button', { name: /Close|Đóng/i }).last();
      await expect.poll(async () => {
        const bounds = await close.boundingBox();
        return bounds ? bounds.x + bounds.width : Number.POSITIVE_INFINITY;
      }, { message: `Drawer close action should fit within ${width}px` }).toBeLessThanOrEqual(width);
      await page.keyboard.press('Escape');
    }

    await page.goto('chatgpt');
    const language = page.getByRole('combobox', { name: /ngôn ngữ|language/i });
    const before = page.url();
    await language.selectOption('en');
    await expect(page).toHaveURL(before);
    await expect(language).toHaveValue('en');
  });
});
