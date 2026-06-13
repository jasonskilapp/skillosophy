import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Discova — Candidate Intelligence for Recruiters",
  description:
    "Job seekers upload resumes ahead of a meeting; recruiters get an instant, structured candidate profile.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
