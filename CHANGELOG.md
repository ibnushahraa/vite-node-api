# Changelog

All notable changes to this project will be documented in this file.

## [1.0.2-beta] - 2025-10-19

### Added
- **Standalone production builds** - All dependencies now bundled, no `node_modules` required
- **Auto environment variable handling** - `.env.production` auto-copied to `dist/.env` during build
- **Auto-load .env in production** - Runtime automatically loads environment variables from `dist/.env`
- **Auto-configure build output** - Plugin sets `build.outDir` to `dist/client` automatically

### Fixed
- **Windows ESM import support** - Fixed `protocol 'd:'` error with `url.pathToFileURL()` conversion
- **CommonJS compatibility** - Added `require` polyfill via esbuild banner for mixed CommonJS/ESM packages
- **Folder structure preservation** - API routes now preserve folder structure in production build (`server/api/` → `dist/server/server/api/`)
- **Console log clarity** - Improved dev server message: "routes ready on Vite dev server" instead of confusing port numbers

### Changed
- **Production deployment simplified** - Upload only `dist/` folder, no installation needed
- **Build process** - Uses esbuild `outbase` to preserve source folder structure
- **Dependencies** - All dependencies (including user dependencies) are now bundled in production

### Breaking Changes
- None - fully backward compatible

## [1.0.1-beta] - 2025-10-19

### Security
- **Updated esbuild to v0.25.11** - Fixes GHSA-67mh-4wv8-2f99 (moderate severity)
- Prevents unauthorized requests to development server

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
