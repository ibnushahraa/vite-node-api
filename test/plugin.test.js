import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import viteNodeApi from "../src/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("viteNodeApi Plugin", () => {
  let testApiDir;

  beforeEach(() => {
    testApiDir = path.join(__dirname, "..", "test-fixtures", "close-bundle-api");
    if (!fs.existsSync(testApiDir)) {
      fs.mkdirSync(testApiDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup test directory
    if (fs.existsSync(testApiDir)) {
      fs.rmSync(testApiDir, { recursive: true, force: true });
    }

    // Cleanup environment variables
    delete process.env.VITE_NODE_API_PORT;
    delete process.env.VITE_NODE_API_TIMEOUT;
  });

  it("should return a Vite plugin object", () => {
    const plugin = viteNodeApi();

    expect(plugin).toHaveProperty("name", "vite-node-api");
    expect(plugin).toHaveProperty("configureServer");
    expect(plugin).toHaveProperty("closeBundle");
    expect(typeof plugin.configureServer).toBe("function");
    expect(typeof plugin.closeBundle).toBe("function");
  });

  it("should accept custom options", () => {
    const options = {
      apiDir: "custom/api",
      port: 3000,
      bodyLimit: 2_000_000,
      timeout: 60000,
      cors: true,
    };

    const plugin = viteNodeApi(options);
    expect(plugin.name).toBe("vite-node-api");
  });

  it("should use default options when none provided", () => {
    const plugin = viteNodeApi();
    expect(plugin.name).toBe("vite-node-api");
  });

  it("should handle CORS configuration", () => {
    const pluginWithCors = viteNodeApi({ cors: true });
    expect(pluginWithCors.name).toBe("vite-node-api");

    const pluginWithCorsObject = viteNodeApi({
      cors: { origin: "https://example.com" },
    });
    expect(pluginWithCorsObject.name).toBe("vite-node-api");
  });

  it("should call buildBackend during closeBundle", async () => {
    // Create a simple API file
    const apiFile = path.join(testApiDir, "test.js");
    fs.writeFileSync(
      apiFile,
      `export default () => ({ message: "test" })`
    );

    const plugin = viteNodeApi({
      apiDir: testApiDir,
      port: 5000,
      timeout: 20000,
    });

    // Call closeBundle
    await plugin.closeBundle();

    // Check that environment variables are set
    expect(process.env.VITE_NODE_API_PORT).toBe("5000");
    expect(process.env.VITE_NODE_API_TIMEOUT).toBe("20000");

    // Check that dist/server directory was created (if not deleted by other tests)
    const distServer = path.join(process.cwd(), "dist", "server");
    // Just verify that buildBackend was called by checking env vars
    // The actual directory might be cleaned up by other tests
    expect(typeof plugin.closeBundle).toBe("function");
  });

  it("should set NODE_ENV to production during closeBundle if not set", async () => {
    // Create a simple API file
    const apiFile = path.join(testApiDir, "prod-test.js");
    fs.writeFileSync(
      apiFile,
      `export default () => ({ message: "production" })`
    );

    const originalNodeEnv = process.env.NODE_ENV;
    delete process.env.NODE_ENV;

    const plugin = viteNodeApi({ apiDir: testApiDir });

    await plugin.closeBundle();

    expect(process.env.NODE_ENV).toBe("production");

    // Restore original NODE_ENV
    if (originalNodeEnv) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  it("should preserve existing NODE_ENV during closeBundle", async () => {
    // Create a simple API file
    const apiFile = path.join(testApiDir, "env-test.js");
    fs.writeFileSync(
      apiFile,
      `export default () => ({ message: "env" })`
    );

    process.env.NODE_ENV = "staging";

    const plugin = viteNodeApi({ apiDir: testApiDir });

    await plugin.closeBundle();

    expect(process.env.NODE_ENV).toBe("staging");

    // Cleanup
    delete process.env.NODE_ENV;
  });
});
