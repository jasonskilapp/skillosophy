"use client";

import { useState, useCallback, useTransition } from "react";
import { toggleVerifiedSkill } from "@/app/actions";
import type { Skill } from "@/lib/types";
import { strengthMeta } from "@/lib/format";

const STRENGTH_ORDER = ["Expert", "Proficient", "Competent", "Foundational"] as const;

type SkillGroup = { strength: string; skills: Skill[] };

function groupByStrength(skills: Skill[]): SkillGroup[] {
  const map = new Map<string, Skill[]>();
  for (const skill of skills) {
    const bucket = map.get(skill.strength) ?? [];
    bucket.push(skill);
    map.set(skill.strength, bucket);
  }
  return STRENGTH_ORDER.filter((s) => map.has(s)).map((s) => ({
    strength: s,
    skills: map.get(s)!,
  }));
}

function Checkbox({
  checked,
  indeterminate,
  onChange,
  className,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  className?: string;
}) {
  const ref = useCallback(
    (el: HTMLInputElement | null) => {
      if (el) el.indeterminate = !checked && !!indeterminate;
    },
    [checked, indeterminate],
  );
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={`h-4 w-4 cursor-pointer accent-[var(--color-primary)] ${className ?? ""}`}
    />
  );
}

function StrengthGroup({
  group,
  prefix,
  selected,
  onToggleSkill,
  onToggleGroup,
}: {
  group: SkillGroup;
  prefix: string;
  selected: Set<string>;
  onToggleSkill: (key: string) => void;
  onToggleGroup: (keys: string[], allSelected: boolean) => void;
}) {
  const keys = group.skills.map((s) => `${prefix}:${s.name}`);
  const allSelected = keys.length > 0 && keys.every((k) => selected.has(k));
  const someSelected = keys.some((k) => selected.has(k));
  const meta = strengthMeta(group.strength as never);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between border-b border-border pb-1">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ backgroundColor: meta.pillBg, color: meta.pillText }}
        >
          {group.strength}
        </span>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted select-none">
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onChange={() => onToggleGroup(keys, allSelected)}
          />
          Select all
        </label>
      </div>

      <div className="divide-y divide-border">
        {group.skills.map((skill) => {
          const key = `${prefix}:${skill.name}`;
          const isChecked = selected.has(key);
          return (
            <label
              key={skill.name}
              className="grid cursor-pointer select-none items-center gap-x-3 gap-y-1.5 py-2"
              style={{ gridTemplateColumns: "auto 1fr auto" }}
            >
              <Checkbox
                checked={isChecked}
                onChange={() => onToggleSkill(key)}
              />
              <span className="flex items-center gap-1.5 text-sm font-medium" title={skill.evidence ?? undefined}>
                {skill.name}
                {isChecked && (
                  <span className="rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    Verified
                  </span>
                )}
              </span>
              <span
                className="justify-self-end rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ backgroundColor: meta.pillBg, color: meta.pillText }}
              >
                {skill.strength}
              </span>
              <div className="col-span-2 col-start-2 h-1.5 w-full overflow-hidden rounded-full bg-track">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.round(meta.fraction * 100)}%`,
                    backgroundColor: meta.color,
                  }}
                />
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function SkillCard({
  title,
  prefix,
  groups,
  selected,
  onToggleSkill,
  onToggleGroup,
}: {
  title: string;
  prefix: string;
  groups: SkillGroup[];
  selected: Set<string>;
  onToggleSkill: (key: string) => void;
  onToggleGroup: (keys: string[], allSelected: boolean) => void;
}) {
  const allKeys = groups.flatMap((g) => g.skills.map((s) => `${prefix}:${s.name}`));
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selected.has(k));
  const someSelected = allKeys.some((k) => selected.has(k));

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          {title}
        </h3>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted select-none">
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onChange={() => onToggleGroup(allKeys, allSelected)}
          />
          Select all
        </label>
      </div>

      <div className="space-y-5">
        {groups.map((group) => (
          <StrengthGroup
            key={group.strength}
            group={group}
            prefix={prefix}
            selected={selected}
            onToggleSkill={onToggleSkill}
            onToggleGroup={onToggleGroup}
          />
        ))}
      </div>
    </div>
  );
}

export default function SkillsSelector({
  hard,
  soft,
  candidateId,
  initialVerified,
}: {
  hard: Skill[];
  soft: Skill[];
  candidateId: string;
  initialVerified: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialVerified));
  const [, startTransition] = useTransition();

  const hardGroups = groupByStrength(hard);
  const softGroups = groupByStrength(soft);

  function toggleSkill(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      const nowVerified = !next.has(key);
      if (nowVerified) next.add(key);
      else next.delete(key);
      startTransition(async () => {
        await toggleVerifiedSkill(candidateId, key, nowVerified);
      });
      return next;
    });
  }

  function toggleGroup(keys: string[], allSelected: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        keys.forEach((k) => next.delete(k));
        startTransition(async () => {
          await Promise.all(keys.map((k) => toggleVerifiedSkill(candidateId, k, false)));
        });
      } else {
        keys.forEach((k) => next.add(k));
        startTransition(async () => {
          await Promise.all(keys.map((k) => toggleVerifiedSkill(candidateId, k, true)));
        });
      }
      return next;
    });
  }

  const count = selected.size;

  return (
    <div className="space-y-3">
      {count > 0 && (
        <div className="rounded-lg border border-primary bg-primary-soft px-4 py-2 text-sm font-medium text-primary">
          {count} skill{count !== 1 ? "s" : ""} verified — carried forward in re-analysis
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <SkillCard
          title="Hard skills"
          prefix="hard"
          groups={hardGroups}
          selected={selected}
          onToggleSkill={toggleSkill}
          onToggleGroup={toggleGroup}
        />
        <SkillCard
          title="Soft skills"
          prefix="soft"
          groups={softGroups}
          selected={selected}
          onToggleSkill={toggleSkill}
          onToggleGroup={toggleGroup}
        />
      </div>
    </div>
  );
}
