import { build } from "esbuild";
import path from "path";
import fs from "fs";
import fg from "fast-glob";

/**
 * Build backend API directory into dist/server
 * Bundles all .js files from the API directory using esbuild
 * All dependencies are bundled for standalone deployment
 *
 * @param {string} apiDir - Absolute path to API directory
 * @returns {Promise<void>}
 * @throws {Error} If build fails or esbuild encounters errors
 */
export default async function buildBackend(apiDir) {
  const outDir = "dist/server";
  fs.mkdirSync(outDir, { recursive: true });

  const entryPoints = await fg("**/*.js", {
    cwd: apiDir,
    absolute: true,
  });

  if (!entryPoints.length) {
    console.warn("⚠️ vite-node-api: no API files found to build");
    return;
  }

  try {
    console.log("📦 vite-node-api: building backend...");

    await build({
      entryPoints,
      outdir: outDir,
      outbase: path.dirname(apiDir), // Preserve folder structure
      platform: "node",
      format: "esm",
      bundle: true,
      target: "node20",
      minify: process.env.NODE_ENV === "production",
      sourcemap: process.env.NODE_ENV === "development",
      banner: {
        js: `import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);`
      },
      // Bundle everything - no external dependencies
    });

    const runtimePath = path.resolve(
      "node_modules/vite-node-api/src/runtime/entry.mjs"
    );

    if (fs.existsSync(runtimePath)) {
      fs.copyFileSync(runtimePath, path.join(outDir, "entry.mjs"));
    } else {
      console.warn("⚠️ vite-node-api: runtime entry.mjs not found!");
    }

    console.log("✅ vite-node-api: backend bundled → dist/server");

    // Copy .env.production to dist/.env for production runtime
    const envSource = path.resolve(".env.production");
    if (fs.existsSync(envSource)) {
      fs.copyFileSync(envSource, path.join("dist", ".env"));
      console.log("✅ vite-node-api: .env.production → dist/.env");
    }

    // Bundle runtime entry.mjs separately
    const runtimeSource = path.resolve(
      "node_modules/vite-node-api/src/runtime/entry.mjs"
    );

    if (fs.existsSync(runtimeSource)) {
      await build({
        entryPoints: [runtimeSource],
        outfile: path.join(outDir, "entry.mjs"),
        platform: "node",
        format: "esm",
        bundle: true,
        target: "node20",
        minify: process.env.NODE_ENV === "production",
        banner: {
          js: `import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);`
        },
        // Bundle everything - standalone executable
      });
      console.log("✅ vite-node-api: runtime bundled → dist/server/entry.mjs");
    } else {
      console.warn("⚠️ vite-node-api: runtime entry.mjs not found!");
    }

  } catch (err) {
    console.error("❌ vite-node-api build error:", err);
    throw err;
  }
}
