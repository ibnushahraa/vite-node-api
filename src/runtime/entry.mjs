/**
 * Production runtime server for vite-node-api
 * Serves both API routes and static frontend files on a single port.
 * Supports dynamic routes (e.g. /api/user/[id].js → req.params.id)
 * @module runtime/entry
 */

import http from "http";
import fs from "fs";
import path from "path";
import url from "url";
import mime from "mime-types";
import fg from "fast-glob";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Load .env file if exists
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...values] = trimmed.split("=");
      if (key) {
        process.env[key.trim()] = values.join("=").trim();
      }
    }
  });
  console.log("✅ Loaded environment variables from .env");
}

const PORT = process.env.VITE_NODE_API_PORT || process.env.PORT || 4173;
const TIMEOUT = parseInt(process.env.VITE_NODE_API_TIMEOUT) || 30_000;

const clientDir = path.join(__dirname, "../client");
const apiDir = path.join(__dirname, "./api");

if (!fs.existsSync(clientDir)) {
  console.warn("⚠️ dist/client not found. Running in API-only mode.");
}

let routeCache = null;

/**
 * Build and cache dynamic route patterns
 * @returns {Promise<Array>} Array of route patterns with regex and param names
 */
async function getRouteCache() {
  if (!routeCache) {
    const files = await fg("**/*.js", { cwd: apiDir, absolute: true });
    routeCache = files.map((f) => {
      const rel = path.relative(apiDir, f).replace(/\\/g, "/");
      const pattern = rel.replace(/\[([^\]]+)\]/g, "([^/]+)");
      const regex = new RegExp("^" + pattern.replace(/\.js$/, "") + "$");
      const names = [...rel.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
      return { file: f, regex, names };
    });
  }
  return routeCache;
}

/**
 * Get MIME type for a file
 * @param {string} f - File path
 * @returns {string} MIME type
 */
const getMime = (f) => mime.lookup(f) || "application/octet-stream";

/**
 * Parse JSON request body with size limit
 * @param {import('http').IncomingMessage} req
 * @param {number} [limit=1000000]
 * @returns {Promise<Object>}
 */
async function parseBody(req, limit = 1_000_000) {
  const chunks = [];
  let total = 0;
  for await (const c of req) {
    total += c.length;
    if (total > limit) throw new Error("Request body too large");
    chunks.push(c);
  }
  return chunks.length
    ? JSON.parse(Buffer.concat(chunks).toString() || "{}")
    : {};
}

const server = http.createServer(async (req, res) => {
  try {
    req.setTimeout(TIMEOUT, () => {
      if (!res.writableEnded) {
        res.writeHead(408, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Request timeout" }));
      }
    });

    const fullUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = decodeURIComponent(fullUrl.pathname);

    if (pathname.startsWith("/api/")) {
      const apiPath = pathname.replace(/^\/api/, "");
      let filePath = path.resolve(apiDir, "." + apiPath + ".js");
      let params = {};

      if (!fs.existsSync(filePath)) {
        const routes = await getRouteCache();
        for (const route of routes) {
          const match = apiPath.match(route.regex);
          if (match) {
            filePath = route.file;
            route.names.forEach((n, i) => (params[n] = match[i + 1]));
            break;
          }
        }
      }

      const safePath = path.normalize(filePath);
      if (!safePath.startsWith(apiDir)) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Forbidden path" }));
        return;
      }

      if (!fs.existsSync(safePath)) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "API route not found" }));
        return;
      }

      try {
        if (["POST", "PUT", "PATCH"].includes(req.method))
          req.body = await parseBody(req);

        req.query = Object.fromEntries(fullUrl.searchParams.entries());
        req.params = params;

        // Convert Windows path to file:// URL for ESM import
        const fileUrl = url.pathToFileURL(safePath).href;
        const mod = await import(fileUrl);
        const fn = mod.default || mod;
        const result = await fn(req, res);

        if (!res.writableEnded) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(result ?? {}));
        }
      } catch (err) {
        res.writeHead(err.message.includes("too large") ? 413 : 500, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (!fs.existsSync(clientDir)) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    let file = path.join(clientDir, pathname);
    if (pathname === "/" || !fs.existsSync(file))
      file = path.join(clientDir, "index.html");

    const resolved = path.resolve(file);
    const safeClientPath = path.normalize(resolved);
    if (!safeClientPath.startsWith(clientDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    if (!fs.existsSync(safeClientPath)) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    res.writeHead(200, { "Content-Type": getMime(safeClientPath) });
    fs.createReadStream(safeClientPath).pipe(res);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`✅ vite-node-api running at http://localhost:${PORT}`);
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    console.log(`🛑 ${signal} received, shutting down...`);
    server.close(() => {
      console.log("✅ Server closed gracefully");
      process.exit(0);
    });
  });
}
