import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

const APP_VERSION = '1.0.0';
const BUILD_ID = new Date().toISOString();

function skiOtaManifestPlugin(): Plugin {
  return {
    name: 'ski-ota-manifest',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      if (!fs.existsSync(distDir)) return;

      const manifest = {
        version: APP_VERSION,
        buildId: BUILD_ID,
        builtAt: BUILD_ID,
        otaEnabled: true,
      };
      fs.writeFileSync(
        path.join(distDir, 'version.json'),
        JSON.stringify(manifest, null, 2),
        'utf-8'
      );

      const distSwPath = path.join(distDir, 'sw.js');
      if (fs.existsSync(distSwPath)) {
        const swContent = fs.readFileSync(distSwPath, 'utf-8');
        const stampedSw = swContent.replace(/__KC_SW_BUILD_ID__/g, BUILD_ID);
        fs.writeFileSync(distSwPath, stampedSw, 'utf-8');
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    define: {
      __KC_BUILD_ID__: JSON.stringify(BUILD_ID),
      __KC_APP_VERSION__: JSON.stringify(APP_VERSION),
    },
    plugins: [react(), tailwindcss(), skiOtaManifestPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
