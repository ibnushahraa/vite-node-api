# vite-node-api Benchmarks

This directory contains performance benchmarks for `vite-node-api` using [autocannon](https://github.com/mcollina/autocannon).

## Running Benchmarks

### Run all benchmarks
```bash
npm run bench
```

### Run server manually (for custom testing)
```bash
npm run bench:server
```

Then in another terminal, use autocannon directly:
```bash
npx autocannon http://localhost:3000/api/hello
```

## Benchmark Scenarios

The benchmark suite tests the following scenarios:

1. **Simple GET Request** - Basic endpoint returning JSON
2. **GET with Query Parameters** - Request with URL parameters
3. **Complex JSON Response** - Larger payload with nested data
4. **POST with JSON Body** - Request body parsing performance

## Configuration

- **Connections**: 100 concurrent connections
- **Duration**: 10 seconds per test
- **Pipelining**: 1 (no HTTP pipelining)

## API Endpoints

### GET `/api/hello`
Simple endpoint returning a greeting message.

### GET `/api/json`
Complex endpoint returning a list of users with metadata.

### POST `/api/echo`
Echo endpoint that returns the request body, method, and query parameters.

## Interpreting Results

The benchmark reports the following metrics:

- **Req/sec**: Requests per second (higher is better)
- **Latency**: Average response time in milliseconds (lower is better)
- **Errors**: Number of failed requests (0 is ideal)

### Latest Results

```
┌─────────────────────────────────┬──────────┬──────────┬──────────┐
│ Benchmark                       │ Req/sec  │ Latency  │ Errors   │
├─────────────────────────────────┼──────────┼──────────┼──────────┤
│ Simple GET Request              │     3331 │  29.53ms │        0 │
│ GET with Query Parameters       │     2281 │  43.20ms │        0 │
│ Complex JSON Response           │     2965 │  33.25ms │        0 │
│ POST with JSON Body             │     2146 │  46.07ms │        0 │
└─────────────────────────────────┴──────────┴──────────┴──────────┘
```

## Notes

- Results may vary based on hardware and system load
- Benchmarks are run sequentially with 1-second pauses between tests
- The server automatically starts and stops for each benchmark run
- For production comparisons, run benchmarks multiple times and average results
