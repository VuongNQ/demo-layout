// This function is serialized into inspected frames via chrome.scripting.executeScript.
// Do not reference outer lexical scope or extension APIs here.
function extractStorybookDocument(options) {
  const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const text = (el) => clean(el?.textContent);
  const root = document.querySelector('.sbdocs-wrapper, .sbdocs-content, #storybook-docs, [data-testid="storybook-docs"]') || document.querySelector('main') || document.body;
  const heading = root.querySelector('h1, h2');
  const title = text(heading) || clean(document.title.replace(/\s*[-|]\s*Storybook.*$/i, '')) || 'Untitled';
  const description = [...root.querySelectorAll('p')].map(text).filter(Boolean).slice(0, 5);
  const headings = [...root.querySelectorAll('h2,h3,h4')].map(e => ({ level: Number(e.tagName[1]), text: text(e) })).filter(e => e.text).slice(0, 100);
  const tables = options.props ? [...root.querySelectorAll('table')].map(table => {
    const rows = [...table.querySelectorAll('tr')].map(tr => [...tr.querySelectorAll('th,td')].map(text));
    return rows.filter(row => row.some(Boolean)).slice(0, 150);
  }).filter(rows => rows.length) : [];
  const examples = options.examples ? [...root.querySelectorAll('pre')].map(el => el.innerText || el.textContent || '').map(s => s.trim()).filter(Boolean).slice(0, 40) : [];
  const guidelines = options.examples ? [...root.querySelectorAll('blockquote, .sbdocs-content ul, .sbdocs-content ol')].map(text).filter(Boolean).slice(0, 30) : [];
  const tokens = [];
  if (options.tokens) {
    for (const el of [...root.querySelectorAll('[style], [class*="token"], [class*="swatch"]')].slice(0, 150)) {
      const label = clean(el.getAttribute('aria-label') || el.getAttribute('title') || text(el)).slice(0, 100);
      const style = getComputedStyle(el);
      const val = { label, color: style.color, background: style.backgroundColor, font: style.fontFamily, fontSize: style.fontSize, radius: style.borderRadius };
      if (label && (el.className?.toString().match(/token|swatch/i) || el.hasAttribute('style'))) tokens.push(val);
    }
    const styles = getComputedStyle(document.documentElement);
    for (let i = 0; i < styles.length; i++) {
      const key = styles.item(i);
      if (key.startsWith('--') && /color|font|space|radius|size|shadow|border|brand/i.test(key)) {
        tokens.push({ name: key, value: styles.getPropertyValue(key).trim() });
      }
      if (tokens.length >= 180) break;
    }
  }
  return { title, url: location.href, description, headings, tables, examples, guidelines, tokens, contentLength: clean(root.innerText || root.textContent).length, foundDocs: !!document.querySelector('.sbdocs-wrapper, .sbdocs-content, #storybook-docs, [data-testid="storybook-docs"]') };
}
