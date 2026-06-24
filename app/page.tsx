import { redirect } from "next/navigation";
import { getSession, homePathForSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (session) redirect(homePathForSession(session));
  redirect("/login");
}
