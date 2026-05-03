import type { ReactNode } from "react";

export const metadata = {
  title: "Job-search Automation",
  description: "Compliance-first job-search copilot and application CRM.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
