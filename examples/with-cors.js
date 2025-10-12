// Example with CORS enabled
import { defineConfig } from 'vite'
import viteNodeApi from 'vite-node-api'

export default defineConfig({
  plugins: [
    viteNodeApi({
      apiDir: 'server/api',
      port: 3000,
      cors: {
        origin: 'https://example.com'
      }
    })
  ]
})
