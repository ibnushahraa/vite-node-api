// Simple GET endpoint for benchmarking
export default function handler(req, res) {
  return {
    message: 'Hello, World!',
    timestamp: Date.now()
  };
}
