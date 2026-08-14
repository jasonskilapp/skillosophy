"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { savePathwaySection } from "@/app/actions";
import { ChevronDownIcon } from "./icons";
import type {
  NewcomerPathway,
  PathwayBridgingProgram,
  PathwayProvinceLicensing,
  PathwayStep,
  PathwaySuperiorRole,
} from "@/lib/types";

type ActionResult = { ok?: boolean; error?: string };

// ── Shared helpers ────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <summary className="flex items-center justify-between gap-2.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none group-open:mb-4 px-3 py-2.5 -mx-3 rounded-lg bg-foundational-soft hover:bg-border transition-colors">
      <h2 className="text-lg font-semibold tracking-tight">{children}</h2>
      <ChevronDownIcon className="h-4 w-4 text-muted transition-transform duration-200 group-open:rotate-180" />
    </summary>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}

function EmptyState({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center">
      <p className="text-sm text-muted">No data yet.</p>
      <button
        onClick={onEdit}
        className="mt-2 text-sm font-medium text-primary hover:underline"
      >
        Add manually
      </button>
    </div>
  );
}

function SaveBar({
  state,
  isPending,
  onCancel,
}: {
  state: ActionResult;
  isPending: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-muted hover:text-foreground"
      >
        Cancel
      </button>
      {state.error && (
        <p className="text-sm text-rose-500">{state.error}</p>
      )}
    </div>
  );
}

function useSectionAction(candidateId: string, column: string, onSaved: () => void) {
  const [state, action, isPending] = useActionState<ActionResult, FormData>(
    savePathwaySection,
    {},
  );
  const didSave = useRef(false);

  useEffect(() => {
    if (state.ok && !didSave.current) {
      didSave.current = true;
      onSaved();
    }
    if (!state.ok) didSave.current = false;
  }, [state.ok, onSaved]);

  function submit(data: unknown) {
    const fd = new FormData();
    fd.set("candidateId", candidateId);
    fd.set("column", column);
    fd.set("data", JSON.stringify(data));
    action(fd);
  }

  return { state, isPending, submit };
}

// ── Editable list helpers ─────────────────────────────────────────────────────

function StringListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-xs text-muted hover:text-rose-500"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="text-xs font-medium text-primary hover:underline"
      >
        + Add item
      </button>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
      />
    </label>
  );
}

// ── 6A: Regulatory Status ─────────────────────────────────────────────────────

type RegStatus = NonNullable<NewcomerPathway["regulatoryStatus"]>;

function blankRegStatus(): RegStatus {
  return { profession: "", countryOfTraining: "", regulatedStatus: "", targetProvinces: [] };
}

function RegulatoryStatusSection({
  candidateId,
  data,
}: {
  candidateId: string;
  data: RegStatus | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RegStatus>(data ?? blankRegStatus());
  const { state, isPending, submit } = useSectionAction(candidateId, "regulatory_status", () => setEditing(false));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(draft);
  }

  return (
    <details open className="group">
      <SectionHeading>6A — Profession & Regulatory Status</SectionHeading>
      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Profession" value={draft.profession} onChange={(v) => setDraft({ ...draft, profession: v })} />
          <Input label="Country / Region of Training" value={draft.countryOfTraining} onChange={(v) => setDraft({ ...draft, countryOfTraining: v })} />
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Regulated in Canada</span>
            <select
              value={draft.regulatedStatus}
              onChange={(e) => setDraft({ ...draft, regulatedStatus: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">— Select —</option>
              <option value="provincial">Yes — Provincially</option>
              <option value="federal">Yes — Federally</option>
              <option value="unregulated">No — Unregulated</option>
            </select>
          </label>
          <div>
            <span className="mb-1 block text-xs font-medium text-muted">Target Provinces</span>
            <StringListEditor
              items={draft.targetProvinces}
              onChange={(v) => setDraft({ ...draft, targetProvinces: v })}
              placeholder="e.g. Ontario"
            />
          </div>
          <SaveBar state={state} isPending={isPending} onCancel={() => setEditing(false)} />
        </form>
      ) : data ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Profession" value={data.profession} />
            <Field label="Country / Region of Training" value={data.countryOfTraining} />
            <Field
              label="Regulated in Canada"
              value={
                data.regulatedStatus === "provincial"
                  ? "Yes — Provincially"
                  : data.regulatedStatus === "federal"
                    ? "Yes — Federally"
                    : data.regulatedStatus === "unregulated"
                      ? "No — Unregulated"
                      : data.regulatedStatus
              }
            />
            <Field label="Target Provinces" value={data.targetProvinces.join(", ")} />
          </div>
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-primary hover:underline">Edit</button>
        </div>
      ) : (
        <EmptyState onEdit={() => setEditing(true)} />
      )}
    </details>
  );
}

