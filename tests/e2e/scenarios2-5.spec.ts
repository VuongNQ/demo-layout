import { expect, test as base } from '@playwright/test';

const knownRouterHydrateWarning = /No `HydrateFallback` element provided to render during initial hydration/;
const knownRcUtilWarning = /There may be circular references/;

type BrowserDiagnostics = {
  warnings: string[];
  errors: string[];
  pageErrors: string[];
};

const test = base.extend<{ browserDiagnostics: void }>({
  browserDiagnostics: [async ({ page }, use, testInfo) => {
    const diagnostics: BrowserDiagnostics = { warnings: [], errors: [], pageErrors: [] };
    const unexpectedWarnings: string[] = [];
    const unexpectedErrors: string[] = [];
    page.on('console', (message) => {
      const text = message.text();
      if (message.type() === 'warning') {
        diagnostics.warnings.push(text);
        if (!knownRouterHydrateWarning.test(text)) unexpectedWarnings.push(text);
      } else if (message.type() === 'error') {
        diagnostics.errors.push(text);
        if (!knownRcUtilWarning.test(text)) unexpectedErrors.push(text);
      }
    });
    page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));

    await use();

    const known = {
      reactRouterHydrateFallback: diagnostics.warnings.filter((text) => knownRouterHydrateWarning.test(text)).length,
      rcUtilCircularReference: diagnostics.errors.filter((text) => knownRcUtilWarning.test(text)).length
    };
    await testInfo.attach('browser-console-diagnostics', {
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify({ ...diagnostics, known, unexpectedWarnings, unexpectedErrors }, null, 2))
    });
    console.log(`[browser-console] ${testInfo.title}: ${JSON.stringify({ ...known, warnings: diagnostics.warnings.length, errors: diagnostics.errors.length, pageErrors: diagnostics.pageErrors.length })}`);
    expect(unexpectedWarnings, 'unexpected browser console.warn messages').toEqual([]);
    expect(unexpectedErrors, 'unexpected browser console.error messages').toEqual([]);
    expect(diagnostics.pageErrors, 'uncaught browser page errors').toEqual([]);
  }, { auto: true }]
});

test.beforeEach(async ({ page }) => {
  await page.goto('');
  const language = page.getByRole('combobox', { name: /ngôn ngữ|language/i });
  if (await language.isVisible()) await language.selectOption('en');
});

