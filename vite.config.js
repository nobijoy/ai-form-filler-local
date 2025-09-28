import { defineConfig } from 'vite';
import { resolve } from 'path';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig({
  plugins: [
    webExtension({
      // Explicitly point to the manifest.json in the project root
      manifest: resolve(__dirname, 'manifest.json'),
      rollupOptions: {
        input: {
          'popup': resolve(__dirname, 'src/popup.html'),
          'background': resolve(__dirname, 'src/background.js'),
          'content': resolve(__dirname, 'src/content.js'),
        },
        output: {
          entryFileNames: 'src/[name].js',
          chunkFileNames: 'src/chunks/[name].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'popup.css') {
              return 'src/popup.css';
            }
            if (assetInfo.name === 'popup.html') {
              return 'src/popup.html';
            }
            
            return 'assets/[name].[ext]';
          },
        },
      },
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    mime: {
      '.wasm': 'application/wasm'
    }
  }
});
