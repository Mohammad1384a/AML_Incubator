import { apiRequest } from "./client";

export const expenseCategories = [
  "FOOD",
  "TRANSPORT",
  "ENTERTAINMENT",
  "HEALTH",
  "UTILITIES",
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];

export type Expense = {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  spentAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpensePayload = {
  amount: number;
  category: ExpenseCategory;
  description: string;
  spentAt: string;
};

export type ExpenseFilters = {
  category?: ExpenseCategory | "";
  from?: string;
  to?: string;
};

export type ExpenseSummary = {
  totalAmount: number;
  count: number;
};

function normalizeFrom(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value;
}

function normalizeTo(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999Z` : value;
}

function buildQuery(filters: ExpenseFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.from) {
    params.set("from", normalizeFrom(filters.from));
  }

  if (filters.to) {
    params.set("to", normalizeTo(filters.to));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export const expenseApi = {
  list(filters: ExpenseFilters = {}): Promise<Expense[]> {
    return apiRequest<Expense[]>(`/expenses${buildQuery(filters)}`);
  },

  getById(expenseId: string): Promise<Expense> {
    return apiRequest<Expense>(`/expenses/${expenseId}`);
  },

  create(payload: ExpensePayload): Promise<Expense> {
    return apiRequest<Expense>("/expenses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(expenseId: string, payload: ExpensePayload): Promise<Expense> {
    return apiRequest<Expense>(`/expenses/${expenseId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  remove(expenseId: string): Promise<{ success: true }> {
    return apiRequest<{ success: true }>(`/expenses/${expenseId}`, {
      method: "DELETE",
    });
  },

  getSummary(filters: ExpenseFilters = {}): Promise<ExpenseSummary> {
    return apiRequest<ExpenseSummary>(
      `/expenses/summary${buildQuery(filters)}`,
    );
  },
};
