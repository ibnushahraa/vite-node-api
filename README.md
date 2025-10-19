# vite-node-api

[![npm version](https://img.shields.io/npm/v/vite-node-api.svg?style=flat-square)](https://www.npmjs.com/package/vite-node-api)
[![npm downloads](https://img.shields.io/npm/dm/vite-node-api.svg?style=flat-square)](https://www.npmjs.com/package/vite-node-api)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![CI](https://github.com/ibnushahraa/vite-node-api/actions/workflows/test.yml/badge.svg)](https://github.com/ibnushahraa/vite-node-api/actions)
[![coverage](https://img.shields.io/badge/coverage-94%25-brightgreen.svg?style=flat-square)](https://github.com/ibnushahraa/vite-node-api)

🚀 A **Vite plugin** for adding **Node.js API routes** to your Vite + Vue project. **JSON-only**, **single-port** backend and frontend, similar to Next.js API routes but for Vite.

---

## ✨ Features

- **File-based routing** - `/api/hello.js` → `/api/hello`
- **Single-port deployment** - Dev and production on one port
- **JSON-only API** - Auto-parse request body and query params
- **Hot reload** - API changes auto-reload in dev mode
- **Security built-in** - Path traversal protection, body limits, timeouts
- **CORS support** - Optional CORS headers configuration
- **Production-ready** - ESBuild bundling with minification
- **TypeScript support** - Full TypeScript definitions included
- **Zero config** - Works out of the box with sensible defaults

---

## 📦 Installation

```bash
npm install vite-node-api
```

---

## 🚀 Quick Start

### 1. Configure Vite

```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import viteNodeApi from 'vite-node-api'

export default defineConfig({
  plugins: [
    vue(),
    viteNodeApi({
      apiDir: 'server/api',  // optional, default: 'server/api'
      port: 4173,            // optional, default: 4173
      cors: true             // optional, default: false
    })
  ]
})
```

### 2. Create API Route

```js
// server/api/hello.js
export default async (req, res) => {
  return {
    message: 'Hello from API!',
    method: req.method,
    query: req.query
  }
}
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173/api/hello` → `{"message":"Hello from API!","method":"GET","query":{}}`

### 4. Build for Production

```bash
npm run build
```

This creates:
- `dist/client/` - Frontend files
- `dist/server/` - Bundled API routes + runtime

### 5. Deploy to Production

#### **Build for Production**

```bash
npm run build
```

This creates:
```
dist/
├── client/           # Frontend static files (HTML, CSS, JS)
├── server/           # Backend bundled files
│   ├── entry.mjs    # Production runtime (standalone)
│   └── server/      # API routes (preserves folder structure)
│       └── api/
└── .env             # Auto-copied from .env.production
```

**Key Features:**
- ✅ **Standalone** - All dependencies bundled, no `node_modules` needed
- ✅ **Environment variables** - `.env.production` auto-copied to `dist/.env`
- ✅ **Folder structure preserved** - `server/api/` stays as `dist/server/server/api/`

#### **Run Production Server**

```bash
# Simple - just run the entry file
node dist/server/entry.mjs
```

**OR with custom environment variables:**

```bash
# Override .env values
PORT=3000 node dist/server/entry.mjs
```

Both frontend and API run on the same port (default: `4173`).

#### **Deploy to Server**

Upload only the `dist/` folder:

```bash
# 1. Build locally
npm run build

# 2. Upload dist/ to your server
scp -r dist/ user@server:/var/www/myapp/

# 3. On server, run it
ssh user@server
cd /var/www/myapp/dist
node server/entry.mjs
```

**No `npm install` needed** - everything is bundled!

---

## 📖 Usage Examples

### Dynamic Route Parameters

```js
// server/api/users/[id].js
export default async (req, res) => {
  const { id } = req.params

  const user = { id, name: 'Alice', email: 'alice@example.com' }

  return user
}
```

**Request:** `GET /api/users/123`

**Response:** `{"id":"123","name":"Alice","email":"alice@example.com"}`

### Query Parameters

```js
// server/api/search.js
export default async (req, res) => {
  const { q, limit = 10 } = req.query

  return {
    query: q,
    limit: parseInt(limit),
    results: []
  }
}
```

**Request:** `GET /api/search?q=hello&limit=5`

**Response:** `{"query":"hello","limit":5,"results":[]}`

### POST Request with JSON Body

```js
// server/api/users/create.js
export default async (req, res) => {
  const { name, email } = req.body

  // Validate input
  if (!name || !email) {
    res.statusCode = 400
    return { error: 'Name and email required' }
  }

  // Simulate database insert
  const newUser = {
    id: Date.now(),
    name,
    email,
    createdAt: new Date().toISOString()
  }

  return newUser
}
```

**Request:**
```bash
curl -X POST http://localhost:5173/api/users/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@example.com"}'
```

**Response:** `{"id":1704067200000,"name":"Bob","email":"bob@example.com","createdAt":"2025-01-01T00:00:00.000Z"}`

### Nested Routes

```
server/api/
├── hello.js              → /api/hello
├── users/
│   ├── list.js           → /api/users/list
│   ├── create.js         → /api/users/create
│   └── [id].js           → /api/users/[id]
└── posts/
    ├── index.js          → /api/posts/index
    └── [slug].js         → /api/posts/[slug]
```

### Manual Response Control

```js
// server/api/custom.js
export default async (req, res) => {
  // Set custom headers
  res.setHeader('X-Custom-Header', 'value')

  // Set status code
  res.statusCode = 201

  // Manual response (won't auto-JSON encode)
  res.setHeader('Content-Type', 'text/plain')
  res.end('Custom response')

  // No return needed when manually writing response
}
```

### Async Operations

```js
// server/api/posts/list.js
export default async (req, res) => {
  // Simulate async database query
  await new Promise(resolve => setTimeout(resolve, 100))

  const posts = [
    { id: 1, title: 'First Post' },
    { id: 2, title: 'Second Post' }
  ]

  return posts
}
```

---

## ⚙️ Configuration

### Plugin Options

```js
viteNodeApi({
  // Directory containing API route files
  // Default: 'server/api'
  apiDir: 'server/api',

  // Port for production runtime
  // Default: 4173 (Vite preview default)
  port: 3000,

  // Maximum request body size in bytes
  // Default: 1000000 (1MB)
  bodyLimit: 5_000_000,

  // Request timeout in milliseconds
  // Default: 30000 (30s)
  timeout: 60000,

  // Enable CORS headers
  // Default: false
  cors: true,

  // Or configure CORS with custom origin
  cors: {
    origin: 'https://example.com'
  }
})
```

### Environment Variables

vite-node-api automatically handles environment variables for both development and production:

**Development (.env.development):**
```bash
# Loaded by Vite dev server
VITE_APP_API_KEY=dev-key-123
DATABASE_URL=postgresql://localhost/mydb
```

**Production (.env.production):**
```bash
# Auto-copied to dist/.env during build
VITE_APP_API_KEY=prod-key-456
DATABASE_URL=postgresql://production/mydb
```

**Using in API routes:**
```js
// server/api/data.js
export default async (req, res) => {
  const apiKey = process.env.VITE_APP_API_KEY
  const dbUrl = process.env.DATABASE_URL

  // Your logic here
  return { status: 'ok' }
}
```

**Key Points:**
- ✅ Development: Vite automatically loads `.env.development`
- ✅ Production: `.env.production` is auto-copied to `dist/.env` during build
- ✅ Runtime: Production server auto-loads `dist/.env` on startup
- ✅ Override: Can override env vars when running: `PORT=3000 node dist/server/entry.mjs`

### Request Object

API route handlers receive an enhanced request object:

```typescript
{
  method: string                // HTTP method: GET, POST, PUT, PATCH, DELETE
  url: string                   // Full request URL
  headers: IncomingHttpHeaders
  body?: any                    // Parsed JSON body (POST/PUT/PATCH only)
  query: Record<string, string> // Parsed query parameters (?key=value)
  params: Record<string, string> // Dynamic route parameters ([id])
  // ... all standard Node.js IncomingMessage properties
}
```

### Response Object

Standard Node.js `ServerResponse` with helper methods:

```js
export default async (req, res) => {
  // Set status code
  res.statusCode = 404

  // Set headers
  res.setHeader('Content-Type', 'application/json')

  // Return data (auto-JSON encoded)
  return { error: 'Not found' }

  // Or manually send response
  res.end(JSON.stringify({ error: 'Not found' }))
}
```

---

## 🔒 Security

### Path Traversal Protection

Built-in protection against path traversal attacks:

```
✅ /api/users/list      → server/api/users/list.js
❌ /api/../../../etc/passwd  → 403 Forbidden
```

### Body Size Limits

Default 1MB limit for request bodies (configurable):

```js
viteNodeApi({
  bodyLimit: 5_000_000  // 5MB
})
```

Requests exceeding the limit return `413 Request Entity Too Large`.

### Request Timeouts

Default 30s timeout per request (configurable):

```js
viteNodeApi({
  timeout: 60000  // 60s
})
```

Requests exceeding the timeout return `408 Request Timeout`.

### CORS Configuration

```js
// Simple CORS (allow all origins)
viteNodeApi({
  cors: true
})

// Custom origin
viteNodeApi({
  cors: {
    origin: 'https://example.com'
  }
})
```

---

## 🏗️ Project Structure

```
my-vite-app/
├── src/
│   ├── main.js         # Frontend entry
│   └── App.vue
├── server/
│   └── api/
│       ├── hello.js    # API routes
│       ├── users/
│       │   └── list.js
│       └── posts/
│           └── [id].js
├── vite.config.js      # Vite config with plugin
└── package.json
```

After build:

```
dist/
├── client/             # Frontend files (served by entry.mjs)
│   ├── index.html
│   ├── assets/
│   └── ...
└── server/             # Backend files
    ├── entry.mjs       # Production runtime server
    └── api/            # Bundled API routes
        ├── hello.js
        └── users/
            └── list.js
```

---

## 🚀 Deployment

### Node.js

```bash
# Build
npm run build

# Run production server
node dist/server/entry.mjs
```

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY dist ./dist

EXPOSE 4173

CMD ["node", "dist/server/entry.mjs"]
```

### Environment Variables

```bash
# Override port
PORT=3000 node dist/server/entry.mjs

# Or use plugin config env variable
VITE_NODE_API_PORT=3000 node dist/server/entry.mjs

# Override timeout
VITE_NODE_API_TIMEOUT=60000 node dist/server/entry.mjs
```

### Process Managers

**PM2:**
```bash
pm2 start dist/server/entry.mjs --name my-api
```

**Systemd:**
```ini
[Unit]
Description=Vite Node API Server

[Service]
ExecStart=/usr/bin/node /path/to/dist/server/entry.mjs
Restart=always
Environment=PORT=4173

[Install]
WantedBy=multi-user.target
```

---

## 🧪 Testing

```bash
npm test
```

Test coverage includes:
- Plugin configuration
- API routing
- Security (path traversal, body limits)
- Build process
- Error handling

See `test/` directory for examples.

---

## ⚡ Performance

Run benchmarks with [autocannon](https://github.com/mcollina/autocannon):

```bash
npm run bench
```

### Benchmark Results

Performance with **fast-json-stringify** and **fast-json-parse** optimization (100 concurrent connections, 10s duration):

| Endpoint | Req/sec | Latency | Throughput |
|----------|---------|---------|------------|
| Simple GET | **3,331** | **29.53ms** | ~720 KB/s |
| GET with Query | 2,281 | 43.20ms | ~500 KB/s |
| Complex JSON | 2,965 | 33.25ms | ~1.0 MB/s |
| POST with Body | **2,146** | **46.07ms** | ~480 KB/s |

**Key optimizations:**
- ⚡ **+17% faster** on simple GET requests
- ⚡ **+7% faster** on POST with JSON body parsing
- 🚀 Pre-compiled JSON schemas for error responses
- 📦 Smart fallback to native JSON for complex objects

> Results may vary based on hardware and system load. Run `npm run bench` on your system for accurate measurements.

See `benchmark/` directory for more details.

---

## 📂 API Reference

### Handler Function

```typescript
type ApiHandler = (
  req: ApiRequest,
  res: ApiResponse
) => Promise<any> | any
```

Return value is automatically JSON-encoded. If you manually send a response, don't return anything.

### Error Handling

Errors are automatically caught and returned as JSON:

```js
export default async (req, res) => {
  throw new Error('Something went wrong')
  // Returns: {"error":"Something went wrong"}
  // Status: 500
}
```

### Status Codes

```js
// Success
res.statusCode = 200  // OK (default)
res.statusCode = 201  // Created
res.statusCode = 204  // No Content

// Client Errors
res.statusCode = 400  // Bad Request
res.statusCode = 401  // Unauthorized
res.statusCode = 403  // Forbidden
res.statusCode = 404  // Not Found

// Server Errors
res.statusCode = 500  // Internal Server Error
```

---

## 📚 Examples

For more detailed examples and use cases, please check the [examples](./examples) folder:

- Configuration examples (basic, CORS, custom options)
- API route examples (GET, POST, query parameters, validation)
- Complete documentation and usage guides

---

## 📄 License

[MIT](LICENSE) © 2025
