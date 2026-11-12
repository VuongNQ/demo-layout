import http from 'node:http';

const port = Number(process.env.STORYBOOK_FIXTURE_PORT || 4179);
const retryRequests = new Map();
const docs = [
  { id: 'guide--docs', type: 'docs', title: 'Guides/Getting Started', name: 'Getting Started', tags: ['guide'] },
  { id: 'button--docs', type: 'docs', title: 'Components/Button', name: 'Button', tags: ['components'] },
  { id: 'form-control--docs', type: 'docs', title: 'Forms/Control', name: 'Control', tags: ['forms'] },
  { id: 'retry--docs', type: 'docs', title: 'Components/Retry Example', name: 'Retry Example', tags: ['components'] },
];

function page(id, { delayed = true } = {}) {
  const busy = delayed ? ' aria-busy="true"' : '';
  const initial = delayed ? '<p id="loading">Loading Docs…</p>' : '';
  const content = `<h1>${id}</h1><p>Rendered documentation for ${id}.</p><img src="/storybook/assets/hero.png" alt="Fixture hero"><img src="/storybook/assets/missing.png" alt="Missing fixture image"><svg><use href="/storybook/assets/icon.svg#check"></use></svg><a href="/storybook/?path=/docs/button--docs">Button Docs</a>
    <section class="api-example"><h2>API-dependent example</h2><button type="button" data-load-api-example>Load live example</button><output>Not loaded</output></section>
    <h2>Props</h2><table class="docblock-argstable"><tbody><tr><th>Name</th><th>Type</th><th>Default</th></tr><tr><td>size</td><td>string</td><td>medium</td></tr></tbody></table>
    <h2>Rendered table</h2><table><tbody><tr><th>Plan</th><th>Status</th></tr><tr><td>Basic</td><td>Available</td></tr></tbody></table>
    <h2>Example</h2><pre><code class="language-javascript">const ${id.replace(/[^a-z0-9]/gi, '_')} = true;</code></pre>
    <h2>Guidelines</h2><ul><li>Keep the label visible.</li></ul>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${id} | Storybook</title><link rel="stylesheet" href="/storybook/assets/site.css"><script type="module" src="/storybook/assets/ui.mjs"></script><style>:root{--color-primary:#123456}.sbdocs-wrapper{font:16px Arial;color:#222}</style></head><body>
    <main class="sbdocs-wrapper"${busy}>${initial}</main>
    <script>setTimeout(()=>{const root=document.querySelector('.sbdocs-wrapper');root.removeAttribute('aria-busy');root.innerHTML=${JSON.stringify(content)}},${delayed ? 900 : 0})</script>
    </body></html>`;
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  if (url.pathname === '/storybook') {
    response.writeHead(302, { location: '/storybook/' }).end();
    return;
  }
  if (url.pathname === '/storybook/index.json') {
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ v: 5, entries: Object.fromEntries(docs.map((entry) => [entry.id, entry])) }));
    return;
  }
  if (url.pathname === '/storybook/assets/site.css') { response.writeHead(200, { 'content-type': 'text/css' }).end('@import "./nested.css"; @font-face{font-family:Fixture;src:url("./fixture.woff2")} .sbdocs-wrapper{background-image:url("./hero.png")}'); return; }
  if (url.pathname === '/storybook/assets/nested.css') { response.writeHead(200, { 'content-type': 'text/css' }).end('.sbdocs-wrapper h1{font-family:Fixture,Arial}'); return; }
  if (url.pathname === '/storybook/assets/fixture.woff2') { response.writeHead(200, { 'content-type': 'font/woff2' }).end(Buffer.from([0, 1, 2, 3, 255, 128])); return; }
  if (url.pathname === '/storybook/assets/hero.png') { response.writeHead(200, { 'content-type': 'image/png' }).end(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 255])); return; }
  if (url.pathname === '/storybook/assets/icon.svg') { response.writeHead(200, { 'content-type': 'image/svg+xml' }).end('<svg xmlns="http://www.w3.org/2000/svg"><path id="check" d="M0 0h4v4H0z"/></svg>'); return; }
  if (url.pathname === '/storybook/assets/ui.mjs') { response.writeHead(200, { 'content-type': 'text/javascript' }).end('import "./chunk.js"; import(runtimeChunk); document.addEventListener("click",async event=>{if(event.target.closest("[data-load-api-example]")){const result=await fetch("/storybook/api/example");event.target.parentElement.querySelector("output").textContent=(await result.json()).message}});'); return; }
  if (url.pathname === '/storybook/assets/chunk.js') { response.writeHead(200, { 'content-type': 'text/javascript' }).end('export const fixture = true;'); return; }
  if (url.pathname === '/storybook/api/example') { response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ message: 'Runtime API data is available only from the fixture server.' })); return; }
  if (url.pathname === '/storybook/assets/missing.png') { response.writeHead(404, { 'content-type': 'text/plain' }).end('missing'); return; }
  if (url.pathname !== '/storybook/') {
    response.writeHead(404).end('Not found');
    return;
  }
  const id = (url.searchParams.get('path') || '').replace(/^\/docs\//, '');
  if (!docs.some((entry) => entry.id === id)) {
    response.writeHead(404, { 'content-type': 'text/html' }).end('<main>Unknown Docs ID</main>');
    return;
  }
  if (id === 'retry--docs') {
    const count = retryRequests.get(id) || 0;
    retryRequests.set(id, count + 1);
    if (count === 0) {
      response.writeHead(200, { 'content-type': 'text/html' }).end('<!doctype html><main>Temporary Docs render failure</main>');
      return;
    }
  }
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(page(id));
});

server.listen(port, '127.0.0.1', () => console.log(`Storybook fixture listening at http://127.0.0.1:${port}/storybook/`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
