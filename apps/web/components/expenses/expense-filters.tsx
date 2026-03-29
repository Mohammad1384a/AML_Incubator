"use client";

import { expenseCategories, type ExpenseFilters } from "../../lib/api/expenses";

type ExpenseFiltersProps = {
  value: ExpenseFilters;
  onChange: (nextValue: ExpenseFilters) => void;
  onClear: () => void;
};

export function ExpenseFilters({
  value,
  onChange,
  onClear,
}: ExpenseFiltersProps) {
  return (
    <section className="card stack stack-sm">
      <div className="row row-between">
        <h2>Filters</h2>
        <button className="button secondary" type="button" onClick={onClear}>
          Clear
        </button>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Category</span>
          <select
            value={value.category ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                category: event.target.value as ExpenseFilters["category"],
              })
            }
          >
            <option value="">All</option>
            {expenseCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>From</span>
          <input
            type="date"
            value={value.from ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                from: event.target.value,
              })
            }
          />
        </label>

        <label className="field">
          <span>To</span>
          <input
            type="date"
            value={value.to ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                to: event.target.value,
              })
            }
          />
        </label>
      </div>
    </section>
  );
}
