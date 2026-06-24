import { redirect } from "next/navigation";
import { getSession, homePathForSession } from "@/lib/auth";
import LandingPage from "@/components/LandingPage";

export default async function Home() {
  const session = await getSession();
  if (session) redirect(homePathForSession(session));
  return <LandingPage />;
}
