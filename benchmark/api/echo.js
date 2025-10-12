// POST endpoint for benchmarking with body parsing
export default function handler(req, res) {
  return {
    method: req.method,
    body: req.body || null,
    query: req.query,
    timestamp: Date.now()
  };
}
