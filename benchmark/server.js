import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import viteNodeApi from '../src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a minimal Vite-like server for benchmarking
const plugin = viteNodeApi({
  apiDir: path.join(__dirname, 'api'),
  cors: true
});

// Mock Vite server structure
const mockViteServer = {
  middlewares: {
    handlers: [],
    use(handler) {
      this.handlers.push(handler);
    }
  }
};

// Configure the plugin
plugin.configureServer(mockViteServer);

// Create HTTP server
const server = createServer(async (req, res) => {
  // Execute middleware chain
  let handled = false;

  for (const handler of mockViteServer.middlewares.handlers) {
    await new Promise((resolve) => {
      handler(req, res, () => {
        resolve();
      });

      // If response was sent, mark as handled
      if (res.writableEnded) {
        handled = true;
        resolve();
      }
    });

    if (handled) break;
  }

  // If not handled by API middleware, return 404
  if (!handled && !res.writableEnded) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Benchmark server running on http://localhost:${PORT}`);
  console.log(`📊 Ready for benchmarking...`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down benchmark server...');
  server.close(() => {
    process.exit(0);
  });
});
