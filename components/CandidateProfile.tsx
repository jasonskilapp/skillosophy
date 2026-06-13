import type {
  CandidateReport,
  Industry,
  KeywordGroup,
  RecruiterNote,
  Skill,
  TargetRole,
} from "@/lib/types";
import { compRange, initials, money, strengthMeta } from "@/lib/format";
import {
  CheckIcon,
  IndustryIcon,
  InfoIcon,
  NotesIcon,
  SkillsIcon,
  TagIcon,
  TargetIcon,
} from "./icons";

/** The full recruiter-facing candidate dashboard, rendered from a report. */
export default function CandidateProfile({ report }: { report: CandidateReport }) {
  return (
    <div className="space-y-7">
      <ProfileHeader report={report} />
      <StatCards report={report} />
      <SkillsProfile report={report} />
      <IndustryFit report={report} />
      <TargetRoles report={report} />
      <Keywords report={report} />
      <RecruiterNotes report={report} />
      {report.estimatesNote && (
        <p className="text-xs text-muted px-1">{report.estimatesNote}</p>
      )}
    </div>
  );
}

function SectionHeading({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="text-muted">{icon}</span>
      <h2 className="text-lg font-semibold tracking-tight">{children}</h2>
    </div>
  );
}

function ProfileHeader({ report }: { report: CandidateReport }) {
  const { contact, careerStage } = report;
  return (
    <header className="flex flex-wrap items-start gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary text-lg font-semibold">
        {initials(contact.name)}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight">{contact.name}</h1>
        <p className="mt-0.5 text-sm text-muted">
          {[contact.location, contact.email, contact.phone]
            .filter(Boolean)
            .join("  ·  ")}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        {contact.headline && (
          <span className="rounded-full bg-accent-blue-soft px-3 py-1.5 text-xs font-medium text-accent-blue">
            {contact.headline}
          </span>
        )}
        <span className="text-xs text-muted">Career stage · {careerStage}</span>
      </div>
    </header>
  );
}

function StatCards({ report }: { report: CandidateReport }) {
  if (!report.headlineStats?.length) return null;
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {report.headlineStats.map((s, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-muted">{s.label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight">{s.value}</p>
          <p className="mt-0.5 text-xs text-muted">{s.sublabel}</p>
        </div>
      ))}
    </section>
  );
}

function SkillRow({ skill }: { skill: Skill }) {
  const meta = strengthMeta(skill.strength);
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 py-2">
      <span className="text-sm font-medium" title={skill.evidence ?? undefined}>
        {skill.name}
      </span>
      <span
        className="justify-self-end rounded-full px-2.5 py-0.5 text-xs font-medium"
        style={{ backgroundColor: meta.pillBg, color: meta.pillText }}
      >
        {skill.strength}
      </span>
      <div className="col-span-2 h-1.5 w-full overflow-hidden rounded-full bg-track">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.round(meta.fraction * 100)}%`,
            backgroundColor: meta.color,
          }}
        />
      </div>
    </div>
  );
}

function SkillCard({ title, skills }: { title: string; skills: Skill[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </h3>
      <div className="divide-y divide-border">
        {skills.map((s, i) => (
          <SkillRow key={i} skill={s} />
        ))}
      </div>
    </div>
  );
}

function SkillsProfile({ report }: { report: CandidateReport }) {
  return (
    <section>
      <SectionHeading icon={<SkillsIcon className="h-5 w-5" />}>
        Skills profile
      </SectionHeading>
      <div className="grid gap-4 md:grid-cols-2">
        <SkillCard title="Hard skills" skills={report.skills.hard} />
        <SkillCard title="Soft skills" skills={report.skills.soft} />
      </div>
    </section>
  );
}

function CompFigures({ industry }: { industry: Industry }) {
  if (!industry.comp) return null;
  const { low, median, high } = industry.comp;
  return (
    <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
      <Figure value={money(low)} label="Low" />
      {median != null && <Figure value={money(median)} label="Median" />}
      <Figure value={money(high)} label="High" />
    </div>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-bold tracking-tight">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

function IndustryCard({ industry }: { industry: Industry }) {
  const traditional = industry.type === "Traditional";
  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug">{industry.name}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
            traditional
              ? "bg-primary-soft text-primary"
              : "bg-accent-blue-soft text-accent-blue"
          }`}
        >
          {traditional ? "Traditional" : "Non-traditional"}
        </span>
      </div>
      <p className="text-sm text-foreground/80">{industry.whyItFits}</p>
      {industry.demandSignal && (
        <p className="mt-3 text-xs text-muted">{industry.demandSignal}</p>
      )}
      <div className="mt-auto">
        <CompFigures industry={industry} />
      </div>
    </div>
  );
}

function IndustryFit({ report }: { report: CandidateReport }) {
  if (!report.industries?.length) return null;
  return (
    <section>
      <SectionHeading icon={<IndustryIcon className="h-5 w-5" />}>
        Industry fit
      </SectionHeading>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {report.industries.map((ind, i) => (
          <IndustryCard key={i} industry={ind} />
        ))}
      </div>
    </section>
  );
}

function RoleCard({ role }: { role: TargetRole }) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold leading-snug">{role.title}</h3>
      <p className="mt-2 text-sm text-foreground/80">{role.whySuited}</p>
      {role.comp && (
        <p className="mt-3 text-sm font-semibold text-primary">
          {compRange(role.comp)}
        </p>
      )}
    </div>
  );
}

function TargetRoles({ report }: { report: CandidateReport }) {
  if (!report.targetRoles?.length) return null;
  return (
    <section>
      <SectionHeading icon={<TargetIcon className="h-5 w-5" />}>
        Target roles
      </SectionHeading>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {report.targetRoles.map((r, i) => (
          <RoleCard key={i} role={r} />
        ))}
      </div>
    </section>
  );
}

function KeywordBlock({ group }: { group: KeywordGroup }) {
  return (
    <div className="rounded-xl bg-foundational-soft p-4">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {group.industry}
      </h3>
      <div className="flex flex-wrap gap-2">
        {group.terms.map((t, i) => (
          <span
            key={i}
            className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-foreground/90"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function Keywords({ report }: { report: CandidateReport }) {
  if (!report.keywords?.length) return null;
  return (
    <section>
      <SectionHeading icon={<TagIcon className="h-5 w-5" />}>
        Top job-search keywords
      </SectionHeading>
      <div className="space-y-3">
        {report.keywords.map((g, i) => (
          <KeywordBlock key={i} group={g} />
        ))}
      </div>
    </section>
  );
}

function NoteRow({ note }: { note: RecruiterNote }) {
  const positive = note.tone === "positive";
  return (
    <li className="flex gap-3">
      <span
        className={`mt-0.5 shrink-0 ${positive ? "text-primary" : "text-proficient"}`}
      >
        {positive ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          <InfoIcon className="h-4 w-4" />
        )}
      </span>
      <p className="text-sm text-foreground/85">{note.text}</p>
    </li>
  );
}

function RecruiterNotes({ report }: { report: CandidateReport }) {
  if (!report.recruiterNotes?.length) return null;
  return (
    <section>
      <SectionHeading icon={<NotesIcon className="h-5 w-5" />}>
        Recruiter notes
      </SectionHeading>
      <ul className="space-y-3 rounded-xl border border-border bg-surface p-5">
        {report.recruiterNotes.map((n, i) => (
          <NoteRow key={i} note={n} />
        ))}
      </ul>
    </section>
  );
}
