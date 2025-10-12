import autocannon from 'autocannon';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Start benchmark server
console.log('🚀 Starting benchmark server...\n');

const serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
  stdio: 'inherit'
});

// Wait for server to start
await new Promise(resolve => setTimeout(resolve, 2000));

console.log('\n📊 Running benchmarks...\n');

// Benchmark configurations
const benchmarks = [
  {
    title: 'Simple GET Request',
    url: 'http://localhost:3000/api/hello',
    method: 'GET'
  },
  {
    title: 'GET with Query Parameters',
    url: 'http://localhost:3000/api/hello?name=test&id=123',
    method: 'GET'
  },
  {
    title: 'Complex JSON Response',
    url: 'http://localhost:3000/api/json',
    method: 'GET'
  },
  {
    title: 'POST with JSON Body',
    url: 'http://localhost:3000/api/echo',
    method: 'POST',
    body: JSON.stringify({ name: 'test', value: 123 }),
    headers: {
      'Content-Type': 'application/json'
    }
  }
];

const results = [];

// Run benchmarks sequentially
for (const config of benchmarks) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎯 ${config.title}`);
  console.log(`${'='.repeat(60)}\n`);

  const result = await runBenchmark(config);
  results.push({
    title: config.title,
    ...result
  });

  // Wait between benchmarks
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// Print summary
console.log('\n\n' + '='.repeat(60));
console.log('📈 BENCHMARK SUMMARY');
console.log('='.repeat(60) + '\n');

console.log('┌─────────────────────────────────┬──────────┬──────────┬──────────┐');
console.log('│ Benchmark                       │ Req/sec  │ Latency  │ Errors   │');
console.log('├─────────────────────────────────┼──────────┼──────────┼──────────┤');

results.forEach(result => {
  const title = result.title.padEnd(31);
  const reqSec = result.requests.average.toFixed(0).padStart(8);
  const latency = `${result.latency.mean.toFixed(2)}ms`.padStart(8);
  const errors = result.errors.toString().padStart(8);

  console.log(`│ ${title} │ ${reqSec} │ ${latency} │ ${errors} │`);
});

console.log('└─────────────────────────────────┴──────────┴──────────┴──────────┘\n');

// Shutdown server
console.log('👋 Shutting down benchmark server...\n');
serverProcess.kill('SIGTERM');

// Wait for cleanup
await new Promise(resolve => setTimeout(resolve, 1000));

process.exit(0);

// Helper function to run a single benchmark
function runBenchmark(config) {
  return new Promise((resolve, reject) => {
    const options = {
      url: config.url,
      method: config.method || 'GET',
      connections: 100,
      duration: 10,
      pipelining: 1,
      ...config
    };

    autocannon(options, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}
