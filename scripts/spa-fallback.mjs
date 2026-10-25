// GitHub Pages has no server-side rewrite, so a deep link such as
// /demo-layout/offer-types/12 would 404 before the app ever loads.
// Serving the same HTML as 404.html makes Pages hand every unknown path
// to the SPA router instead. This demo is about URL-addressable overlays,
// so deep links have to work.
import { copyFile } from 'node:fs/promises';

await copyFile('dist/index.html', 'dist/404.html');
console.log('wrote dist/404.html');
