import { notFound, redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import CandidateLayoutShell from "@/components/CandidateLayoutShell";
import { getSession, orgLabels } from "@/lib/auth";
import { getCandidate, listCandidateNotes, listFollowupsForCandidate, getPathway, getPathwayRequirements, listAssessments } from "@/lib/data";
import type { AssessmentRecord, CandidateNote, CandidateReport, NewcomerPathway, PathwayRequirement } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.accountType !== "org_member") redirect("/");

  const { id } = await params;
  const isNewcomerOrg = session.orgType === "newcomer";

  const [result, notes, pathway, followups, requirements, assessments] = await Promise.all([
    getCandidate(session, id),
    listCandidateNotes(id, session),
    isNewcomerOrg ? getPathway(id, session) : Promise.resolve(null),
    listFollowupsForCandidate(id, session),
    isNewcomerOrg ? getPathwayRequirements(id, session) : Promise.resolve([] as PathwayRequirement[]),
    listAssessments(id, session),
  ]);
  if (!result) notFound();

  const { summary, report, pendingReport, pendingPathway, appointmentCompletedAt, usefulRating, timeSavedMin, appointmentNote, verifiedSkills } = result;
  const typedReport = report as CandidateReport | null;
  const typedPendingReport = pendingReport as CandidateReport | null;
  const typedPendingPathway = pendingPathway as NewcomerPathway | null;
  const labels = orgLabels(session.orgType);

  const notesBySection: Record<string, CandidateNote[]> = {};
  const generalNotes: CandidateNote[] = [];
  for (const note of notes) {
    if (note.section) {
      (notesBySection[note.section] ??= []).push(note);
    } else {
      generalNotes.push(note);
    }
  }

  return (
    <>
      <TopBar session={session} />
      <CandidateLayoutShell
        candidateId={id}
        isNewcomerOrg={isNewcomerOrg}
        isAdmin={session.orgRole === "org_admin"}
        isArchived={!!summary.archivedAt}
        backLabel={`Back to ${labels.candidates.toLowerCase()}`}
        meetingLabel={labels.meeting[0].toUpperCase() + labels.meeting.slice(1)}
        summary={summary}
        report={typedReport}
        pathway={pathway}
        pendingReport={typedPendingReport}
        pendingPathway={typedPendingPathway}
        appointmentCompletedAt={appointmentCompletedAt}
        usefulRating={usefulRating}
        timeSavedMin={timeSavedMin}
        appointmentNote={appointmentNote}
        notesBySection={notesBySection}
        generalNotes={generalNotes}
        followups={followups}
        requirements={requirements}
        assessments={assessments}
        verifiedSkills={verifiedSkills}
      />
    </>
  );
}
