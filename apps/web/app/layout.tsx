import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JSX } from "react";

export const metadata: Metadata = {
  title: "AML Incubator",
  description: "Expense tracker technical assessment",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
