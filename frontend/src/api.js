const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(endpoint, options = {}, token = null) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  register: (name, email, password) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  // Transactions
  getTransactions: (token, month = null) =>
    request(`/api/transactions${month ? `?month=${month}` : ""}`, {}, token),
  createTransaction: (token, tx) =>
    request("/api/transactions", { method: "POST", body: JSON.stringify(tx) }, token),
  deleteTransaction: (token, id) =>
    request(`/api/transactions/${id}`, { method: "DELETE" }, token),
  bulkImportTransactions: (token, items) =>
    request("/api/transactions/bulk", { method: "POST", body: JSON.stringify({ items }) }, token),

  // Budgets
  getBudgets: (token, month = null) =>
    request(`/api/budgets${month ? `?month=${month}` : ""}`, {}, token),
  saveBudget: (token, budget) =>
    request("/api/budgets", { method: "POST", body: JSON.stringify(budget) }, token),
  deleteBudget: (token, category, month = null) =>
    request(`/api/budgets/${encodeURIComponent(category)}${month ? `?month=${month}` : ""}`, { method: "DELETE" }, token),

  // Goals
  getGoals: (token) =>
    request("/api/goals", {}, token),
  createGoal: (token, goal) =>
    request("/api/goals", { method: "POST", body: JSON.stringify(goal) }, token),
  updateGoal: (token, id, updates) =>
    request(`/api/goals/${id}`, { method: "PATCH", body: JSON.stringify(updates) }, token),
  deleteGoal: (token, id) =>
    request(`/api/goals/${id}`, { method: "DELETE" }, token),

  // Recurring
  getRecurring: (token) =>
    request("/api/recurring", {}, token),
  createRecurring: (token, item) =>
    request("/api/recurring", { method: "POST", body: JSON.stringify(item) }, token),
  deleteRecurring: (token, id) =>
    request(`/api/recurring/${id}`, { method: "DELETE" }, token),
};

