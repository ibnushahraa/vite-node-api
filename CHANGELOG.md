# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0-beta] - 2025-01-12

### Added
- Initial beta release
- File-based API routing (`/api/hello.js` → `/api/hello`)
- **Dynamic route parameters** (`/api/users/[id].js` → `req.params.id`)
- Single-port deployment for development and production
- JSON-only request/response handling
- Hot module reload in development mode
- Security features:
  - Path traversal protection
  - Request body size limits (1MB default)
  - Request timeout (30s default)
- CORS support
- Production build with esbuild (minification + bundling)
- Route caching for optimal performance
- TypeScript definitions with full type safety
- Test suite with Jest (16 tests)
- JSDoc documentation

### Plugin Options
- `apiDir` - API directory (default: `server/api`)
- `port` - Production port (default: `4173`)
- `bodyLimit` - Max body size (default: `1000000` bytes)
- `timeout` - Request timeout (default: `30000` ms)
- `cors` - CORS config (default: `false`)
