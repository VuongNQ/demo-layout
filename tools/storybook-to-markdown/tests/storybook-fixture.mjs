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
  const content = `<h1>${id}</h1><p>Rendered documentation for ${id}.</p>
    <h2>Props</h2><table class="docblock-argstable"><tbody><tr><th>Name</th><th>Type</th><th>Default</th></tr><tr><td>size</td><td>string</td><td>medium</td></tr></tbody></table>
    <h2>Rendered table</h2><table><tbody><tr><th>Plan</th><th>Status</th></tr><tr><td>Basic</td><td>Available</td></tr></tbody></table>
    <h2>Example</h2><pre><code class="language-javascript">const ${id.replace(/[^a-z0-9]/gi, '_')} = true;</code></pre>
    <h2>Guidelines</h2><ul><li>Keep the label visible.</li></ul>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${id} | Storybook</title><style>:root{--color-primary:#123456}.sbdocs-wrapper{font:16px Arial;color:#222}</style></head><body>
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