// ── 6B: ECA ───────────────────────────────────────────────────────────────────

type ECA = NonNullable<NewcomerPathway["eca"]>;

function blankECA(): ECA {
  return { organization: "", url: "", reason: "", estimatedCostCAD: "", processingTime: "", documentsRequired: [] };
}

function ECASection({ candidateId, data }: { candidateId: string; data: ECA | null }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ECA>(data ?? blankECA());
  const { state, isPending, submit } = useSectionAction(candidateId, "eca", () => setEditing(false));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(draft);
  }

  return (
    <details className="group">
      <SectionHeading>6B — Educational Credential Assessment</SectionHeading>
      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="ECA Organization" value={draft.organization} onChange={(v) => setDraft({ ...draft, organization: v })} />
          <Input label="Website URL" value={draft.url} onChange={(v) => setDraft({ ...draft, url: v })} placeholder="https://" />
          <Textarea label="Why this body / what the report is used for" value={draft.reason} onChange={(v) => setDraft({ ...draft, reason: v })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Estimated Cost (CAD)" value={draft.estimatedCostCAD} onChange={(v) => setDraft({ ...draft, estimatedCostCAD: v })} placeholder="e.g. $650" />
            <Input label="Processing Time" value={draft.processingTime} onChange={(v) => setDraft({ ...draft, processingTime: v })} placeholder="e.g. 3–4 months" />
          </div>
          <div>
            <span className="mb-1 block text-xs font-medium text-muted">Documents Required</span>
            <StringListEditor
              items={draft.documentsRequired}
              onChange={(v) => setDraft({ ...draft, documentsRequired: v })}
              placeholder="e.g. Official transcripts, sealed"
            />
          </div>
          <SaveBar state={state} isPending={isPending} onCancel={() => setEditing(false)} />
        </form>
      ) : data ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Organization" value={data.organization} />
            <Field label="URL" value={data.url} />
            <Field label="Estimated Cost" value={data.estimatedCostCAD} />
            <Field label="Processing Time" value={data.processingTime} />
          </div>
          {data.reason && <Field label="Why this body" value={data.reason} />}
          {data.documentsRequired.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted">Documents Required</p>
              <ul className="mt-1 list-disc pl-5 space-y-0.5">
                {data.documentsRequired.map((d, i) => <li key={i} className="text-sm">{d}</li>)}
              </ul>
            </div>
          )}
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-primary hover:underline">Edit</button>
        </div>
      ) : (
        <EmptyState onEdit={() => setEditing(true)} />
      )}
    </details>
  );
}

// ── 6C: Licensing ─────────────────────────────────────────────────────────────

function blankLicensing(): PathwayProvinceLicensing {
  return {
    province: "", regulatoryBody: "", website: "",
    registrationRequirements: [], examName: "", examFormat: "",
    examFee: "", passRateIEP: "", applicationFee: "", annualRenewal: "",
  };
}

