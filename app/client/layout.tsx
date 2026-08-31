import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Pathway | Skillosophy",
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
