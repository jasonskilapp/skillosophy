import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCandidate, listCandidateNotes, getPathway } from "@/lib/data";
import { formatDate, formatDateTime, compRange } from "@/lib/format";
import PrintButton from "./PrintButton";
import type { Industry, Skill, TargetRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candidate Report — Skillosophy",
};

// ── Small helpers ─────────────────────────────────────────────────────────────

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 mb-3 border-b border-gray-300 pb-1 text-base font-bold uppercase tracking-widest text-gray-500">
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 text-sm font-semibold text-gray-800">{children}</h3>;
}

function SkillTag({ skill }: { skill: Skill }) {
  const dot =
    skill.strength === "Expert"
      ? "bg-emerald-500"
      : skill.strength === "Proficient"
        ? "bg-blue-500"
        : skill.strength === "Competent"
          ? "bg-amber-400"
          : "bg-gray-300";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {skill.name}
    </span>
  );
}

function IndustryBlock({ ind }: { ind: Industry }) {
  return (
    <div className="mb-3 rounded-lg border border-gray-200 p-3">
      <div className="flex flex-wrap items-start justify-between gap-1">
        <p className="text-sm font-semibold">{ind.name}</p>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ind.type === "Non-Traditional" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
          {ind.type}
        </span>
      </div>
      <p className="mt-1 text-xs text-gray-600">{ind.whyItFits}</p>
      {ind.comp && <p className="mt-1 text-xs text-gray-500">Comp: {compRange(ind.comp)}</p>}
    </div>
  );
}

function RoleBlock({ role }: { role: TargetRole }) {
  return (
    <div className="mb-2 flex flex-wrap items-start justify-between gap-1 rounded-lg border border-gray-200 p-3">
      <div>
        <p className="text-sm font-semibold">{role.title}</p>
        <p className="mt-0.5 text-xs text-gray-600">{role.whySuited}</p>
      </div>
      {role.comp && <p className="shrink-0 text-xs text-gray-500">{compRange(role.comp)}</p>}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="mb-1">
      <span className="text-xs font-semibold text-gray-500">{label}: </span>
      <span className="text-xs text-gray-800">{value}</span>
    </div>
  );
}

