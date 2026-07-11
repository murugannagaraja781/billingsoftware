import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Custom plugin to inject built assets into service worker precache
const injectSWAssets = () => {
  return {
    name: 'inject-sw-assets',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist')
      const swFile = path.resolve(distDir, 'sw.js')
      
      if (!fs.existsSync(swFile)) {
        console.warn('sw.js not found in dist, skipping asset injection');
        return;
      }

      // Read assets in dist/assets
      const assetsDir = path.resolve(distDir, 'assets')
      let assetFiles = []
      if (fs.existsSync(assetsDir)) {
        assetFiles = fs.readdirSync(assetsDir)
          .map(file => `/assets/${file}`)
      }

      // Read sw.js content
      let swContent = fs.readFileSync(swFile, 'utf8')

      // Replace PRECACHE_URLS placeholder or add them
      const precacheArray = [
        '/',
        '/index.html',
        '/logo.png',
        '/manifest.json',
        ...assetFiles
      ]

      swContent = swContent.replace(
        /const PRECACHE_URLS = \[[\s\S]*?\];/,
        `const PRECACHE_URLS = ${JSON.stringify(precacheArray, null, 2)};`
      )

      fs.writeFileSync(swFile, swContent, 'utf8')
      console.log('Successfully injected built assets into sw.js precache list:', assetFiles);
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), injectSWAssets()],
})
