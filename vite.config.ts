import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// Served from a GitHub Pages subpath (https://<user>.github.io/<repo>/).
// Override with VITE_BASE=/ for a root-hosted deploy or local preview.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/demo-layout/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  }
});