function ProvinceCard({
  item,
  onChange,
  onRemove,
}: {
  item: PathwayProvinceLicensing;
  onChange: (next: PathwayProvinceLicensing) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{item.province || "New Province"}</h4>
        <button type="button" onClick={onRemove} className="text-xs text-muted hover:text-rose-500">Remove</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Province" value={item.province} onChange={(v) => onChange({ ...item, province: v })} />
        <Input label="Regulatory Body" value={item.regulatoryBody} onChange={(v) => onChange({ ...item, regulatoryBody: v })} />
        <Input label="Website" value={item.website} onChange={(v) => onChange({ ...item, website: v })} placeholder="https://" />
        <Input label="Exam Name" value={item.examName} onChange={(v) => onChange({ ...item, examName: v })} />
        <Input label="Exam Format" value={item.examFormat} onChange={(v) => onChange({ ...item, examFormat: v })} />
        <Input label="Exam Fee" value={item.examFee} onChange={(v) => onChange({ ...item, examFee: v })} />
        <Input label="Pass Rate (IEP)" value={item.passRateIEP} onChange={(v) => onChange({ ...item, passRateIEP: v })} />
        <Input label="Application Fee" value={item.applicationFee} onChange={(v) => onChange({ ...item, applicationFee: v })} />
        <Input label="Annual Renewal Fee" value={item.annualRenewal} onChange={(v) => onChange({ ...item, annualRenewal: v })} />
      </div>
      <div>
        <span className="mb-1 block text-xs font-medium text-muted">Registration Requirements</span>
        <StringListEditor
          items={item.registrationRequirements}
          onChange={(v) => onChange({ ...item, registrationRequirements: v })}
          placeholder="e.g. Completed NNAS Advisory Report"
        />
      </div>
    </div>
  );
}

function LicensingSection({
  candidateId,
  data,
}: {
  candidateId: string;
  data: PathwayProvinceLicensing[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PathwayProvinceLicensing[]>(data);
  const { state, isPending, submit } = useSectionAction(candidateId, "licensing", () => setEditing(false));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(draft);
  }

  return (
    <details className="group">
      <SectionHeading>6C — Licensing & Registration</SectionHeading>
      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {draft.map((item, i) => (
            <ProvinceCard
              key={i}
              item={item}
              onChange={(next) => {
                const a = [...draft];
                a[i] = next;
                setDraft(a);
              }}
              onRemove={() => setDraft(draft.filter((_, j) => j !== i))}
            />
          ))}
          <button
            type="button"
            onClick={() => setDraft([...draft, blankLicensing()])}
            className="text-xs font-medium text-primary hover:underline"
          >
            + Add province
          </button>
          <SaveBar state={state} isPending={isPending} onCancel={() => setEditing(false)} />
        </form>
      ) : data.length > 0 ? (
        <div className="space-y-4">
          {data.map((prov, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 text-sm font-semibold">{prov.province}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Regulatory Body" value={prov.regulatoryBody} />
                <Field label="Website" value={prov.website} />
                <Field label="Licensing Exam" value={prov.examName} />
                <Field label="Exam Format" value={prov.examFormat} />
                <Field label="Exam Fee" value={prov.examFee} />
                <Field label="Pass Rate (Int'l)" value={prov.passRateIEP} />
                <Field label="Application Fee" value={prov.applicationFee} />
                <Field label="Annual Renewal" value={prov.annualRenewal} />
              </div>
              {prov.registrationRequirements.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted">Registration Requirements</p>
                  <ul className="mt-1 list-disc pl-5 space-y-0.5">
                    {prov.registrationRequirements.map((r, j) => <li key={j} className="text-sm">{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ))}
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-primary hover:underline">Edit</button>
        </div>
      ) : (
        <EmptyState onEdit={() => setEditing(true)} />
      )}
    </details>
  );
}

// ── 6D: Language Proficiency ──────────────────────────────────────────────────

type Language = NonNullable<NewcomerPathway["language"]>;

function blankLanguage(): Language {
  return { recommendedTest: "", minimumScores: "", feeCAD: "", bookingUrl: "", validity: "", exemptionNote: "" };
}

function LanguageSection({ candidateId, data }: { candidateId: string; data: Language | null }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Language>(data ?? blankLanguage());
  const { state, isPending, submit } = useSectionAction(candidateId, "language_proficiency", () => setEditing(false));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(draft);
  }

  return (
    <details className="group">
      <SectionHeading>6D — Language Proficiency</SectionHeading>
      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Recommended Test" value={draft.recommendedTest} onChange={(v) => setDraft({ ...draft, recommendedTest: v })} placeholder="e.g. CELBAN" />
          <Input label="Minimum Scores" value={draft.minimumScores} onChange={(v) => setDraft({ ...draft, minimumScores: v })} placeholder="e.g. CLB 8 L/R, CLB 7 W/S" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Fee (CAD)" value={draft.feeCAD} onChange={(v) => setDraft({ ...draft, feeCAD: v })} placeholder="e.g. $315" />
            <Input label="Validity" value={draft.validity} onChange={(v) => setDraft({ ...draft, validity: v })} placeholder="e.g. 2 years" />
            <Input label="Booking URL" value={draft.bookingUrl} onChange={(v) => setDraft({ ...draft, bookingUrl: v })} placeholder="https://" />
          </div>
          <Textarea label="Exemption Note" value={draft.exemptionNote} onChange={(v) => setDraft({ ...draft, exemptionNote: v })} />
          <SaveBar state={state} isPending={isPending} onCancel={() => setEditing(false)} />
        </form>
      ) : data ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Recommended Test" value={data.recommendedTest} />
            <Field label="Minimum Scores" value={data.minimumScores} />
            <Field label="Fee" value={data.feeCAD} />
            <Field label="Validity" value={data.validity} />
            <Field label="Booking URL" value={data.bookingUrl} />
          </div>
          {data.exemptionNote && <Field label="Exemption Note" value={data.exemptionNote} />}
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-primary hover:underline">Edit</button>
        </div>
      ) : (
        <EmptyState onEdit={() => setEditing(true)} />
      )}
    </details>
  );
}

