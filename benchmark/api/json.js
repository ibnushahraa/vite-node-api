// Complex JSON response for benchmarking
export default function handler(req, res) {
  return {
    users: [
      { id: 1, name: 'Alice', email: 'alice@example.com', active: true },
      { id: 2, name: 'Bob', email: 'bob@example.com', active: false },
      { id: 3, name: 'Charlie', email: 'charlie@example.com', active: true },
      { id: 4, name: 'David', email: 'david@example.com', active: true },
      { id: 5, name: 'Eve', email: 'eve@example.com', active: false }
    ],
    total: 5,
    page: 1,
    perPage: 10,
    timestamp: Date.now()
  };
}
