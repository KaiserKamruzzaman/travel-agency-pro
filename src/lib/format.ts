export function formatMoney(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
}

// Compact form for axis ticks and dense labels (e.g. "$4.2K") — full
// precision belongs in cards/tables via formatMoney. Hand-rolled rather than
// Intl's `notation: "compact"`: that option has produced server/client
// hydration mismatches (e.g. "$0" vs "$0.0" for zero) across ICU versions.
export function formatCompactMoney(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${trimTrailingZero((abs / 1_000_000).toFixed(1))}M`;
  if (abs >= 1_000) return `${sign}$${trimTrailingZero((abs / 1_000).toFixed(1))}K`;
  return `${sign}$${Math.round(abs)}`;
}

function trimTrailingZero(value: string): string {
  return value.endsWith(".0") ? value.slice(0, -2) : value;
}

export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

// Local calendar-date components, not toISOString() — that converts to UTC
// and shifts the date backward for any timezone ahead of UTC (see the same
// caveat in reports.ts's bucketKey).
export function toDateInputValue(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Reverse of toDateInputValue — parses via local Date fields, not the Date
// constructor's UTC-based string parsing, for the same timezone reason.
export function parseDateInputValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}
