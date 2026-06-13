import { redirect } from "next/navigation";
import { getSession, homePathForRole } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (session) redirect(homePathForRole(session.role));
  redirect("/login");
}