test('Compare exposes the four implemented ChatGPT scenario destinations', async ({ page }) => {
  const cases = [
    ['unsaved-changes', '/chatgpt/experiments/unsaved-changes', 'Unsaved changes'],
    ['reorder-pagination', '/chatgpt/experiments/reorder-pagination', 'Reorder with pagination'],
    ['tabs-vs-anchor', '/chatgpt/experiments/tabs-vs-anchor', 'Tabs vs anchor validation'],
    ['contextual-save', '/chatgpt/product-settings/product-setting-1', 'Contextual save placement']
  ] as const;

  for (const [scenarioId, destination, title] of cases) {
    await page.goto(`compare/${scenarioId}`);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  const link = page.getByRole('link', { name: 'Open ChatGPT screen', exact: true });
    await expect(link).toHaveAttribute('href', new RegExp(`${destination.replaceAll('/', '\\/')}$`));
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${destination.replaceAll('/', '\\/')}$`));
    await expect(page.getByRole('main')).toHaveCount(1);
  }
});

test('Scenario 2 protects draft exits and saves into the current fictional list state', async ({ page }) => {
  await page.goto('chatgpt/experiments/unsaved-changes?source=acceptance#records');
  await page.getByRole('link', { name: 'Open editor' }).first().click();
  const drawer = page.getByRole('dialog');
  const name = drawer.getByRole('textbox', { name: 'Campaign name' });
  await expect(name).toHaveValue('Spring welcome offer');
  await name.fill('Edited sample offer');
  await page.goBack();
  const confirmation = page.getByRole('dialog', { name: 'Unsaved changes' });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: 'Stay' }).click();
  await expect(name).toHaveValue('Edited sample offer');
  await drawer.getByRole('button', { name: 'Save draft' }).click();
  await expect(page).toHaveURL(/chatgpt\/experiments\/unsaved-changes\?source=acceptance#records$/);
  await expect(page.getByRole('status').filter({ hasText: 'Sample draft saved for Edited sample offer.' })).toBeVisible();

  await page.getByRole('link', { name: 'Open editor' }).first().click();
  await expect(page.getByRole('dialog').getByRole('textbox', { name: 'Campaign name' })).toHaveValue('Edited sample offer');
  await page.getByRole('dialog').getByRole('textbox', { name: 'Campaign name' }).fill('Unsaved then discard');
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).first().click();
  await page.getByRole('dialog', { name: 'Unsaved changes' }).getByRole('button', { name: 'Discard changes' }).click();
  await expect(page).toHaveURL(/chatgpt\/experiments\/unsaved-changes\?source=acceptance#records$/);
});

test('Scenario 3 keeps the 120-item dataset intact across page-local reorder and pagination', async ({ page }) => {
  await page.goto('chatgpt/experiments/reorder-pagination');
  await expect(page.getByText('Showing 1–20 of 120 items')).toBeVisible();
  const list = page.getByRole('list', { name: 'Sortable offer list' });
  await expect(list.getByRole('listitem')).toHaveCount(20);
  const first = list.getByRole('listitem').first();
  const name = (await first.locator('strong').textContent()) ?? '';
  await first.getByRole('button', { name: `Move ${name} down` }).click();
  await expect(page.getByText('Order has unsaved changes')).toBeVisible();
  await expect(list.getByRole('listitem').nth(1)).toContainText(name);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Showing 21–40 of 120 items')).toBeVisible();
  await expect(list.getByRole('listitem')).toHaveCount(20);
  await page.getByRole('button', { name: 'Reorder all items' }).click();
  await expect(page.getByText('All-items mode loads every item and allows a position change across all 120 items.')).toBeVisible();
  await expect(list.getByRole('listitem')).toHaveCount(120);
  await page.getByRole('button', { name: 'Discard changes' }).click();
  await expect(page.getByText('Order is saved')).toBeVisible();
});

test('Scenario 4 locates errors across tabs and sections, preserving form values', async ({ page }) => {
  await page.goto('chatgpt/experiments/tabs-vs-anchor');
  await page.getByRole('button', { name: 'Validate form' }).first().click();
  const tabSummary = page.getByRole('alert').filter({ hasText: '2 errors need attention.' }).first();
  await expect(tabSummary).toBeVisible();
  await tabSummary.getByRole('button', { name: 'Go to the Program name field with an error' }).click();
  await expect(page.getByRole('tab', { name: 'General information' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('textbox', { name: 'Program name' }).first()).toBeFocused();
  await tabSummary.getByRole('button', { name: 'Go to the Reminder days before field with an error' }).click();
  await expect(page.getByRole('tab', { name: 'Notifications' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('spinbutton', { name: 'Reminder days before' }).first()).toBeFocused();
  await expect(page.getByRole('spinbutton', { name: 'Reminder days before' }).first()).toHaveValue('45');

  await page.getByRole('button', { name: 'Validate form' }).last().click();
  const anchorSummary = page.getByRole('alert').filter({ hasText: '2 errors need attention.' }).last();
  await expect(anchorSummary).toBeVisible();
  await anchorSummary.getByRole('button', { name: 'Go to the Reminder days before field with an error' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Reminder days before' }).last()).toBeFocused();
});

test('Scenario 5 keeps contextual actions reachable and resets the baseline on discard/save', async ({ page }) => {
  await page.goto('chatgpt/product-settings/product-setting-1');
  await page.reload();
  const name = page.getByRole('textbox', { name: 'Product name' });
  await expect(name).toHaveValue('Vay mua xe trả góp #1');
  const original = await name.inputValue();
  await name.fill(`${original} edited`);
  await expect(page.getByText('Unsaved changes').first()).toBeVisible();
  await page.getByRole('button', { name: 'Discard changes' }).first().click();
  await expect(name).toHaveValue(original);
  await name.fill(`${original} saved`);
  await page.getByRole('button', { name: 'Save changes' }).first().click();
  await expect(page.getByRole('status').filter({ hasText: 'Saving…' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Sample settings saved.' })).toBeVisible();
  await expect(page.getByText('All changes are saved')).toBeVisible();

  await page.setViewportSize({ width: 320, height: 800 });
  const saveButton = page.getByRole('button', { name: 'Save changes' }).first();
  const bounds = await saveButton.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
});

test('Scenario 2 direct drawer refresh, invalid submit, and semantic dirty revert preserve the record', async ({ page }) => {
  const route = 'chatgpt/experiments/unsaved-changes/demo-campaign-1?source=acceptance#records';
  await page.goto(route);
  let drawer = page.getByRole('dialog');
  let name = drawer.getByRole('textbox', { name: 'Campaign name' });
  await expect(name).toHaveValue('Spring welcome offer');
  await page.reload();
  drawer = page.getByRole('dialog');
  name = drawer.getByRole('textbox', { name: 'Campaign name' });
  const note = drawer.getByRole('textbox', { name: 'Note' });
  await expect(name).toHaveValue('Spring welcome offer');
  await name.fill('');
  await note.fill('Retained after validation.');
  await drawer.getByRole('button', { name: 'Save draft' }).click();
  await expect(drawer.getByText('Enter a name.')).toBeVisible();
  await expect(name).toHaveValue('');
  await expect(note).toHaveValue('Retained after validation.');

  await name.fill('Temporary name');
  await name.fill('Spring welcome offer');
  await expect(drawer.getByText('No changes')).toBeVisible();
  await expect(drawer.getByRole('button', { name: 'Save draft' })).toBeDisabled();
});

for (const closeAction of ['visible Close', 'Escape', 'backdrop'] as const) {
  test(`Scenario 2 dirty drawer protects ${closeAction} and supports Stay/Discard`, async ({ page }) => {
    await page.goto('chatgpt/experiments/unsaved-changes/demo-campaign-1?source=close-test#records');
    const drawer = page.getByRole('dialog');
    const name = drawer.getByRole('textbox', { name: 'Campaign name' });
    await name.fill('Draft that must not disappear');

    if (closeAction === 'visible Close') {
      await drawer.getByRole('button', { name: 'Close', exact: true }).click();
    } else if (closeAction === 'Escape') {
      await page.keyboard.press('Escape');
    } else {
      await page.locator('.ant-drawer-mask').click();
    }

    const confirmation = page.getByRole('dialog', { name: 'Unsaved changes' });
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole('button', { name: 'Stay' }).click();
    await expect(name).toHaveValue('Draft that must not disappear');
    await expect(page).toHaveURL(/demo-campaign-1\?source=close-test#records$/);

    if (closeAction === 'visible Close') await drawer.getByRole('button', { name: 'Close', exact: true }).click();
    else if (closeAction === 'Escape') await page.keyboard.press('Escape');
    else await page.locator('.ant-drawer-mask').click();
    await page.getByRole('dialog', { name: 'Unsaved changes' }).getByRole('button', { name: 'Discard changes' }).click();
    await expect(page).toHaveURL(/chatgpt\/experiments\/unsaved-changes\?source=close-test#records$/);
  });
}

test('Scenario 2 switches record only after a dirty draft is safely discarded', async ({ page }) => {
  await page.goto('chatgpt/experiments/unsaved-changes?source=switch#records');
  await page.getByRole('link', { name: 'Open editor' }).first().click();
  const firstDrawer = page.getByRole('dialog');
  await firstDrawer.getByRole('textbox', { name: 'Campaign name' }).fill('Uncommitted first record');
  await firstDrawer.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('dialog', { name: 'Unsaved changes' }).getByRole('button', { name: 'Discard changes' }).click();
  await page.getByRole('link', { name: 'Open Everyday card reminder' }).click();
  const secondDrawer = page.getByRole('dialog');
  await expect(secondDrawer.getByRole('textbox', { name: 'Campaign name' })).toHaveValue('Everyday card reminder');
  await expect(secondDrawer.getByRole('textbox', { name: 'Note' })).toHaveValue('Keep the existing schedule.');
});

test('Scenario 3 keyboard reorder is page-scoped and discard restores its baseline', async ({ page }) => {
  await page.goto('chatgpt/experiments/reorder-pagination');
  const list = page.getByRole('list', { name: 'Sortable offer list' });
  const first = list.getByRole('listitem').first();
  const itemName = (await first.locator('strong').textContent()) ?? '';
  const dragHandle = first.getByRole('button', { name: `Drag ${itemName} to reorder` });
  await dragHandle.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expect(list.getByRole('listitem').nth(1)).toContainText(itemName);
  await expect(page.getByText('Order has unsaved changes')).toBeVisible();
  await page.getByRole('button', { name: 'Discard changes' }).click();
  await expect(list.getByRole('listitem').first()).toContainText(itemName);
  await expect(page.getByText('Order is saved')).toBeVisible();
});

test('Scenario 3 direct global position saves exactly 120 unique offer IDs', async ({ page }) => {
  await page.goto('chatgpt/experiments/reorder-pagination');
  const list = page.getByRole('list', { name: 'Sortable offer list' });
  const firstIdText = await list.getByRole('listitem').first().locator('span').textContent();
  const firstId = firstIdText?.split(' · ')[0]?.trim();
  expect(firstId).toMatch(/^offer-/);

  await page.getByRole('button', { name: 'Enter a position' }).click();
  await page.getByRole('textbox', { name: 'Offer ID' }).fill(firstId!);
  await page.getByRole('spinbutton', { name: 'Target position' }).fill('120');
  await page.getByRole('button', { name: 'Preview move' }).click();
  await expect(page.getByRole('status')).toContainText(`${firstId} will move to position 120 when saved.`);
  await page.getByRole('button', { name: 'Save order' }).click();
  await expect(page.getByText('Sample order saved.')).toBeVisible();

  const allRows = list.getByRole('listitem');
  await expect(allRows).toHaveCount(120);
  const ids = await allRows.locator('span').allTextContents();
  const normalizedIds = ids.map((text) => text.split(' · ')[0]?.trim());
  expect(normalizedIds).toHaveLength(120);
  expect(new Set(normalizedIds).size).toBe(120);
  await expect(allRows.last()).toContainText(firstId!);
});

test('Scenario 4 tab and anchor summaries clear errors in different correction orders without losing values', async ({ page }) => {
  await page.goto('chatgpt/experiments/tabs-vs-anchor');
  await page.getByRole('button', { name: 'Validate form' }).first().click();
  const tabCard = page.getByRole('heading', { name: 'A — Tabbed form' }).locator('..').locator('..');
  const tabSummary = tabCard.getByRole('alert');
  await expect(tabSummary).toContainText('2 errors need attention.');
  await tabSummary.getByRole('button', { name: 'Go to the Reminder days before field with an error' }).click();
  const tabReminder = page.getByRole('spinbutton', { name: 'Reminder days before' }).first();
  await tabReminder.fill('30');
  await expect(tabSummary).toContainText('1 errors need attention.');
  await tabSummary.getByRole('button', { name: 'Go to the Program name field with an error' }).click();
  const tabName = page.getByRole('textbox', { name: 'Program name' }).first();
  await tabName.fill('Sample program');
  await expect(tabSummary).toHaveCount(0);
  await page.getByRole('tab', { name: 'Notifications' }).click();
  await expect(tabReminder).toHaveValue('30');
  await page.getByRole('tab', { name: 'General information' }).click();
  await expect(tabName).toHaveValue('Sample program');

  await page.getByRole('button', { name: 'Validate form' }).last().click();
  const anchorSummary = page.getByRole('alert').filter({ hasText: '2 errors need attention.' }).last();
  await anchorSummary.getByRole('button', { name: 'Go to the Program name field with an error' }).click();
  const anchorName = page.getByRole('textbox', { name: 'Program name' }).last();
  await anchorName.fill('Anchor program');
  await expect(anchorSummary).toContainText('1 errors need attention.');
  await anchorSummary.getByRole('button', { name: 'Go to the Reminder days before field with an error' }).click();
  const anchorReminder = page.getByRole('spinbutton', { name: 'Reminder days before' }).last();
  await anchorReminder.fill('30');
  await expect(anchorSummary).toHaveCount(0);
  await expect(anchorName).toHaveValue('Anchor program');
});

test('Scenario 5 conditional fields and validation remain coherent after language switching', async ({ page }) => {
  await page.goto('chatgpt/product-settings/product-setting-1');
  const name = page.getByRole('textbox', { name: 'Product name' });
  await name.fill('Edited without reset');
  const language = page.getByRole('combobox', { name: /ngôn ngữ|language/i });
  await language.selectOption('vi');
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(page.getByRole('textbox', { name: 'Tên sản phẩm' })).toHaveValue('Edited without reset');

  const audience = page.getByRole('combobox', { name: 'Đối tượng' });
  await audience.click();
  await page.getByRole('option', { name: 'Doanh nghiệp' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Doanh thu tối thiểu mỗi năm' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Tuổi tối thiểu' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Lưu thay đổi' }).first().click();
  await expect(page.getByRole('alert').filter({ hasText: 'Kiểm tra các trường được đánh dấu' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Tên sản phẩm' })).toHaveValue('Edited without reset');
  await expect(page.getByRole('combobox', { name: 'Đối tượng' })).toContainText('Doanh nghiệp');
});

test('Scenario 5 semantic revert, route Stay/Discard, and successful Save establish the correct baseline', async ({ page }) => {
  await page.goto('chatgpt/product-settings/product-setting-1');
  const name = page.getByRole('textbox', { name: 'Product name' });
  const original = await name.inputValue();
  await name.fill(`${original} temporary`);
  await name.fill(original);
  await expect(page.getByText('All changes are saved')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save changes' }).first()).toBeDisabled();

  await name.fill(`${original} keep on stay`);
  await page.getByRole('button', { name: 'Back to workspace' }).click();
  const guard = page.getByRole('dialog', { name: 'Unsaved changes' });
  await expect(guard).toBeVisible();
  await guard.getByRole('button', { name: 'Stay' }).click();
  await expect(name).toHaveValue(`${original} keep on stay`);
  await page.getByRole('button', { name: 'Back to workspace' }).click();
  await page.getByRole('dialog', { name: 'Unsaved changes' }).getByRole('button', { name: 'Discard changes' }).click();
  await expect(page).toHaveURL(/chatgpt\/?$/);

  await page.goto('chatgpt/product-settings/product-setting-1');
  const saveName = page.getByRole('textbox', { name: 'Product name' });
  await saveName.fill(`${original} saved baseline`);
  await page.getByRole('button', { name: 'Save changes' }).first().click();
  await expect(page.getByRole('status').filter({ hasText: 'Sample settings saved.' })).toBeVisible();
  await expect(page.getByText('All changes are saved')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save changes' }).first()).toBeDisabled();
});

test('Scenario 5 warns on refresh with unsaved edits and keeps sticky actions in the viewport', async ({ page }) => {
  await page.goto('chatgpt/product-settings/product-setting-1');
  await page.getByRole('textbox', { name: 'Product name' }).fill('Changed before refresh');
  const dialogPromise = page.waitForEvent('dialog');
  const reloadPromise = page.reload();
  const beforeUnload = await dialogPromise;
  expect(beforeUnload.type()).toBe('beforeunload');
  await beforeUnload.accept();
  await reloadPromise;
  await expect(page.getByRole('textbox', { name: 'Product name' })).toHaveValue('Vay mua xe trả góp #1');

  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    const saveButton = page.getByRole('button', { name: 'Save changes' }).first();
    const bounds = await saveButton.boundingBox();
    expect(bounds, `save action should be rendered at ${width}px`).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
  }
});
