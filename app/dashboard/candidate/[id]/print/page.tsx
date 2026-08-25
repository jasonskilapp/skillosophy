import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCandidate, listCandidateNotes, getPathway } from "@/lib/data";
import { formatDate, formatDateTime, compRange } from "@/lib/format";
import PrintButton from "./PrintButton";
import type { Industry, NewcomerPathway, Skill, TargetRole } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Career Analysis Report — Skillosophy" };

// ── Design tokens (kept in JS so they're available server-side) ───────────────
const C = {
  navy:    "#0f1e3c",
  teal:    "#0d7a6b",
  tealSoft:"#e6f4f2",
  slate:   "#475569",
  border:  "#cbd5e1",
  soft:    "#f8fafc",
  amber:   "#92400e",
  amberBg: "#fffbeb",
  amberBorder: "#fde68a",
  positive:"#065f46",
  caution: "#92400e",
};

const STRENGTH_COLOR: Record<string, string> = {
  Expert:      "#0d7a6b",
  Proficient:  "#1d4ed8",
  Competent:   "#d97706",
  Foundational:"#64748b",
};

// ── Reusable layout pieces ────────────────────────────────────────────────────

function SectionTitle({ number, title }: { number?: string; title: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      borderBottom: `2px solid ${C.teal}`, paddingBottom: 6,
      marginTop: 28, marginBottom: 14,
    }}>
      {number && (
        <span style={{
          background: C.teal, color: "#fff", borderRadius: 4,
          fontSize: 10, fontWeight: 700, padding: "2px 7px", letterSpacing: 0.5,
        }}>{number}</span>
      )}
      <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.navy, letterSpacing: 0.3, textTransform: "uppercase" }}>
        {title}
      </h2>
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 9, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
      {children}
    </p>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", ...style }}>
      {children}
    </div>
  );
}

