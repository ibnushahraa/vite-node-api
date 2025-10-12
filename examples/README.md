# vite-node-api Examples

This folder contains examples of how to use `vite-node-api` in your Vite projects.

## Configuration Examples

- **basic.js** - Basic configuration example
- **with-cors.js** - Configuration with CORS enabled
- **custom-options.js** - Configuration with custom options (body limit, timeout, etc.)

## API Route Examples

The `api-routes/` folder contains example API route handlers:

- **hello.js** - Simple GET endpoint that returns a greeting
- **users.js** - GET endpoint with query parameter support
- **create-user.js** - POST endpoint with request body validation

## How to Use

### 1. Setup Your Project

```bash
npm install vite vite-node-api
```

### 2. Configure Vite

Copy one of the configuration examples to your `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import viteNodeApi from 'vite-node-api'

export default defineConfig({
  plugins: [
    viteNodeApi({
      apiDir: 'server/api',
      port: 3000,
      cors: true
    })
  ]
})
```

### 3. Create API Routes

Create your API route files in `server/api/` directory:

```javascript
// server/api/hello.js
export default function handler(req, res) {
  return {
    message: 'Hello World!'
  }
}
```

### 4. Run Your Project

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production
npm run preview
```

### 5. Access Your API

Your API routes will be available at:
- Development: `http://localhost:5173/api/hello`
- Production: `http://localhost:3000/api/hello`

## API Route Structure

Each API route file should export a default function that receives `req` and `res` objects:

```javascript
export default function handler(req, res) {
  // Access query parameters
  const { id } = req.query

  // Access request body (POST/PUT/PATCH)
  const { name } = req.body

  // Set custom status code
  res.statusCode = 201

  // Return JSON response
  return {
    success: true,
    data: { id, name }
  }
}
```

## Available Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiDir` | string | `"server/api"` | Directory containing API route files |
| `port` | number | `4173` | Port for production runtime |
| `bodyLimit` | number | `1000000` | Maximum request body size (bytes) |
| `timeout` | number | `30000` | Request timeout (milliseconds) |
| `cors` | boolean \| object | `false` | Enable CORS headers |

## Request Object Properties

- `req.method` - HTTP method (GET, POST, PUT, PATCH, DELETE)
- `req.url` - Full request URL
- `req.query` - Parsed query parameters
- `req.body` - Parsed JSON body (POST/PUT/PATCH only)
- `req.headers` - Request headers

## Response Object Methods

- `res.statusCode` - Set HTTP status code
- `res.setHeader(name, value)` - Set response header
- `res.end(data)` - End response manually
- `res.writableEnded` - Check if response has ended