// ── 6E: Bridging Programs ─────────────────────────────────────────────────────

type Bridging = NonNullable<NewcomerPathway["bridging"]>;

function blankBridging(): Bridging {
  return { required: "possibly", reason: "", programs: [], governmentFundingNote: "" };
}

function blankProgram(): PathwayBridgingProgram {
  return { name: "", institution: "", province: "", delivery: "", duration: "", costCAD: "", gapAddressed: "", eligibility: "", url: "" };
}

function BridgingSection({ candidateId, data }: { candidateId: string; data: Bridging | null }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Bridging>(data ?? blankBridging());
  const { state, isPending, submit } = useSectionAction(candidateId, "bridging", () => setEditing(false));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(draft);
  }

  const requiredLabels = { yes: "Yes — required", possibly: "Possibly", unlikely: "Unlikely" };

  return (
    <details className="group">
      <SectionHeading>6E — Bridging Programs</SectionHeading>
      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Bridging Program Required?</span>
            <select
              value={draft.required}
              onChange={(e) => setDraft({ ...draft, required: e.target.value as Bridging["required"] })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="yes">Yes — required</option>
              <option value="possibly">Possibly</option>
              <option value="unlikely">Unlikely</option>
            </select>
          </label>
          <Textarea label="Reason" value={draft.reason} onChange={(v) => setDraft({ ...draft, reason: v })} rows={3} />
          <Textarea label="Government Funding Note" value={draft.governmentFundingNote} onChange={(v) => setDraft({ ...draft, governmentFundingNote: v })} />
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted">Programs</p>
            {draft.programs.map((prog, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{prog.name || `Program ${i + 1}`}</span>
                  <button type="button" onClick={() => setDraft({ ...draft, programs: draft.programs.filter((_, j) => j !== i) })} className="text-xs text-muted hover:text-rose-500">Remove</button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Program Name" value={prog.name} onChange={(v) => { const a = [...draft.programs]; a[i] = { ...prog, name: v }; setDraft({ ...draft, programs: a }); }} />
                  <Input label="Institution" value={prog.institution} onChange={(v) => { const a = [...draft.programs]; a[i] = { ...prog, institution: v }; setDraft({ ...draft, programs: a }); }} />
                  <Input label="Province" value={prog.province} onChange={(v) => { const a = [...draft.programs]; a[i] = { ...prog, province: v }; setDraft({ ...draft, programs: a }); }} />
                  <Input label="Delivery" value={prog.delivery} onChange={(v) => { const a = [...draft.programs]; a[i] = { ...prog, delivery: v }; setDraft({ ...draft, programs: a }); }} placeholder="e.g. Online / Hybrid" />
                  <Input label="Duration" value={prog.duration} onChange={(v) => { const a = [...draft.programs]; a[i] = { ...prog, duration: v }; setDraft({ ...draft, programs: a }); }} placeholder="e.g. 6 months" />
                  <Input label="Cost (CAD)" value={prog.costCAD} onChange={(v) => { const a = [...draft.programs]; a[i] = { ...prog, costCAD: v }; setDraft({ ...draft, programs: a }); }} />
                  <Input label="Gap Addressed" value={prog.gapAddressed} onChange={(v) => { const a = [...draft.programs]; a[i] = { ...prog, gapAddressed: v }; setDraft({ ...draft, programs: a }); }} />
                  <Input label="URL" value={prog.url} onChange={(v) => { const a = [...draft.programs]; a[i] = { ...prog, url: v }; setDraft({ ...draft, programs: a }); }} placeholder="https://" />
                </div>
                <Textarea label="Eligibility" value={prog.eligibility} onChange={(v) => { const a = [...draft.programs]; a[i] = { ...prog, eligibility: v }; setDraft({ ...draft, programs: a }); }} rows={2} />
              </div>
            ))}
            <button type="button" onClick={() => setDraft({ ...draft, programs: [...draft.programs, blankProgram()] })} className="text-xs font-medium text-primary hover:underline">+ Add program</button>
          </div>
          <SaveBar state={state} isPending={isPending} onCancel={() => setEditing(false)} />
        </form>
      ) : data ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${data.required === "yes" ? "bg-rose-100 text-rose-700" : data.required === "possibly" ? "bg-amber-100 text-amber-700" : "bg-primary-soft text-primary"}`}>
              {requiredLabels[data.required]}
            </span>
          </div>
          {data.reason && <p className="text-sm text-foreground/80">{data.reason}</p>}
          {data.programs.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.programs.map((prog, i) => (
                <div key={i} className="rounded-xl border border-border bg-surface p-4">
                  <h4 className="text-sm font-semibold">{prog.name}</h4>
                  <p className="mt-0.5 text-xs text-muted">{prog.institution} · {prog.province}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                    <span className="text-muted">Delivery</span><span>{prog.delivery}</span>
                    <span className="text-muted">Duration</span><span>{prog.duration}</span>
                    <span className="text-muted">Cost</span><span>{prog.costCAD}</span>
                  </div>
                  {prog.gapAddressed && <p className="mt-2 text-xs text-muted">Closes: {prog.gapAddressed}</p>}
                </div>
              ))}
            </div>
          )}
          {data.governmentFundingNote && <p className="text-xs text-muted italic">{data.governmentFundingNote}</p>}
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-primary hover:underline">Edit</button>
        </div>
      ) : (
        <EmptyState onEdit={() => setEditing(true)} />
      )}
    </details>
  );
}

// ── 6F: Full Pathway ──────────────────────────────────────────────────────────

type FullPath = NonNullable<NewcomerPathway["fullPath"]>;

function blankFullPath(): FullPath {
  return { startingPoint: "", targetRole: "", totalTimeline: "", totalCostCAD: "", steps: [] };
}

function blankStep(): PathwayStep {
  return { action: "", timeline: "", costCAD: "", explanation: "" };
}

function StepCard({
  step,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  step: PathwayStep;
  index: number;
  onChange: (next: PathwayStep) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{index + 1}</span>
        <div className="flex items-center gap-2">
          {!isFirst && <button type="button" onClick={onMoveUp} className="text-xs text-muted hover:text-foreground">↑</button>}
          {!isLast && <button type="button" onClick={onMoveDown} className="text-xs text-muted hover:text-foreground">↓</button>}
          <button type="button" onClick={onRemove} className="text-xs text-muted hover:text-rose-500">Remove</button>
        </div>
      </div>
      <Input label="Action" value={step.action} onChange={(v) => onChange({ ...step, action: v })} placeholder="e.g. Create NNAS account and submit all documents" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Timeline" value={step.timeline} onChange={(v) => onChange({ ...step, timeline: v })} placeholder="e.g. 3–4 months" />
        <Input label="Cost (CAD)" value={step.costCAD} onChange={(v) => onChange({ ...step, costCAD: v })} placeholder="e.g. ~$650" />
      </div>
      <Textarea label="Explanation" value={step.explanation} onChange={(v) => onChange({ ...step, explanation: v })} rows={2} />
    </div>
  );
}

function FullPathSection({ candidateId, data }: { candidateId: string; data: FullPath | null }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<FullPath>(data ?? blankFullPath());
  const { state, isPending, submit } = useSectionAction(candidateId, "full_path", () => setEditing(false));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(draft);
  }

  function moveStep(i: number, dir: -1 | 1) {
    const steps = [...draft.steps];
    const j = i + dir;
    [steps[i], steps[j]] = [steps[j], steps[i]];
    setDraft({ ...draft, steps });
  }

  return (
    <details open className="group">
      <SectionHeading>6F — Full Pathway Step by Step</SectionHeading>
      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Starting Point" value={draft.startingPoint} onChange={(v) => setDraft({ ...draft, startingPoint: v })} placeholder="e.g. RN — Philippines" />
            <Input label="Target Role in Canada" value={draft.targetRole} onChange={(v) => setDraft({ ...draft, targetRole: v })} placeholder="e.g. Registered Nurse (RN) — Ontario" />
            <Input label="Total Timeline" value={draft.totalTimeline} onChange={(v) => setDraft({ ...draft, totalTimeline: v })} placeholder="e.g. 18–24 months" />
            <Input label="Total Estimated Cost (CAD)" value={draft.totalCostCAD} onChange={(v) => setDraft({ ...draft, totalCostCAD: v })} placeholder="e.g. $3,500–$5,500" />
          </div>
          <div className="space-y-3">
            {draft.steps.map((step, i) => (
              <StepCard
                key={i}
                step={step}
                index={i}
                onChange={(next) => { const a = [...draft.steps]; a[i] = next; setDraft({ ...draft, steps: a }); }}
                onRemove={() => setDraft({ ...draft, steps: draft.steps.filter((_, j) => j !== i) })}
                onMoveUp={() => moveStep(i, -1)}
                onMoveDown={() => moveStep(i, 1)}
                isFirst={i === 0}
                isLast={i === draft.steps.length - 1}
              />
            ))}
            <button type="button" onClick={() => setDraft({ ...draft, steps: [...draft.steps, blankStep()] })} className="text-xs font-medium text-primary hover:underline">+ Add step</button>
          </div>
          <SaveBar state={state} isPending={isPending} onCancel={() => setEditing(false)} />
        </form>
      ) : data ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-surface px-5 py-4">
            <div><p className="text-xs text-muted">Starting point</p><p className="text-sm font-medium">{data.startingPoint}</p></div>
            <div className="text-muted self-center">→</div>
            <div><p className="text-xs text-muted">Target role</p><p className="text-sm font-medium">{data.targetRole}</p></div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted">Timeline</p><p className="text-sm font-medium">{data.totalTimeline}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Total cost</p><p className="text-sm font-medium">{data.totalCostCAD}</p>
            </div>
          </div>
          <ol className="space-y-3">
            {data.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white mt-0.5">{i + 1}</div>
                <div className="flex-1 rounded-xl border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{step.action}</p>
                    <div className="flex gap-3 text-xs text-muted shrink-0">
                      <span>{step.timeline}</span>
                      <span>·</span>
                      <span>{step.costCAD}</span>
                    </div>
                  </div>
                  {step.explanation && <p className="mt-1.5 text-sm text-foreground/80">{step.explanation}</p>}
                </div>
              </li>
            ))}
          </ol>
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-primary hover:underline">Edit</button>
        </div>
      ) : (
        <EmptyState onEdit={() => setEditing(true)} />
      )}
    </details>
  );
}

// ── 6G: Superior Roles ────────────────────────────────────────────────────────

function blankSuperiorRole(): PathwaySuperiorRole {
  return { title: "", eligibilityPath: [], timelineFromRegistration: "", equivalentRoleComp: "", superiorRoleComp: "" };
}

function SuperiorRolesSection({ candidateId, data }: { candidateId: string; data: PathwaySuperiorRole[] }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PathwaySuperiorRole[]>(data);
  const { state, isPending, submit } = useSectionAction(candidateId, "superior_roles", () => setEditing(false));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(draft);
  }

  return (
    <details className="group">
      <SectionHeading>6G — Superior Role Pathway</SectionHeading>
      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {draft.map((role, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{role.title || `Role ${i + 1}`}</span>
                <button type="button" onClick={() => setDraft(draft.filter((_, j) => j !== i))} className="text-xs text-muted hover:text-rose-500">Remove</button>
              </div>
              <Input label="Title" value={role.title} onChange={(v) => { const a = [...draft]; a[i] = { ...role, title: v }; setDraft(a); }} />
              <div className="grid gap-3 sm:grid-cols-3">
                <Input label="Timeline from Registration" value={role.timelineFromRegistration} onChange={(v) => { const a = [...draft]; a[i] = { ...role, timelineFromRegistration: v }; setDraft(a); }} placeholder="e.g. 2–3 years" />
                <Input label="Equivalent Role Comp" value={role.equivalentRoleComp} onChange={(v) => { const a = [...draft]; a[i] = { ...role, equivalentRoleComp: v }; setDraft(a); }} placeholder="e.g. $70K / $82K / $96K" />
                <Input label="Superior Role Comp" value={role.superiorRoleComp} onChange={(v) => { const a = [...draft]; a[i] = { ...role, superiorRoleComp: v }; setDraft(a); }} placeholder="e.g. $90K / $105K / $125K" />
              </div>
              <div>
                <span className="mb-1 block text-xs font-medium text-muted">Eligibility Path</span>
                <StringListEditor
                  items={role.eligibilityPath}
                  onChange={(v) => { const a = [...draft]; a[i] = { ...role, eligibilityPath: v }; setDraft(a); }}
                  placeholder="e.g. 2 years Canadian experience + NP program"
                />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setDraft([...draft, blankSuperiorRole()])} className="text-xs font-medium text-primary hover:underline">+ Add role</button>
          <SaveBar state={state} isPending={isPending} onCancel={() => setEditing(false)} />
        </form>
      ) : data.length > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {data.map((role, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold">{role.title}</h3>
                <p className="mt-0.5 text-xs text-muted">{role.timelineFromRegistration} post-registration</p>
                {role.eligibilityPath.length > 0 && (
                  <ul className="mt-2 list-disc pl-4 space-y-0.5">
                    {role.eligibilityPath.map((e, j) => <li key={j} className="text-xs text-foreground/80">{e}</li>)}
                  </ul>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted">Equivalent role</p>
                    <p className="font-medium">{role.equivalentRoleComp}</p>
                  </div>
                  <div>
                    <p className="text-muted">Superior role</p>
                    <p className="font-medium text-primary">{role.superiorRoleComp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-primary hover:underline">Edit</button>
        </div>
      ) : (
        <EmptyState onEdit={() => setEditing(true)} />
      )}
    </details>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function NewcomerPathwayPanel({
  candidateId,
  pathway,
}: {
  candidateId: string;
  pathway: NewcomerPathway | null;
}) {
  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center gap-2.5 border-b border-border pb-3">
        <h2 className="text-base font-semibold tracking-tight">Newcomer Pathway</h2>
        <span className="rounded-full bg-accent-blue-soft px-2.5 py-0.5 text-xs font-medium text-accent-blue">
          Part 6
        </span>
        {pathway?.updatedByName && (
          <span className="ml-auto text-xs text-muted">
            Last updated by {pathway.updatedByName}
          </span>
        )}
      </div>
      <div className="space-y-4">
        <RegulatoryStatusSection candidateId={candidateId} data={pathway?.regulatoryStatus ?? null} />
        <ECASection candidateId={candidateId} data={pathway?.eca ?? null} />
        <LicensingSection candidateId={candidateId} data={pathway?.licensing ?? []} />
        <LanguageSection candidateId={candidateId} data={pathway?.language ?? null} />
        <BridgingSection candidateId={candidateId} data={pathway?.bridging ?? null} />
        <FullPathSection candidateId={candidateId} data={pathway?.fullPath ?? null} />
        <SuperiorRolesSection candidateId={candidateId} data={pathway?.superiorRoles ?? []} />
      </div>
    </div>
  );
}
