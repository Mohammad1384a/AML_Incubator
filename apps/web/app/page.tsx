import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const featureItems = [
  {
    title: "Protected by default",
    description:
      "Cookie-based auth, route protection, and ownership-safe CRUD so users only see their own data.",
  },
  {
    title: "Fast expense workflows",
    description:
      "Create, edit, filter, and review expenses without friction. Built for speed over noise.",
  },
  {
    title: "Clear financial signal",
    description:
      "Instant totals and filter-driven summaries keep the dashboard actually useful.",
  },
];

const previewExpenses = [
  { label: "Groceries", category: "FOOD", amount: "$48.20" },
  { label: "Taxi", category: "TRANSPORT", amount: "$12.50" },
  { label: "Gym", category: "HEALTH", amount: "$35.00" },
];

async function hasValidSession(): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    return false;
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (!cookieHeader) {
    return false;
  }

  try {
    const response = await fetch(`${baseUrl}/auth/me`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}

export default async function HomePage() {
  if (await hasValidSession()) {
    redirect("/dashboard");
  }

  return (
    <main className="landing-shell">
      <div className="landing-orb landing-orb-one" />
      <div className="landing-orb landing-orb-two" />
      <div className="landing-grid" />
      <section className="landing-container">
        <header className="landing-nav">
          <div className="brand-mark">
            <span className="brand-mark-dot" />
            <span>AML Incubator</span>
          </div>

          <div className="landing-nav-actions">
            <Link className="button ghost" href="/login">
              Login
            </Link>
            <Link className="button primary" href="/register">
              Get started
            </Link>
          </div>
        </header>

        <section className="hero-layout">
          <div className="hero-copy">
            <span className="eyebrow">
              Expense tracker technical assessment
            </span>

            <h1 className="hero-title">AML incubator technical task</h1>

            <p className="hero-subtitle">
              Built with Next.js, NestJS, Prisma, PostgreSQL, auth, protected
              routes, ownership-safe APIs, filters, and live totals.
            </p>

            <div className="hero-actions">
              <Link className="button primary large" href="/register">
                Create account
              </Link>
              <Link className="button secondary large" href="/login">
                Sign in
              </Link>
            </div>

            <div className="hero-meta">
              <div className="hero-chip">Auth + protected routes</div>
              <div className="hero-chip">Ownership-safe CRUD</div>
              <div className="hero-chip">Filter + summary support</div>
            </div>
          </div>

          <div className="hero-preview">
            <section className="product-window">
              <div className="window-topbar">
                <div className="window-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="window-title">Expense dashboard preview</span>
              </div>

              <div className="window-body">
                <section className="preview-panel preview-panel-main">
                  <div className="preview-panel-header">
                    <div>
                      <p className="preview-kicker">Current month</p>
                      <h2>Total spend</h2>
                    </div>
                    <div className="preview-total">$95.70</div>
                  </div>

                  <div className="preview-bars">
                    <div className="preview-bar preview-bar-lg" />
                    <div className="preview-bar preview-bar-md" />
                    <div className="preview-bar preview-bar-sm" />
                  </div>
                </section>

                <section className="preview-expense-list">
                  {previewExpenses.map((item) => (
                    <article className="preview-expense-item" key={item.label}>
                      <div>
                        <strong>{item.label}</strong>
                        <p>{item.category}</p>
                      </div>
                      <span>{item.amount}</span>
                    </article>
                  ))}
                </section>

                <section className="preview-summary-row">
                  <div className="preview-summary-card">
                    <span>Filters</span>
                    <strong>Category + date</strong>
                  </div>
                  <div className="preview-summary-card">
                    <span>Security</span>
                    <strong>User-scoped data</strong>
                  </div>
                </section>
              </div>
            </section>
          </div>
        </section>

        <section className="feature-grid">
          {featureItems.map((item) => (
            <article className="feature-card" key={item.title}>
              <span className="feature-accent" />
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
