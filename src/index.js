import path from "path";
import fs from "fs";
import url from "url";
import buildBackend from "./builder.js";
import fastJson from "fast-json-stringify";
import fastJsonParse from "fast-json-parse";

/**
 * @typedef {Object} CorsOptions
 * @property {string} [origin] - CORS origin (default: "*")
 */

/**
 * @typedef {Object} ViteNodeApiOptions
 * @property {string} [apiDir="server/api"] - Directory containing API route files
 * @property {number} [port=4173] - Port for production runtime
 * @property {number} [bodyLimit=1000000] - Maximum request body size in bytes (default: 1MB)
 * @property {number} [timeout=30000] - Request timeout in milliseconds (default: 30s)
 * @property {boolean|CorsOptions} [cors] - Enable CORS headers
 */

/**
 * Vite plugin for Node.js API routes with JSON-only, single-port backend and frontend.
 *
 * @param {ViteNodeApiOptions} [options={}] - Plugin configuration options
 * @returns {import('vite').Plugin} Vite plugin object
 *
 * @example
 * // vite.config.js
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
 */
export default function viteNodeApi(options = {}) {
  const apiDir = path.resolve(options.apiDir || "server/api");
  const port = options.port || process.env.PORT || 4173;
  const bodyLimit = options.bodyLimit || 1_000_000;
  const timeout = options.timeout || 30000;

  // Create fast-json-stringify instances for common error responses
  const errorStringify = fastJson({
    type: "object",
    properties: {
      error: { type: "string" }
    }
  });

  // Generic stringify for any object (fallback)
  const genericStringify = fastJson({
    type: "object",
    additionalProperties: true
  });

  /**
   * Middleware handler for API routes
   * @param {import('http').IncomingMessage} req - HTTP request
   * @param {import('http').ServerResponse} res - HTTP response
   * @param {Function} next - Next middleware function
   */
  async function handler(req, res, next) {
    if (!req.url.startsWith("/api")) return next();

    if (options.cors) {
      const corsOpt =
        typeof options.cors === "object" ? options.cors : { origin: "*" };
      res.setHeader("Access-Control-Allow-Origin", corsOpt.origin || "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS"
      );
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }
    }

    req.setTimeout(timeout, () => {
      if (!res.writableEnded) {
        res.statusCode = 408;
        res.setHeader("Content-Type", "application/json");
        res.end(errorStringify({ error: "Request timeout" }));
      }
    });

    const fullUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = decodeURIComponent(fullUrl.pathname);
    const apiPath = pathname.replace(/^\/api/, "");
    const filePath = path.resolve(apiDir, "." + apiPath + ".js");

    const safePath = path.normalize(filePath);
    if (!safePath.startsWith(apiDir)) {
      res.statusCode = 403;
      res.setHeader("Content-Type", "application/json");
      res.end(errorStringify({ error: "Forbidden path" }));
      return;
    }

    if (!fs.existsSync(safePath)) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(errorStringify({ error: "API route not found" }));
      return;
    }

    try {
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        const chunks = [];
        let total = 0;
        for await (const c of req) {
          total += c.length;
          if (total > bodyLimit) {
            res.statusCode = 413;
            res.setHeader("Content-Type", "application/json");
            res.end(errorStringify({ error: "Request body too large" }));
            return;
          }
          chunks.push(c);
        }

        const bodyStr = Buffer.concat(chunks).toString() || "{}";
        const parsed = fastJsonParse(bodyStr);

        if (parsed.err) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(errorStringify({ error: "Invalid JSON body" }));
          return;
        }

        req.body = parsed.value;
      }

      req.query = Object.fromEntries(fullUrl.searchParams.entries());

      // Convert Windows path to file:// URL for ESM import
      const fileUrl = url.pathToFileURL(safePath).href;
      const mod = await import(fileUrl + "?t=" + Date.now());
      const fn = mod.default || mod;
      const result = await fn(req, res);

      if (!res.writableEnded) {
        res.setHeader("Content-Type", "application/json");
        // Use generic stringify for response (handles any object structure)
        try {
          res.end(genericStringify(result ?? {}));
        } catch {
          // Fallback to regular JSON.stringify if schema mismatch
          res.end(JSON.stringify(result ?? {}));
        }
      }
    } catch (err) {
      if (!res.writableEnded) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(errorStringify({ error: err.message }));
      }
    }
  }

  return {
    name: "vite-node-api",

    config(config) {
      // Auto-set build.outDir to dist/client for proper structure
      return {
        build: {
          outDir: config.build?.outDir || 'dist/client'
        }
      };
    },

    configureServer(server) {
      server.middlewares.use(handler);
      console.log(`✅ vite-node-api: /api/* routes ready on Vite dev server`);
    },

    async closeBundle() {
      process.env.VITE_NODE_API_PORT = port;
      process.env.VITE_NODE_API_TIMEOUT = timeout;
      process.env.NODE_ENV = process.env.NODE_ENV || "production";
      await buildBackend(apiDir);
    },
  };
}