function NoteBox({ title, note }: { title?: string; note: string }) {
  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
      {title && <p className="text-xs font-semibold text-amber-700">{title}</p>}
      <p className="mt-0.5 text-xs text-amber-900 whitespace-pre-wrap">{note}</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.accountType !== "org_member") redirect("/");

  const { id } = await params;
  const isNewcomerOrg = session.orgType === "newcomer";

  const [result, notes, pathway] = await Promise.all([
    getCandidate(session, id),
    listCandidateNotes(id, session),
    isNewcomerOrg ? getPathway(id, session) : Promise.resolve(null),
  ]);
  if (!result) notFound();

  const { summary, report } = result;
  if (!report) notFound();

  const generalNotes = notes.filter((n) => !n.section);
  const sectionNotes = pathway?.sectionNotes ?? {};

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 20mm 18mm; size: A4; }
          .print-hidden { display: none !important; }
        }
        body { font-family: system-ui, -apple-system, sans-serif; }
      `}</style>

      <div className="mx-auto max-w-3xl px-6 py-8 text-gray-900">
        <PrintButton />

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b-2 border-gray-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold">{report.contact.name}</h1>
            {report.contact.headline && (
              <p className="mt-1 text-base text-gray-600">{report.contact.headline}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
              {report.contact.location && <span>{report.contact.location}</span>}
              {report.contact.email && <span>{report.contact.email}</span>}
              {report.contact.phone && <span>{report.contact.phone}</span>}
            </div>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>Uploaded {formatDateTime(summary.uploadedAt)}</p>
            {summary.meetingDate && <p>Meeting {formatDate(summary.meetingDate)}</p>}
            <p className="mt-1 font-semibold text-gray-600">{report.careerStage}</p>
          </div>
        </div>

        {/* Headline stats */}
        {report.headlineStats.length > 0 && (
          <>
            <Heading>At a glance</Heading>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {report.headlineStats.map((stat, i) => (
                <div key={i} className="rounded-lg border border-gray-200 p-3 text-center">
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs font-semibold text-gray-600">{stat.label}</p>
                  <p className="text-xs text-gray-400">{stat.sublabel}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Skills */}
        <Heading>Skills</Heading>
        {report.skills.hard.length > 0 && (
          <div className="mb-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Hard skills</p>
            <div className="flex flex-wrap gap-1.5">
              {report.skills.hard.map((s, i) => <SkillTag key={i} skill={s} />)}
            </div>
          </div>
        )}
        {report.skills.soft.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Soft skills</p>
            <div className="flex flex-wrap gap-1.5">
              {report.skills.soft.map((s, i) => <SkillTag key={i} skill={s} />)}
            </div>
          </div>
        )}

        {/* Industries */}
        {report.industries.length > 0 && (
          <>
            <Heading>Industry fit</Heading>
            {report.industries.map((ind, i) => <IndustryBlock key={i} ind={ind} />)}
          </>
        )}

        {/* Target roles */}
        {report.targetRoles.length > 0 && (
          <>
            <Heading>Target roles</Heading>
            {report.targetRoles.map((r, i) => <RoleBlock key={i} role={r} />)}
          </>
        )}

        {/* Keywords */}
        {report.keywords.length > 0 && (
          <>
            <Heading>Job search keywords</Heading>
            {report.keywords.map((kg, i) => (
              <div key={i} className="mb-3">
                <p className="mb-1 text-xs font-semibold text-gray-700">{kg.industry}</p>
                <p className="text-xs text-gray-600">{kg.terms.join(" · ")}</p>
              </div>
            ))}
          </>
        )}

        {/* Recruiter notes */}
        {report.recruiterNotes.length > 0 && (
          <>
            <Heading>Recruiter notes</Heading>
            <ul className="space-y-1.5">
              {report.recruiterNotes.map((n, i) => (
                <li key={i} className={`text-sm ${n.tone === "caution" ? "text-amber-700" : "text-gray-700"}`}>
                  {n.tone === "caution" ? "⚠ " : "✓ "}{n.text}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* General caseworker notes */}
        {generalNotes.length > 0 && (
          <>
            <Heading>Caseworker notes</Heading>
            <ul className="space-y-2">
              {generalNotes.map((n) => (
                <li key={n.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-900 whitespace-pre-wrap">{n.content}</p>
                  {n.createdByName && <p className="mt-1 text-xs text-amber-600">— {n.createdByName}</p>}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Part 6 — Newcomer Pathway */}
        {isNewcomerOrg && pathway && (
          <>
            <Heading>Newcomer Credential Pathway (Part 6)</Heading>

            {pathway.regulatoryStatus && (
              <div className="mb-5">
                <SubHeading>6A — Profession & Regulatory Status</SubHeading>
                <Field label="Profession" value={pathway.regulatoryStatus.profession} />
                <Field label="Country of training" value={pathway.regulatoryStatus.countryOfTraining} />
                <Field label="Regulated in Canada" value={pathway.regulatoryStatus.regulatedStatus} />
                <Field label="Target provinces" value={pathway.regulatoryStatus.targetProvinces.join(", ")} />
                {sectionNotes["6a"] && <NoteBox title="Caseworker note" note={sectionNotes["6a"]} />}
              </div>
            )}

            {pathway.eca && (
              <div className="mb-5">
                <SubHeading>6B — Educational Credential Assessment</SubHeading>
                <Field label="Organization" value={pathway.eca.organization} />
                <Field label="URL" value={pathway.eca.url} />
                <Field label="Cost" value={pathway.eca.estimatedCostCAD} />
                <Field label="Processing time" value={pathway.eca.processingTime} />
                {pathway.eca.documentsRequired.length > 0 && (
                  <Field label="Documents" value={pathway.eca.documentsRequired.join(", ")} />
                )}
                {sectionNotes["6b"] && <NoteBox title="Caseworker note" note={sectionNotes["6b"]} />}
              </div>
            )}

            {pathway.licensing.length > 0 && (
              <div className="mb-5">
                <SubHeading>6C — Licensing & Registration</SubHeading>
                {pathway.licensing.map((prov, i) => (
                  <div key={i} className="mb-3 rounded-lg border border-gray-200 p-3">
                    <p className="text-xs font-semibold text-gray-800">{prov.province}</p>
                    <Field label="Regulatory body" value={prov.regulatoryBody} />
                    <Field label="Exam" value={prov.examName} />
                    <Field label="Exam fee" value={prov.examFee} />
                    <Field label="App fee" value={prov.applicationFee} />
                    <Field label="Annual renewal" value={prov.annualRenewal} />
                  </div>
                ))}
                {sectionNotes["6c"] && <NoteBox title="Caseworker note" note={sectionNotes["6c"]} />}
              </div>
            )}

            {pathway.language && (
              <div className="mb-5">
                <SubHeading>6D — Language Proficiency</SubHeading>
                <Field label="Test" value={pathway.language.recommendedTest} />
                <Field label="Minimum scores" value={pathway.language.minimumScores} />
                <Field label="Fee" value={pathway.language.feeCAD} />
                <Field label="Validity" value={pathway.language.validity} />
                <Field label="Exemption" value={pathway.language.exemptionNote} />
                {sectionNotes["6d"] && <NoteBox title="Caseworker note" note={sectionNotes["6d"]} />}
              </div>
            )}

            {pathway.bridging && (
              <div className="mb-5">
                <SubHeading>6E — Bridging Programs</SubHeading>
                <Field label="Required" value={pathway.bridging.required} />
                {pathway.bridging.reason && <p className="text-xs text-gray-600 mb-2">{pathway.bridging.reason}</p>}
                {pathway.bridging.programs.map((prog, i) => (
                  <div key={i} className="mb-2 rounded border border-gray-200 p-2">
                    <p className="text-xs font-semibold">{prog.name}</p>
                    <Field label="Institution" value={prog.institution} />
                    <Field label="Duration" value={prog.duration} />
                    <Field label="Cost" value={prog.costCAD} />
                  </div>
                ))}
                {sectionNotes["6e"] && <NoteBox title="Caseworker note" note={sectionNotes["6e"]} />}
              </div>
            )}

            {pathway.fullPath && (
              <div className="mb-5">
                <SubHeading>6F — Full Pathway Step by Step</SubHeading>
                <div className="mb-3 flex flex-wrap gap-4 rounded-lg border border-gray-200 p-3 text-xs">
                  <span><strong>From:</strong> {pathway.fullPath.startingPoint}</span>
                  <span>→</span>
                  <span><strong>To:</strong> {pathway.fullPath.targetRole}</span>
                  <span><strong>Timeline:</strong> {pathway.fullPath.totalTimeline}</span>
                  <span><strong>Total cost:</strong> {pathway.fullPath.totalCostCAD}</span>
                </div>
                <ol className="space-y-2">
                  {pathway.fullPath.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-white mt-0.5">{i + 1}</span>
                      <div>
                        <p className="text-xs font-semibold">{step.action}</p>
                        <p className="text-xs text-gray-500">{step.timeline} · {step.costCAD}</p>
                        {step.explanation && <p className="text-xs text-gray-600">{step.explanation}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
                {sectionNotes["6f"] && <NoteBox title="Caseworker note" note={sectionNotes["6f"]} />}
              </div>
            )}

            {pathway.superiorRoles.length > 0 && (
              <div className="mb-5">
                <SubHeading>6G — Superior Role Pathway</SubHeading>
                {pathway.superiorRoles.map((role, i) => (
                  <div key={i} className="mb-3 rounded-lg border border-gray-200 p-3">
                    <p className="text-xs font-semibold">{role.title}</p>
                    <Field label="Timeline from registration" value={role.timelineFromRegistration} />
                    <Field label="Equivalent role comp" value={role.equivalentRoleComp} />
                    <Field label="Superior role comp" value={role.superiorRoleComp} />
                  </div>
                ))}
                {sectionNotes["6g"] && <NoteBox title="Caseworker note" note={sectionNotes["6g"]} />}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-10 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
          <p>Generated by Skillosophy · {new Date().toLocaleDateString("en-CA")}</p>
          <p className="mt-1">Compensation figures are model estimates based on Canadian market knowledge.</p>
        </div>
      </div>
    </>
  );
}