function CaseworkerNote({ note }: { note: string }) {
  if (!note?.trim()) return null;
  return (
    <div style={{
      marginTop: 10, background: C.amberBg, border: `1px solid ${C.amberBorder}`,
      borderLeft: `3px solid #f59e0b`, borderRadius: 6, padding: "8px 12px",
    }}>
      <p style={{ fontSize: 9, fontWeight: 700, color: C.amber, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>
        Caseworker note
      </p>
      <p style={{ fontSize: 11, color: C.amber, lineHeight: 1.5, whiteSpace: "pre-wrap", margin: 0 }}>{note}</p>
    </div>
  );
}

function SkillRow({ skill }: { skill: Skill }) {
  const color = STRENGTH_COLOR[skill.strength] ?? C.slate;
  const bars = ["Foundational","Competent","Proficient","Expert"].indexOf(skill.strength) + 1;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.soft}` }}>
      <span style={{ fontSize: 11, color: C.navy }}>{skill.name}</span>
      <span style={{ display: "flex", gap: 2, alignItems: "center" }}>
        {[1,2,3,4].map(i => (
          <span key={i} style={{
            display: "inline-block", width: 8, height: 8, borderRadius: 2,
            background: i <= bars ? color : C.border,
          }} />
        ))}
      </span>
    </div>
  );
}

function IndustryRow({ ind }: { ind: Industry }) {
  const tag = ind.type === "Non-Traditional";
  return (
    <Card style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, margin: 0 }}>{ind.name}</p>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap",
          background: tag ? "#eff6ff" : C.tealSoft,
          color: tag ? "#1d4ed8" : C.teal,
          border: `1px solid ${tag ? "#bfdbfe" : "#a7f3d0"}`,
        }}>{tag ? "Non-Traditional" : "Traditional"}</span>
      </div>
      <p style={{ fontSize: 11, color: C.slate, lineHeight: 1.5, margin: "0 0 4px" }}>{ind.whyItFits}</p>
      {ind.comp && <p style={{ fontSize: 10, color: C.teal, fontWeight: 600, margin: 0 }}>{compRange(ind.comp)} CAD</p>}
    </Card>
  );
}

function RoleRow({ role }: { role: TargetRole }) {
  return (
    <Card style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, margin: "0 0 3px" }}>{role.title}</p>
          <p style={{ fontSize: 11, color: C.slate, lineHeight: 1.5, margin: 0 }}>{role.whySuited}</p>
        </div>
        {role.comp && (
          <p style={{ fontSize: 11, color: C.teal, fontWeight: 600, whiteSpace: "nowrap", margin: 0 }}>{compRange(role.comp)}</p>
        )}
      </div>
    </Card>
  );
}

function PathwayStep({ step, index }: { step: { action: string; timeline: string; costCAD: string; explanation: string }; index: number }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
      <div style={{
        width: 24, height: 24, borderRadius: "50%", background: C.teal,
        color: "#fff", fontSize: 11, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2,
      }}>{index + 1}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, margin: "0 0 2px" }}>{step.action}</p>
        <p style={{ fontSize: 10, color: C.teal, margin: "0 0 3px" }}>{step.timeline} · {step.costCAD}</p>
        {step.explanation && <p style={{ fontSize: 11, color: C.slate, margin: 0, lineHeight: 1.5 }}>{step.explanation}</p>}
      </div>
    </div>
  );
}

function PathwaySect({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <div style={{ marginBottom: 20, pageBreakInside: "avoid" }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: C.teal, textTransform: "uppercase",
        letterSpacing: 0.5, borderLeft: `3px solid ${C.teal}`, paddingLeft: 8, margin: "0 0 8px",
      }}>{title}</p>
      {children}
      {note && <CaseworkerNote note={note} />}
    </div>
  );
}

function FieldLine({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <p style={{ fontSize: 11, margin: "0 0 3px", color: C.slate }}>
      <strong style={{ color: C.navy }}>{label}: </strong>{value}
    </p>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
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

  const generalNotes = notes.filter(n => !n.section);
  const sectionNotes = pathway?.sectionNotes ?? {};

  const hardSkills  = report.skills?.hard  ?? [];
  const softSkills  = report.skills?.soft  ?? [];
  const midHard     = Math.ceil(hardSkills.length / 2);
  const midSoft     = Math.ceil(softSkills.length / 2);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Inter', system-ui, sans-serif; background: #fff; color: #0f1e3c; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          @page { margin: 15mm 16mm; size: A4; }
          .no-print { display: none !important; }
          h2, .section-title { page-break-after: avoid; }
        }
      `}</style>

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "24px 24px 48px" }}>

        <PrintButton />

        {/* ── Cover header ── */}
        <div style={{
          background: C.navy, color: "#fff", borderRadius: 10,
          padding: "28px 32px", marginBottom: 24,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 8px" }}>
                Career Analysis Report
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px", lineHeight: 1.2 }}>
                {report.contact.name}
              </h1>
              {report.contact.headline && (
                <p style={{ fontSize: 13, color: "#cbd5e1", margin: "0 0 12px", fontStyle: "italic" }}>
                  {report.contact.headline}
                </p>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: 11, color: "#94a3b8" }}>
                {report.contact.location && <span>📍 {report.contact.location}</span>}
                {report.contact.email    && <span>✉ {report.contact.email}</span>}
                {report.contact.phone    && <span>📞 {report.contact.phone}</span>}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{
                background: C.teal, color: "#fff", borderRadius: 6,
                padding: "6px 14px", fontSize: 12, fontWeight: 700, marginBottom: 8,
              }}>{report.careerStage}</div>
              <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>
                Prepared {new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
              </p>
              {summary.uploadedAt && (
                <p style={{ fontSize: 10, color: "#64748b", margin: "2px 0 0" }}>
                  Uploaded {formatDateTime(summary.uploadedAt)}
                </p>
              )}
              {summary.meetingDate && (
                <p style={{ fontSize: 10, color: "#64748b", margin: "2px 0 0" }}>
                  Meeting {formatDate(summary.meetingDate)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Headline stats ── */}
        {report.headlineStats.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(report.headlineStats.length, 4)}, 1fr)`, gap: 12, marginBottom: 8 }}>
            {report.headlineStats.map((stat, i) => (
              <div key={i} style={{
                border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", textAlign: "center",
                borderTop: `3px solid ${C.teal}`,
              }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: C.navy, margin: "0 0 3px" }}>{stat.value}</p>
                <p style={{ fontSize: 10, fontWeight: 600, color: C.teal, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 2px" }}>{stat.label}</p>
                <p style={{ fontSize: 10, color: C.slate, margin: 0 }}>{stat.sublabel}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Skills ── */}
        {(hardSkills.length > 0 || softSkills.length > 0) && (
          <>
            <SectionTitle title="Skills Profile" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {hardSkills.length > 0 && (
                <div>
                  <SubLabel>Hard skills</SubLabel>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                    <div>
                      {hardSkills.slice(0, midHard).map((s, i) => <SkillRow key={i} skill={s} />)}
                    </div>
                    <div>
                      {hardSkills.slice(midHard).map((s, i) => <SkillRow key={i} skill={s} />)}
                    </div>
                  </div>
                </div>
              )}
              {softSkills.length > 0 && (
                <div>
                  <SubLabel>Soft skills</SubLabel>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                    <div>
                      {softSkills.slice(0, midSoft).map((s, i) => <SkillRow key={i} skill={s} />)}
                    </div>
                    <div>
                      {softSkills.slice(midSoft).map((s, i) => <SkillRow key={i} skill={s} />)}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Strength legend */}
            <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
              {Object.entries(STRENGTH_COLOR).map(([label, color]) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: C.slate }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: color }} />
                  {label}
                </span>
              ))}
            </div>
          </>
        )}

        {/* ── Industry fit ── */}
        {report.industries.length > 0 && (
          <>
            <SectionTitle title="Industry Fit" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {report.industries.map((ind, i) => <IndustryRow key={i} ind={ind} />)}
            </div>
          </>
        )}

        {/* ── Target roles ── */}
        {report.targetRoles.length > 0 && (
          <>
            <SectionTitle title="Target Roles" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {report.targetRoles.map((r, i) => <RoleRow key={i} role={r} />)}
            </div>
          </>
        )}

        {/* ── Keywords ── */}
        {report.keywords.length > 0 && (
          <>
            <SectionTitle title="Job Search Keywords" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
              {report.keywords.map((kg, i) => (
                <div key={i}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 3px" }}>{kg.industry}</p>
                  <p style={{ fontSize: 10, color: C.slate, lineHeight: 1.6, margin: "0 0 8px" }}>{kg.terms.join("  ·  ")}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Recruiter notes ── */}
        {report.recruiterNotes.length > 0 && (
          <>
            <SectionTitle title="Advisor Notes" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
              {report.recruiterNotes.map((n, i) => (
                <div key={i} style={{
                  display: "flex", gap: 8, alignItems: "flex-start",
                  padding: "8px 10px", borderRadius: 6,
                  background: n.tone === "positive" ? C.tealSoft : C.amberBg,
                  border: `1px solid ${n.tone === "positive" ? "#a7f3d0" : C.amberBorder}`,
                }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{n.tone === "positive" ? "✓" : "⚠"}</span>
                  <p style={{ fontSize: 11, margin: 0, lineHeight: 1.5, color: n.tone === "positive" ? C.positive : C.caution }}>{n.text}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── General caseworker notes ── */}
        {generalNotes.length > 0 && (
          <>
            <SectionTitle title="Caseworker Notes" />
            {generalNotes.map(n => (
              <CaseworkerNote key={n.id} note={`${n.content}${n.createdByName ? `\n— ${n.createdByName}` : ""}`} />
            ))}
          </>
        )}

        {/* ── Part 6: Newcomer Pathway ── */}
        {isNewcomerOrg && pathway && (
          <>
            <div style={{ pageBreakBefore: "always" }} />
            <SectionTitle title="Newcomer Credential & Licensing Pathway" />

            {pathway.regulatoryStatus && (
              <PathwaySect title="6A — Profession & Regulatory Status" note={sectionNotes["6a"]}>
                <Card>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <FieldLine label="Profession" value={pathway.regulatoryStatus.profession} />
                    <FieldLine label="Country of training" value={pathway.regulatoryStatus.countryOfTraining} />
                    <FieldLine label="Regulated in Canada" value={
                      pathway.regulatoryStatus.regulatedStatus === "provincial" ? "Yes — Provincially"
                      : pathway.regulatoryStatus.regulatedStatus === "federal" ? "Yes — Federally"
                      : "No — Unregulated"
                    } />
                    <FieldLine label="Target provinces" value={pathway.regulatoryStatus.targetProvinces.join(", ")} />
                  </div>
                </Card>
              </PathwaySect>
            )}

            {pathway.eca && (
              <PathwaySect title="6B — Educational Credential Assessment" note={sectionNotes["6b"]}>
                <Card>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <FieldLine label="Organization" value={pathway.eca.organization} />
                    <FieldLine label="URL" value={pathway.eca.url} />
                    <FieldLine label="Estimated cost" value={pathway.eca.estimatedCostCAD} />
                    <FieldLine label="Processing time" value={pathway.eca.processingTime} />
                  </div>
                  {pathway.eca.reason && <p style={{ fontSize: 11, color: C.slate, marginTop: 6, lineHeight: 1.5 }}>{pathway.eca.reason}</p>}
                  {pathway.eca.documentsRequired.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      <SubLabel>Documents required</SubLabel>
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {pathway.eca.documentsRequired.map((d, i) => (
                          <li key={i} style={{ fontSize: 11, color: C.slate, lineHeight: 1.6 }}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              </PathwaySect>
            )}

            {pathway.licensing.length > 0 && (
              <PathwaySect title="6C — Licensing & Registration" note={sectionNotes["6c"]}>
                <div style={{ display: "grid", gridTemplateColumns: pathway.licensing.length > 1 ? "1fr 1fr" : "1fr", gap: 10 }}>
                  {pathway.licensing.map((prov, i) => (
                    <Card key={i}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, margin: "0 0 6px" }}>{prov.province}</p>
                      <FieldLine label="Regulatory body" value={prov.regulatoryBody} />
                      <FieldLine label="Licensing exam" value={prov.examName} />
                      <FieldLine label="Exam fee" value={prov.examFee} />
                      <FieldLine label="Application fee" value={prov.applicationFee} />
                      <FieldLine label="Annual renewal" value={prov.annualRenewal} />
                      {prov.registrationRequirements.length > 0 && (
                        <div style={{ marginTop: 6 }}>
                          <SubLabel>Requirements</SubLabel>
                          <ul style={{ margin: 0, paddingLeft: 16 }}>
                            {prov.registrationRequirements.map((r, j) => (
                              <li key={j} style={{ fontSize: 10, color: C.slate, lineHeight: 1.6 }}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </PathwaySect>
            )}

            {pathway.language && (
              <PathwaySect title="6D — Language Proficiency" note={sectionNotes["6d"]}>
                <Card>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    <FieldLine label="Recommended test" value={pathway.language.recommendedTest} />
                    <FieldLine label="Minimum scores" value={pathway.language.minimumScores} />
                    <FieldLine label="Fee" value={pathway.language.feeCAD} />
                    <FieldLine label="Validity" value={pathway.language.validity} />
                  </div>
                  {pathway.language.exemptionNote && (
                    <p style={{ fontSize: 11, color: C.slate, marginTop: 6, lineHeight: 1.5, fontStyle: "italic" }}>{pathway.language.exemptionNote}</p>
                  )}
                </Card>
              </PathwaySect>
            )}

            {pathway.bridging && (
              <PathwaySect title="6E — Bridging Programs" note={sectionNotes["6e"]}>
                <div style={{
                  display: "inline-block", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, marginBottom: 8,
                  background: pathway.bridging.required === "yes" ? "#fef2f2" : pathway.bridging.required === "unlikely" ? C.tealSoft : "#fffbeb",
                  color: pathway.bridging.required === "yes" ? "#991b1b" : pathway.bridging.required === "unlikely" ? C.teal : "#92400e",
                  border: `1px solid ${pathway.bridging.required === "yes" ? "#fecaca" : pathway.bridging.required === "unlikely" ? "#a7f3d0" : C.amberBorder}`,
                }}>
                  {pathway.bridging.required === "yes" ? "Required" : pathway.bridging.required === "unlikely" ? "Unlikely needed" : "Possibly required"}
                </div>
                {pathway.bridging.reason && <p style={{ fontSize: 11, color: C.slate, margin: "0 0 10px", lineHeight: 1.5 }}>{pathway.bridging.reason}</p>}
                {pathway.bridging.programs.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {pathway.bridging.programs.map((prog, i) => (
                      <Card key={i}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, margin: "0 0 4px" }}>{prog.name}</p>
                        <p style={{ fontSize: 10, color: C.slate, margin: "0 0 6px" }}>{prog.institution} · {prog.province}</p>
                        <FieldLine label="Delivery" value={prog.delivery} />
                        <FieldLine label="Duration" value={prog.duration} />
                        <FieldLine label="Cost" value={prog.costCAD} />
                        {prog.gapAddressed && <p style={{ fontSize: 10, color: C.teal, margin: "4px 0 0", fontStyle: "italic" }}>Closes: {prog.gapAddressed}</p>}
                      </Card>
                    ))}
                  </div>
                )}
              </PathwaySect>
            )}

            {pathway.fullPath && (
              <PathwaySect title="6F — Full Pathway Step by Step" note={sectionNotes["6f"]}>
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: 16,
                  background: C.navy, color: "#fff", borderRadius: 8, padding: "12px 16px", marginBottom: 14,
                }}>
                  <div>
                    <p style={{ fontSize: 9, color: "#94a3b8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>Starting point</p>
                    <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{pathway.fullPath.startingPoint}</p>
                  </div>
                  <div style={{ alignSelf: "center", color: "#94a3b8", fontSize: 16 }}>→</div>
                  <div>
                    <p style={{ fontSize: 9, color: "#94a3b8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>Target role</p>
                    <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{pathway.fullPath.targetRole}</p>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <p style={{ fontSize: 9, color: "#94a3b8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>Timeline</p>
                    <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{pathway.fullPath.totalTimeline}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 9, color: "#94a3b8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>Total cost</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#6ee7b7", margin: 0 }}>{pathway.fullPath.totalCostCAD}</p>
                  </div>
                </div>
                {pathway.fullPath.steps.map((step, i) => <PathwayStep key={i} step={step} index={i} />)}
              </PathwaySect>
            )}

            {pathway.superiorRoles.length > 0 && (
              <PathwaySect title="6G — Superior Role Pathway" note={sectionNotes["6g"]}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {pathway.superiorRoles.map((role, i) => (
                    <Card key={i}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: C.navy, margin: "0 0 6px" }}>{role.title}</p>
                      <FieldLine label="Timeline from registration" value={role.timelineFromRegistration} />
                      {role.eligibilityPath.length > 0 && (
                        <div style={{ margin: "6px 0" }}>
                          <SubLabel>Eligibility path</SubLabel>
                          <ul style={{ margin: 0, paddingLeft: 16 }}>
                            {role.eligibilityPath.map((e, j) => (
                              <li key={j} style={{ fontSize: 10, color: C.slate, lineHeight: 1.6 }}>{e}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                        <div>
                          <p style={{ fontSize: 9, color: C.slate, margin: "0 0 1px" }}>Equivalent role</p>
                          <p style={{ fontSize: 11, fontWeight: 600, color: C.slate, margin: 0 }}>{role.equivalentRoleComp}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 9, color: C.slate, margin: "0 0 1px" }}>Superior role</p>
                          <p style={{ fontSize: 11, fontWeight: 700, color: C.teal, margin: 0 }}>{role.superiorRoleComp}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </PathwaySect>
            )}
          </>
        )}

        {/* ── Footer ── */}
        <div style={{
          marginTop: 40, paddingTop: 16, borderTop: `2px solid ${C.navy}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.navy, margin: "0 0 2px" }}>Skillosophy</p>
            <p style={{ fontSize: 9, color: C.slate, margin: 0 }}>Career & Credential Intelligence Platform</p>
          </div>
          <p style={{ fontSize: 9, color: C.slate, textAlign: "right", margin: 0 }}>
            Compensation figures are model estimates based on Canadian market knowledge.<br />
            Prepared {new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>
    </>
  );
}
