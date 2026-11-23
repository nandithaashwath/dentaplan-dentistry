import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'copy-unbundled-src-assets',
    apply: 'build',
    closeBundle() {
      const distDir = path.resolve(rootDir, 'dist');
      const srcAssets = path.resolve(rootDir, 'src/assets');
      if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
        fs.cpSync(srcAssets, path.resolve(distDir, 'src/assets'), { recursive: true, force: true });
      }
    },
  }],
  resolve: { alias: { '@': rootDir } },
  server: { hmr: process.env.DISABLE_HMR !== 'true', watch: process.env.DISABLE_HMR === 'true' ? null : {} },
});
