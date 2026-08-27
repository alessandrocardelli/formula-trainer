import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const computeEngineEsmUrl = import.meta.resolve('@cortex-js/compute-engine')
const computeEngineUmdPath = fileURLToPath(
  new URL('../umd-min/compute-engine.cjs', computeEngineEsmUrl),
)
const computeEngineRuntime = readFileSync(computeEngineUmdPath, 'utf8')

function vendoredComputeEngine(): Plugin {
  const publicPath = '/formula-trainer/vendor/compute-engine.js'

  return {
    name: 'vendored-compute-engine',
    configureServer(server) {
      server.middlewares.use(publicPath, (_request, response) => {
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/javascript; charset=utf-8')
        response.end(computeEngineRuntime)
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'vendor/compute-engine.js',
        source: computeEngineRuntime,
      })
    },
  }
}

export default defineConfig({
  base: '/formula-trainer/',
  plugins: [
    vendoredComputeEngine(),
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
      manifest: {
        name: 'Formula Trainer',
        short_name: 'Formula Trainer',
        description:
          'Learn, recall, manipulate and apply mathematical formulas through active practice and spaced repetition.',
        theme_color: '#111827',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/formula-trainer/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
