
// This file now acts as an API client instead of direct database access
// Direct database connections should not be made from the browser for security reasons

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class DatabaseClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
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

export const sql = new DatabaseClient();

// For now, we'll create a mock implementation to prevent errors
// This should be replaced with proper API calls
export const mockSql = (strings: TemplateStringsArray, ...values: any[]) => {
  console.warn('Mock SQL query - implement proper API endpoints:', strings.join('?'), values);
  return Promise.resolve([]);
};

// Temporarily export mockSql as sql until API endpoints are ready
export { mockSql as sql };
