import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skillosophy — Career & Credential Intelligence",
  description:
    "Clients upload a resume ahead of an appointment; advisors and caseworkers get an instant, structured, evidence-based profile to curate.",
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
