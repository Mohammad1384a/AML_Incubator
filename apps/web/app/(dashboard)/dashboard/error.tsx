"use client";

import { JSX } from "react";

type DashboardErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardErrorPage({
  error,
  reset,
}: DashboardErrorPageProps): JSX.Element {
  return (
    <main className="page">
      <section className="hero">
        <h1>Something went wrong</h1>
        <p>{error.message || "An unexpected error occurred."}</p>
        <button type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
