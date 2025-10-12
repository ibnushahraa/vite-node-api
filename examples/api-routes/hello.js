// Example API route: GET /api/hello
export default function handler(req, res) {
  return {
    message: 'Hello from vite-node-api!',
    timestamp: new Date().toISOString()
  }
}
