import { redirect } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import CaseworkerResumeUploader from "@/components/CaseworkerResumeUploader";
import { getSession, orgLabels } from "@/lib/auth";
import { ArrowLeftIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function CaseworkerUploadPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.accountType !== "org_member") redirect("/");

  const labels = orgLabels(session.orgType);

  return (
    <>
      <TopBar session={session} />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to {labels.candidates.toLowerCase()}
        </Link>

        <h1 className="mb-1 text-2xl font-bold tracking-tight">Upload a resume</h1>
        <p className="mb-6 text-sm text-muted">
          Upload a {labels.candidate}&apos;s resume and it will be analyzed automatically.
        </p>

        <CaseworkerResumeUploader />
      </main>
    </>
  );
}
