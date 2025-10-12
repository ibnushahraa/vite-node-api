// Example with custom options
import { defineConfig } from 'vite'
import viteNodeApi from 'vite-node-api'

export default defineConfig({
  plugins: [
    viteNodeApi({
      apiDir: 'server/api',
      port: 4173,
      bodyLimit: 5000000, // 5MB
      timeout: 60000, // 60 seconds
      cors: true
    })
  ]
})
