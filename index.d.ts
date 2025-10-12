import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "http";

export interface CorsOptions {
  /**
   * CORS origin
   * @default "*"
   */
  origin?: string;
}

export interface ViteNodeApiOptions {
  /**
   * Directory containing API route files
   * @default "server/api"
   */
  apiDir?: string;

  /**
   * Port for production runtime
   * @default 4173
   */
  port?: number;

  /**
   * Maximum request body size in bytes
   * @default 1000000 (1MB)
   */
  bodyLimit?: number;

  /**
   * Request timeout in milliseconds
   * @default 30000 (30s)
   */
  timeout?: number;

  /**
   * Enable CORS headers
   * - `true`: Enable with default origin "*"
   * - `object`: Configure CORS with custom options
   */
  cors?: boolean | CorsOptions;
}

export interface ApiRequest extends IncomingMessage {
  /**
   * Parsed JSON request body (for POST, PUT, PATCH)
   */
  body?: any;

  /**
   * Parsed query parameters from URL
   */
  query?: Record<string, string>;

  /**
   * Dynamic route parameters (e.g., /api/users/[id] → params.id)
   */
  params?: Record<string, string>;
}

export type ApiResponse = ServerResponse;

/**
 * API route handler function
 */
export type ApiHandler = (
  req: ApiRequest,
  res: ApiResponse
) => Promise<any> | any;

/**
 * Vite plugin for Node.js API routes with JSON-only, single-port backend and frontend.
 *
 * @param options - Plugin configuration options
 * @returns Vite plugin object
 *
 * @example
 * ```typescript
 * import { defineConfig } from 'vite'
 * import viteNodeApi from 'vite-node-api'
 *
 * export default defineConfig({
 *   plugins: [
 *     viteNodeApi({
 *       apiDir: 'server/api',
 *       port: 3000,
 *       cors: true
 *     })
 *   ]
 * })
 * ```
 */
export default function viteNodeApi(options?: ViteNodeApiOptions): Plugin;
