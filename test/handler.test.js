import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import viteNodeApi from "../src/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock HTTP request/response
function createMockRequest(options = {}) {
  const req = {
    url: options.url || "/api/test",
    method: options.method || "GET",
    headers: options.headers || { host: "localhost:5173" },
    setTimeout: jest.fn(),
    ...options,
  };

  if (options.body) {
    const chunks = [Buffer.from(JSON.stringify(options.body))];
    req[Symbol.asyncIterator] = async function* () {
      for (const chunk of chunks) {
        yield chunk;
      }
    };
  } else if (options.rawBody) {
    const chunks = [Buffer.from(options.rawBody)];
    req[Symbol.asyncIterator] = async function* () {
      for (const chunk of chunks) {
        yield chunk;
      }
    };
  }

  return req;
}

function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    writableEnded: false,
    setHeader: jest.fn((name, value) => {
      res.headers[name] = value;
    }),
    writeHead: jest.fn((code) => {
      res.statusCode = code;
    }),
    end: jest.fn((data) => {
      res.body = data;
      res.writableEnded = true;
    }),
  };
  return res;
}

describe("API Handler", () => {
  let testApiDir;

  beforeEach(() => {
    testApiDir = path.join(__dirname, "..", "test-fixtures", "api");
    if (!fs.existsSync(testApiDir)) {
      fs.mkdirSync(testApiDir, { recursive: true });
    }
  });

  describe("Middleware Handler", () => {
    it("should call next() for non-API routes", async () => {
      const plugin = viteNodeApi({ apiDir: testApiDir });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({ url: "/some-page" });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should handle API routes", async () => {
      // Create test API file
      const testFile = path.join(testApiDir, "test.js");
      fs.writeFileSync(
        testFile,
        `export default () => ({ message: "test" })`
      );

      const plugin = viteNodeApi({ apiDir: testApiDir });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({ url: "/api/test" });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.end).toHaveBeenCalled();
      expect(res.headers["Content-Type"]).toBe("application/json");

      // Cleanup
      fs.unlinkSync(testFile);
    });

    it("should return 404 for non-existent API routes", async () => {
      const plugin = viteNodeApi({ apiDir: testApiDir });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({ url: "/api/nonexistent" });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(res.statusCode).toBe(404);
      expect(res.body).toContain("API route not found");
    });
  });

  describe("CORS Handling", () => {
    it("should add CORS headers when enabled", async () => {
      // Create test API file
      const testFile = path.join(testApiDir, "cors-test.js");
      fs.writeFileSync(
        testFile,
        `export default () => ({ message: "cors" })`
      );

      const plugin = viteNodeApi({ apiDir: testApiDir, cors: true });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({ url: "/api/cors-test" });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Origin",
        "*"
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS"
      );

      // Cleanup
      fs.unlinkSync(testFile);
    });

    it("should handle OPTIONS preflight requests", async () => {
      const plugin = viteNodeApi({ apiDir: testApiDir, cors: true });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({ url: "/api/test", method: "OPTIONS" });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(res.writeHead).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });

    it("should use custom CORS origin", async () => {
      // Create test API file
      const testFile = path.join(testApiDir, "cors-custom.js");
      fs.writeFileSync(
        testFile,
        `export default () => ({ message: "custom" })`
      );

      const plugin = viteNodeApi({
        apiDir: testApiDir,
        cors: { origin: "https://example.com" },
      });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({ url: "/api/cors-custom" });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Origin",
        "https://example.com"
      );

      // Cleanup
      fs.unlinkSync(testFile);
    });
  });

  describe("Request Body Parsing", () => {
    it("should parse JSON body for POST requests", async () => {
      // Create test API file
      const testFile = path.join(testApiDir, "post-test.js");
      fs.writeFileSync(
        testFile,
        `export default (req) => ({ received: req.body })`
      );

      const plugin = viteNodeApi({ apiDir: testApiDir });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({
        url: "/api/post-test",
        method: "POST",
        body: { name: "test", value: 123 },
      });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(res.statusCode).toBe(200);
      const responseData = JSON.parse(res.body);
      expect(responseData.received).toEqual({ name: "test", value: 123 });

      // Cleanup
      fs.unlinkSync(testFile);
    });

    it("should return 400 for invalid JSON", async () => {
      // Create test API file first
      const testFile = path.join(testApiDir, "invalid-json.js");
      fs.writeFileSync(
        testFile,
        `export default (req) => ({ received: req.body })`
      );

      const plugin = viteNodeApi({ apiDir: testApiDir });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({
        url: "/api/invalid-json",
        method: "POST",
        rawBody: "invalid json {{{",
      });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.body).toContain("Invalid JSON body");

      // Cleanup
      fs.unlinkSync(testFile);
    });

    it("should return 413 when body exceeds limit", async () => {
      // Create test API file first
      const testFile = path.join(testApiDir, "large-body.js");
      fs.writeFileSync(
        testFile,
        `export default (req) => ({ received: req.body })`
      );

      const plugin = viteNodeApi({ apiDir: testApiDir, bodyLimit: 100 });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const largeBody = { data: "x".repeat(200) };
      const req = createMockRequest({
        url: "/api/large-body",
        method: "POST",
        body: largeBody,
      });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(res.statusCode).toBe(413);
      expect(res.body).toContain("Request body too large");

      // Cleanup
      fs.unlinkSync(testFile);
    });

    it("should handle PUT requests", async () => {
      // Create test API file
      const testFile = path.join(testApiDir, "put-test.js");
      fs.writeFileSync(
        testFile,
        `export default (req) => ({ method: req.method, body: req.body })`
      );

      const plugin = viteNodeApi({ apiDir: testApiDir });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({
        url: "/api/put-test",
        method: "PUT",
        body: { update: "data" },
      });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(res.statusCode).toBe(200);
      const responseData = JSON.parse(res.body);
      expect(responseData.method).toBe("PUT");

      // Cleanup
      fs.unlinkSync(testFile);
    });

    it("should handle PATCH requests", async () => {
      // Create test API file
      const testFile = path.join(testApiDir, "patch-test.js");
      fs.writeFileSync(
        testFile,
        `export default (req) => ({ method: req.method, body: req.body })`
      );

      const plugin = viteNodeApi({ apiDir: testApiDir });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({
        url: "/api/patch-test",
        method: "PATCH",
        body: { patch: "data" },
      });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(res.statusCode).toBe(200);
      const responseData = JSON.parse(res.body);
      expect(responseData.method).toBe("PATCH");

      // Cleanup
      fs.unlinkSync(testFile);
    });
  });

  describe("Query Parameters", () => {
    it("should parse query parameters", async () => {
      // Create test API file
      const testFile = path.join(testApiDir, "query-test.js");
      fs.writeFileSync(
        testFile,
        `export default (req) => ({ query: req.query })`
      );

      const plugin = viteNodeApi({ apiDir: testApiDir });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({ url: "/api/query-test?name=test&id=123" });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(res.statusCode).toBe(200);
      const responseData = JSON.parse(res.body);
      expect(responseData.query).toEqual({ name: "test", id: "123" });

      // Cleanup
      fs.unlinkSync(testFile);
    });
  });

  describe("Error Handling", () => {
    it("should return 500 on handler error", async () => {
      // Create test API file that throws error
      const testFile = path.join(testApiDir, "error-test.js");
      fs.writeFileSync(
        testFile,
        `export default () => { throw new Error("Test error") }`
      );

      const plugin = viteNodeApi({ apiDir: testApiDir });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({ url: "/api/error-test" });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(res.statusCode).toBe(500);
      expect(res.body).toContain("Test error");

      // Cleanup
      fs.unlinkSync(testFile);
    });

    it("should handle missing default export", async () => {
      // Create test API file without default export
      const testFile = path.join(testApiDir, "no-export.js");
      fs.writeFileSync(testFile, `export const foo = "bar"`);

      const plugin = viteNodeApi({ apiDir: testApiDir });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({ url: "/api/no-export" });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(res.statusCode).toBe(500);

      // Cleanup
      fs.unlinkSync(testFile);
    });

    it("should not send error response if already ended", async () => {
      // Create test API file that ends response then throws
      const testFile = path.join(testApiDir, "error-ended.js");
      fs.writeFileSync(
        testFile,
        `export default (req, res) => {
          res.end("Already done");
          throw new Error("This error comes after response ended");
        }`
      );

      const plugin = viteNodeApi({ apiDir: testApiDir });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({ url: "/api/error-ended" });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(res.body).toBe("Already done"); // Original response preserved
      // Status code should not be 500 since response already ended

      // Cleanup
      fs.unlinkSync(testFile);
    });
  });

  describe("Path Security", () => {
    it("should block path traversal attempts", async () => {
      const plugin = viteNodeApi({ apiDir: testApiDir });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      // Try to access file using path traversal with multiple dots
      const req = createMockRequest({ url: "/api/../../../../../../etc/passwd" });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      // Should return 403 Forbidden for paths outside apiDir, or 404 if path doesn't exist
      // Both are acceptable security responses
      expect([403, 404]).toContain(res.statusCode);
      if (res.statusCode === 403) {
        expect(res.body).toContain("Forbidden path");
      } else {
        expect(res.body).toContain("API route not found");
      }
    });
  });

  describe("Timeout Handling", () => {
    it("should set timeout on requests", async () => {
      const plugin = viteNodeApi({ apiDir: testApiDir, timeout: 15000 });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({ url: "/api/test" });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(req.setTimeout).toHaveBeenCalledWith(
        15000,
        expect.any(Function)
      );
    });

    it("should trigger timeout callback when timeout occurs", async () => {
      // Create test API file
      const testFile = path.join(testApiDir, "timeout-test.js");
      fs.writeFileSync(
        testFile,
        `export default () => ({ message: "timeout" })`
      );

      const plugin = viteNodeApi({ apiDir: testApiDir, timeout: 1000 });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({ url: "/api/timeout-test" });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      // Get the timeout callback
      const timeoutCallback = req.setTimeout.mock.calls[0][1];

      // Simulate timeout by calling the callback
      res.writableEnded = false; // Reset to test timeout path
      timeoutCallback();

      expect(res.statusCode).toBe(408);
      expect(res.body).toContain("Request timeout");

      // Cleanup
      fs.unlinkSync(testFile);
    });

    it("should not send timeout response if already ended", async () => {
      // Create test API file
      const testFile = path.join(testApiDir, "timeout-ended.js");
      fs.writeFileSync(
        testFile,
        `export default () => ({ message: "done" })`
      );

      const plugin = viteNodeApi({ apiDir: testApiDir, timeout: 1000 });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({ url: "/api/timeout-ended" });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      // Get the timeout callback
      const timeoutCallback = req.setTimeout.mock.calls[0][1];
      const initialBody = res.body;

      // Response already ended, timeout callback should do nothing
      timeoutCallback();

      expect(res.body).toBe(initialBody); // Body unchanged

      // Cleanup
      fs.unlinkSync(testFile);
    });
  });

  describe("Response Handling", () => {
    it("should not send response if already ended", async () => {
      // Create test API file that manually ends response
      const testFile = path.join(testApiDir, "manual-response.js");
      fs.writeFileSync(
        testFile,
        `export default (req, res) => {
          res.setHeader("Content-Type", "text/plain");
          res.end("Manual response");
        }`
      );

      const plugin = viteNodeApi({ apiDir: testApiDir });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({ url: "/api/manual-response" });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(res.body).toBe("Manual response");

      // Cleanup
      fs.unlinkSync(testFile);
    });

    it("should handle empty response", async () => {
      // Create test API file that returns nothing
      const testFile = path.join(testApiDir, "empty-response.js");
      fs.writeFileSync(testFile, `export default () => {}`);

      const plugin = viteNodeApi({ apiDir: testApiDir });
      const mockServer = {
        middlewares: {
          use: jest.fn((handler) => {
            mockServer.handler = handler;
          }),
        },
      };

      plugin.configureServer(mockServer);

      const req = createMockRequest({ url: "/api/empty-response" });
      const res = createMockResponse();
      const next = jest.fn();

      await mockServer.handler(req, res, next);

      expect(res.body).toBe(JSON.stringify({}));

      // Cleanup
      fs.unlinkSync(testFile);
    });
  });
});
