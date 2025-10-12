import { build } from "esbuild";
import path from "path";
import fs from "fs";
import fg from "fast-glob";

/**
 * Build backend API directory into dist/server
 * Bundles all .js files from the API directory using esbuild
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
      platform: "node",
      format: "esm",
      bundle: true,
      target: "node20",
      minify: process.env.NODE_ENV === "production",
      sourcemap: process.env.NODE_ENV === "development",
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
  } catch (err) {
    console.error("❌ vite-node-api build error:", err);
    throw err;
  }
}
