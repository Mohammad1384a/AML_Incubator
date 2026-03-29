"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { authApi } from "../../lib/api/auth";
import { ApiRequestError } from "../../lib/api/client";
import {
  expenseApi,
  type Expense,
  type ExpenseFilters,
  type ExpensePayload,
  type ExpenseSummary,
} from "../../lib/api/expenses";
import { ExpenseFilters as ExpenseFiltersPanel } from "./expense-filters";
import { ExpenseForm } from "./expense-form";
import { ExpenseList } from "./expense-list";
import { ExpenseSummaryCard } from "./expense-summary-card";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

const DEFAULT_FILTERS: ExpenseFilters = {
  category: "",
  from: "",
  to: "",
};

export function ExpenseDashboard() {
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary>({
    totalAmount: 0,
    count: 0,
  });
  const [filters, setFilters] = useState<ExpenseFilters>(DEFAULT_FILTERS);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState("");

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
    router.refresh();
  }, [router]);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError("");

      const [user, nextExpenses, nextSummary] = await Promise.all([
        authApi.getMe(),
        expenseApi.list(filters),
        expenseApi.getSummary(filters),
      ]);

      setCurrentUserEmail(user.email);
      setExpenses(nextExpenses);
      setSummary(nextSummary);
    } catch (loadError) {
      if (loadError instanceof ApiRequestError && loadError.status === 401) {
        redirectToLogin();
        return;
      }

      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [filters, redirectToLogin]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleCreate(payload: ExpensePayload): Promise<void> {
    try {
      setIsMutating(true);
      setError("");
      await expenseApi.create(payload);
      await loadData();
    } catch (mutationError) {
      if (
        mutationError instanceof ApiRequestError &&
        mutationError.status === 401
      ) {
        redirectToLogin();
        return;
      }

      setError(getErrorMessage(mutationError));
    } finally {
      setIsMutating(false);
    }
  }

  async function handleUpdate(
    expenseId: string,
    payload: ExpensePayload,
  ): Promise<void> {
    try {
      setIsMutating(true);
      setError("");
      await expenseApi.update(expenseId, payload);
      await loadData();
    } catch (mutationError) {
      if (
        mutationError instanceof ApiRequestError &&
        mutationError.status === 401
      ) {
        redirectToLogin();
        return;
      }

      setError(getErrorMessage(mutationError));
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDelete(expenseId: string): Promise<void> {
    try {
      setIsMutating(true);
      setError("");
      await expenseApi.remove(expenseId);
      await loadData();
    } catch (mutationError) {
      if (
        mutationError instanceof ApiRequestError &&
        mutationError.status === 401
      ) {
        redirectToLogin();
        return;
      }

      setError(getErrorMessage(mutationError));
    } finally {
      setIsMutating(false);
    }
  }

  async function handleLogout(): Promise<void> {
    try {
      await authApi.logout();
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div className="stack stack-xs">
          <h1>Expense dashboard</h1>
          <p className="muted">
            {currentUserEmail
              ? `Signed in as ${currentUserEmail}`
              : "Loading user..."}
          </p>
        </div>

        <button
          className="button secondary"
          type="button"
          onClick={() => void handleLogout()}
        >
          Logout
        </button>
      </header>

      {error ? <div className="form-error">{error}</div> : null}

      <div className="dashboard-grid">
        <div className="stack">
          <section className="card stack stack-sm">
            <h2>Add expense</h2>
            <ExpenseForm
              submitLabel="Create expense"
              isSubmitting={isMutating}
              onSubmit={handleCreate}
            />
          </section>

          <ExpenseFiltersPanel
            value={filters}
            onChange={setFilters}
            onClear={() => setFilters(DEFAULT_FILTERS)}
          />

          {isLoading ? (
            <section className="card">
              <p className="muted">Loading expenses...</p>
            </section>
          ) : (
            <ExpenseList
              expenses={expenses}
              isMutating={isMutating}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          )}
        </div>

        <div className="stack">
          <ExpenseSummaryCard summary={summary} />
        </div>
      </div>
    </main>
  );
}
