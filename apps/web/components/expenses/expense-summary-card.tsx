import type { ExpenseSummary } from "../../lib/api/expenses";

type ExpenseSummaryCardProps = {
  summary: ExpenseSummary;
};

export function ExpenseSummaryCard({ summary }: ExpenseSummaryCardProps) {
  return (
    <section className="card summary-card">
      <div>
        <h2>Total</h2>
        <p className="summary-value">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(summary.totalAmount)}
        </p>
      </div>

      <div>
        <h2>Count</h2>
        <p className="summary-value">{summary.count}</p>
      </div>
    </section>
  );
}
