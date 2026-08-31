import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ClientLoginForm from "./ClientLoginForm";

export default async function ClientLoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Sign in to your pathway</h1>
          <p className="mt-2 text-sm text-muted">Access your personalized licensing roadmap.</p>
        </div>
        <ClientLoginForm />
      </div>
    </main>
  );
}
