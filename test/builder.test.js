import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import buildBackend from "../src/builder.js";
import fs from "fs";
import path from "path";

describe("buildBackend", () => {
  const testApiDir = path.resolve("test-fixtures/builder-test-api");
  const outDir = "dist/server";

  beforeEach(() => {
    // Cleanup first
    if (fs.existsSync(testApiDir)) {
      fs.rmSync(testApiDir, { recursive: true, force: true });
    }
    if (fs.existsSync("dist")) {
      fs.rmSync("dist", { recursive: true, force: true });
    }

    // Setup test API directory
    fs.mkdirSync(testApiDir, { recursive: true });
    fs.writeFileSync(
      path.join(testApiDir, "test.js"),
      "export default (req, res) => ({ message: 'test' });"
    );
  });

  afterEach(() => {
    // Cleanup with retry for Windows file locking
    const cleanup = (retries = 3) => {
      try {
        if (fs.existsSync(testApiDir)) {
          fs.rmSync(testApiDir, { recursive: true, force: true });
        }
        if (fs.existsSync("dist")) {
          fs.rmSync("dist", { recursive: true, force: true });
        }
      } catch (err) {
        if (retries > 0 && err.code === "EBUSY") {
          setTimeout(() => cleanup(retries - 1), 100);
        }
      }
    };
    cleanup();
  });

  it("should create dist/server directory", async () => {
    await buildBackend(testApiDir);
    expect(fs.existsSync(outDir)).toBe(true);
  });

  it("should bundle API files", async () => {
    await buildBackend(testApiDir);
    expect(fs.existsSync(path.join(outDir, "test.js"))).toBe(true);
  });

  it("should warn when no API files found", async () => {
    const emptyDir = path.resolve("test-fixtures/builder-empty");
    if (fs.existsSync(emptyDir)) {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
    fs.mkdirSync(emptyDir, { recursive: true });

    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    await buildBackend(emptyDir);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("no API files found")
    );
    consoleWarnSpy.mockRestore();

    // Cleanup
    if (fs.existsSync(emptyDir)) {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it("should throw error on build failure", async () => {
    // Invalid JavaScript to cause build error
    fs.writeFileSync(
      path.join(testApiDir, "invalid.js"),
      "this is invalid javascript {{{{"
    );

    await expect(buildBackend(testApiDir)).rejects.toThrow();
  });
});
