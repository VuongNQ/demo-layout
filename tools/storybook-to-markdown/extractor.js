// This function is serialized into inspected frames via chrome.scripting.executeScript.
// Keep it self-contained: it cannot close over extension-worker variables or APIs.
function extractStorybookDocument(options) {
  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const text = (element) => clean(element?.textContent);
  const docsSelector = '.sbdocs-wrapper, .sbdocs-content, #storybook-docs, [data-testid="storybook-docs"]';
  const rootSelectors = ['.sbdocs-wrapper', '.sbdocs-content', '#storybook-docs', '[data-testid="storybook-docs"]'];
  const matchedRootSelector = rootSelectors.find((selector) => document.querySelector(selector)) || '';
  const matchedRoot = matchedRootSelector ? document.querySelector(matchedRootSelector) : null;
  const params = new URLSearchParams(location.search);
  const docsPath = params.get('path') || '';
  const storyId = docsPath.replace(/^\/docs\//, '') || (params.get('viewMode') === 'docs' ? params.get('id') || '' : '');
  const root = matchedRoot || document.querySelector('main') || document.body;
  const titleNode = root.querySelector('h1, h2');
  const title = text(titleNode) || clean(document.title.replace(/\s*[-|]\s*Storybook.*$/i, '')) || 'Untitled';
  const description = [...root.querySelectorAll('p')].map(text).filter(Boolean).slice(0, 5);
  const headings = [...root.querySelectorAll('h2,h3,h4')].map((element) => ({ level: Number(element.tagName[1]), text: text(element) })).filter((heading) => heading.text).slice(0, 100);
  const nearestHeading = (element) => {
    let current = element;
    while (current && current !== root) {
      const previous = current.previousElementSibling;
      if (previous) {
        const heading = previous.matches?.('h1,h2,h3,h4,h5,h6') ? previous : previous.querySelector?.('h1,h2,h3,h4,h5,h6');
        if (heading) return text(heading);
      }
      current = current.parentElement;
    }
    return '';
  };
  const tableRecords = options.props ? [...root.querySelectorAll('table, [role="table"], [role="grid"]')].map((table) => {
    const isNativeTable = table.tagName.toLowerCase() === 'table';
    const rowSelector = isNativeTable ? ':scope > thead > tr, :scope > tbody > tr, :scope > tr' : '[role="row"]';
    const cellSelector = isNativeTable ? ':scope > th, :scope > td' : '[role="columnheader"], [role="rowheader"], [role="gridcell"], [role="cell"]';
    const rows = [...table.querySelectorAll(rowSelector)]
      .map((row) => [...row.querySelectorAll(cellSelector)].map(text))
      .filter((row) => row.some(Boolean)).slice(0, 150);
    const header = (rows[0] || []).join(' ').toLowerCase();
    const classes = typeof table.className === 'string' ? table.className.toLowerCase() : '';
    const heading = nearestHeading(table);
    const selectorEvidence = /docblock-argstable|argtypes|argstable|sb-argstable/.test(classes) || Boolean(table.closest('.docblock-argstable, .docblock-argstable-body, [class*="argstable"]'));
    const headerEvidence = /(^|\s)(name|prop|property|type|default|default value|description|control|category|value)(\s|$)/.test(header);
    const variantEvidence = /variant|size|state/i.test(heading) && rows.length > 1;
    let classification = 'unknown';
    let confidence = 'low';
    let reason = 'No known Storybook props-table or variant evidence.';
    if (selectorEvidence) {
      classification = 'props'; confidence = 'high'; reason = 'Known Storybook Args/Controls table class.';
    } else if (variantEvidence) {
      classification = 'variants'; confidence = 'medium'; reason = 'Nearby section heading identifies variants.';
    } else if (headerEvidence && rows.length > 1) {
      classification = 'props'; confidence = 'medium'; reason = 'Header contains common props-table fields.';
    } else if (table.matches('[role="grid"], [role="table"]') || table.querySelector('[role="gridcell"], [role="cell"]')) {
      classification = 'rendered'; confidence = 'medium'; reason = 'Table is marked as a rendered UI grid/table.';
    } else if (heading) {
      classification = 'rendered'; confidence = 'low'; reason = 'Regular table under a rendered documentation section.';
    }
    return { rows, classification, confidence, reason, heading };
  }).filter((table) => table.rows.length) : [];
  const propsTables = tableRecords.filter((table) => table.classification === 'props' || table.classification === 'variants');
  const renderedTables = tableRecords.filter((table) => table.classification === 'rendered');
  const unknownTables = tableRecords.filter((table) => table.classification === 'unknown');
  const examples = options.examples ? [...root.querySelectorAll('pre')].map((element) => ({
    code: (element.innerText || element.textContent || '').trim(),
    language: [...element.classList].find((name) => /language-|lang-/.test(name))?.replace(/^(language-|lang-)/, '') || '',
    heading: nearestHeading(element),
  })).filter((example) => example.code).slice(0, 40) : [];
  const guidelines = options.examples ? [...root.querySelectorAll('blockquote, ul, ol')]
    .filter((element) => element.closest(docsSelector) || matchedRoot?.contains(element))
    .filter((element) => !element.parentElement?.closest('ul, ol'))
    .map((element) => ({ text: text(element), heading: nearestHeading(element), kind: element.tagName.toLowerCase() }))
    .filter((item) => item.text).slice(0, 30) : [];
  const tokens = [];
  const rootStyle = getComputedStyle(document.documentElement);
  const theme = clean(document.documentElement.getAttribute?.('data-theme') || document.documentElement.getAttribute?.('data-color-scheme') || document.body?.getAttribute?.('data-theme') || document.body?.getAttribute?.('data-color-scheme')) || 'unknown';
  const tokenContext = { theme, colorScheme: clean(rootStyle.colorScheme) || 'unknown' };
  if (options.tokens) {
    for (const element of [...root.querySelectorAll('[style], [class*="token"], [class*="swatch"]')].slice(0, 150)) {
      const label = clean(element.getAttribute('aria-label') || element.getAttribute('title') || text(element)).slice(0, 100);
      const style = getComputedStyle(element);
      if (label && (String(element.className).match(/token|swatch/i) || element.hasAttribute('style'))) {
        const classNames = typeof element.className === 'string' ? element.className.split(/\s+/).filter((name) => /token|swatch/i.test(name)).sort().join('.') : '';
        const identity = element.getAttribute('data-token') || element.id || `${classNames || 'inline-style'}:${label}`;
        tokens.push({ identity: `computed-style:${identity}`, label, context: tokenContext, color: style.color, background: style.backgroundColor, font: style.fontFamily, fontSize: style.fontSize, radius: style.borderRadius });
      }
    }
    for (let index = 0; index < rootStyle.length && tokens.length < 180; index++) {
      const key = rootStyle.item(index);
      if (key.startsWith('--') && /color|font|space|radius|size|shadow|border|brand/i.test(key)) {
        tokens.push({ identity: `css-custom-property:${key}`, name: key, value: rootStyle.getPropertyValue(key).trim(), context: tokenContext });
      }
    }
  }
  const bodyText = clean(root.innerText || root.textContent);
  return {
    title,
    url: location.href,
    storyId,
    description,
    headings,
    tables: tableRecords,
    propsTables,
    renderedTables,
    unknownTables,
    examples,
    guidelines,
    tokens,
    tokenContext,
    contentLength: bodyText.length,
    foundDocs: Boolean(matchedRoot),
    rootSelector: matchedRootSelector,
  };
}
