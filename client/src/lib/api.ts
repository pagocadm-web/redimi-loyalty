// API client for real backend
import type { Customer, Transaction, EventLog, Settings } from "./mock-server";

const API_BASE = "/api";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include", // Important for cookies/sessions
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Login failed" }));
      throw new Error(error.message || "Login failed");
    }

    return response.json();
  },

  logout: async () => {
    return fetchAPI(`${API_BASE}/auth/logout`, { method: "POST" });
  },

  getMe: async () => {
    return fetchAPI<{ id: string; username: string; email: string }>(`${API_BASE}/auth/me`);
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    return fetchAPI<Customer[]>(`${API_BASE}/customers`);
  },

  createCustomer: async (data: {
    name: string;
    whatsapp: string;
    birthday?: string;
  }): Promise<Customer> => {
    return fetchAPI<Customer>(`${API_BASE}/customers`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    return fetchAPI<Transaction[]>(`${API_BASE}/transactions`);
  },

  earnPoints: async (id: string, amount: number): Promise<Transaction> => {
    return fetchAPI<Transaction>(`${API_BASE}/transactions/earn`, {
      method: "POST",
      body: JSON.stringify({ customerId: id, amount }),
    });
  },

  redeemPoints: async (id: string, points: number): Promise<Transaction> => {
    return fetchAPI<Transaction>(`${API_BASE}/transactions/redeem`, {
      method: "POST",
      body: JSON.stringify({ customerId: id, points }),
    });
  },

  // Stats
  getStats: async () => {
    return fetchAPI<{
      totalCustomers: number;
      totalPointsIssued: number;
      totalPointsRedeemed: number;
    }>(`${API_BASE}/stats`);
  },

  // Settings
  getSettings: async (): Promise<Settings> => {
    return fetchAPI<Settings>(`${API_BASE}/settings`);
  },

  updateSettings: async (data: {
    rate?: number;
    franchise?: string;
    password?: string;
  }): Promise<Settings> => {
    return fetchAPI<Settings>(`${API_BASE}/settings`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  addBranch: async (name: string): Promise<Settings> => {
    return fetchAPI<Settings>(`${API_BASE}/settings/branches`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  // Events
  getEvents: async (): Promise<EventLog[]> => {
    return fetchAPI<EventLog[]>(`${API_BASE}/events`);
  },
};

