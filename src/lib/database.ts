// This file now acts as an API client instead of direct database access
// Direct database connections should not be made from the browser for security reasons

import { buildAuthHeaders, MEDILOOP_API_BASE } from "@/lib/activeContext";

class DatabaseClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const { headers: optHeaders, ...rest } = options;
    const response = await fetch(`${MEDILOOP_API_BASE}${endpoint}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders(),
        ...(optHeaders as Record<string, string>),
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async query(sql: string, params: any[] = []) {
    return this.request('/api/query', {
      method: 'POST',
      body: JSON.stringify({ sql, params }),
    });
  }
}

export const db = new DatabaseClient();

// Template literal function for SQL queries (mock implementation)
export const sql = (strings: TemplateStringsArray, ...values: any[]) => {
  console.warn('Mock SQL query - implement proper API endpoints:', strings.join('?'), values);
  return Promise.resolve([]);
};
