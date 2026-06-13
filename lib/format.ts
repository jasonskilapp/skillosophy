import type { Comp, Strength } from "./types";

/** Initials for an avatar, e.g. "Jason Hall" -> "JH". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Format a CAD amount compactly, e.g. 115000 -> "$115K". */
export function money(amount: number): string {
  if (amount >= 1000) {
    const k = amount / 1000;
    const rounded = Number.isInteger(k) ? k.toString() : k.toFixed(0);
    return `$${rounded}K`;
  }
  return `$${amount}`;
}

/** "$75K – $115K · ON" style range used on role tiles. */
export function compRange(comp?: Comp): string {
  if (!comp) return "";
  const range = `${money(comp.low)} – ${money(comp.high)}`;
  return comp.region ? `${range} · ${comp.region}` : range;
}

/** A friendly date like "Jun 10, 2026". */
export function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** A date + time like "Jun 10, 2026, 8:00 a.m." */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** YYYY-MM-DD bucket key in local time, for grouping uploads by day. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** A heading for a day group, e.g. "Today", "Yesterday", or a date. */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(iso) === dayKey(today.toISOString())) return "Today";
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return "Yesterday";
  return d.toLocaleDateString("en-CA", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export interface StrengthMeta {
  label: Strength;
  /** 0-1 fill fraction for the bar. */
  fraction: number;
  /** CSS var color for the bar fill and pill. */
  color: string;
  pillBg: string;
  pillText: string;
}

const STRENGTH_TABLE: Record<Strength, StrengthMeta> = {
  Expert: {
    label: "Expert",
    fraction: 1,
    color: "var(--color-primary)",
    pillBg: "var(--color-primary-soft)",
    pillText: "var(--color-primary)",
  },
  Proficient: {
    label: "Proficient",
    fraction: 0.72,
    color: "var(--color-proficient)",
    pillBg: "var(--color-proficient-soft)",
    pillText: "var(--color-proficient)",
  },
  Competent: {
    label: "Competent",
    fraction: 0.48,
    color: "var(--color-competent)",
    pillBg: "var(--color-competent-soft)",
    pillText: "var(--color-competent)",
  },
  Foundational: {
    label: "Foundational",
    fraction: 0.28,
    color: "var(--color-foundational)",
    pillBg: "var(--color-foundational-soft)",
    pillText: "var(--color-foundational)",
  },
};

export function strengthMeta(strength: Strength): StrengthMeta {
  return STRENGTH_TABLE[strength] ?? STRENGTH_TABLE.Foundational;
}
