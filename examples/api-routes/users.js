// Example API route: GET /api/users
// Supports query parameters: /api/users?limit=10

const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' }
]

export default function handler(req, res) {
  const limit = parseInt(req.query.limit) || users.length

  return {
    users: users.slice(0, limit),
    total: users.length
  }
}
