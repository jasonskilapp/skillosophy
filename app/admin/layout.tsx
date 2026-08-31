import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminNav from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.accountType !== "org_member" || session.orgRole !== "org_admin") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNav orgName={session.organizationName ?? "Admin"} userName={session.name} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
