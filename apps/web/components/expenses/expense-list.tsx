"use client";

import { useState } from "react";

import type { Expense, ExpensePayload } from "../../lib/api/expenses";
import { ExpenseForm } from "./expense-form";

type ExpenseListProps = {
  expenses: Expense[];
  isMutating?: boolean;
  onUpdate: (expenseId: string, payload: ExpensePayload) => Promise<void>;
  onDelete: (expenseId: string) => Promise<void>;
};

export function ExpenseList({
  expenses,
  isMutating = false,
  onUpdate,
  onDelete,
}: ExpenseListProps) {
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  if (expenses.length === 0) {
    return (
      <section className="card">
        <h2>Expenses</h2>
        <p className="muted">No expenses yet.</p>
      </section>
    );
  }

  return (
    <section className="card stack">
      <h2>Expenses</h2>

      <div className="expense-list">
        {expenses.map((expense) => {
          const isEditing = editingExpenseId === expense.id;

          return (
            <article className="expense-item" key={expense.id}>
              {isEditing ? (
                <ExpenseForm
                  defaultValues={expense}
                  submitLabel="Update expense"
                  isSubmitting={isMutating}
                  onSubmit={async (payload) => {
                    await onUpdate(expense.id, payload);
                    setEditingExpenseId(null);
                  }}
                  onCancel={() => setEditingExpenseId(null)}
                />
              ) : (
                <>
                  <div className="row row-between row-start">
                    <div className="stack stack-xs">
                      <strong>{expense.description}</strong>
                      <span className="badge">{expense.category}</span>
                      <small className="muted">
                        {new Date(expense.spentAt).toLocaleString()}
                      </small>
                    </div>

                    <strong>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(expense.amount)}
                    </strong>
                  </div>

                  <div className="actions">
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => setEditingExpenseId(expense.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="button danger"
                      type="button"
                      disabled={isMutating}
                      onClick={() => void onDelete(expense.id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
