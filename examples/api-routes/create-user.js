// Example API route: POST /api/create-user
// Expects JSON body: { "name": "John", "email": "john@example.com" }

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    return { error: 'Method not allowed' }
  }

  const { name, email } = req.body

  if (!name || !email) {
    res.statusCode = 400
    return { error: 'Name and email are required' }
  }

  // Simulate creating a user
  const newUser = {
    id: Date.now(),
    name,
    email,
    createdAt: new Date().toISOString()
  }

  return {
    success: true,
    user: newUser
  }
}
