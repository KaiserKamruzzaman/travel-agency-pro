import { prisma } from "@/lib/prisma";
import { sumRevenueAndCost } from "@/lib/sale-metrics";

export type ReportPreset = "week" | "month" | "year" | "custom";
export type ReportGranularity = "day" | "month";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

// Custom ranges longer than this bucket by month instead of by day, so a
// year-long custom range doesn't render 365 bars — mirrors the yearly preset.
const CUSTOM_DAY_BUCKET_MAX_SPAN_DAYS = 62;

/**
 * Resolves a preset (or explicit custom start/end) to a concrete [start, end)
 * range plus the trend granularity to bucket it by. Requirements 6.1/6.3: the
 * daily/monthly/yearly views are just presets over one generic date-range
 * engine.
 */
export function getPresetRange(
  preset: ReportPreset,
  customStart?: Date,
  customEnd?: Date,
  now: Date = new Date(),
): { start: Date; end: Date; granularity: ReportGranularity } {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);

  if (preset === "week") {
    return { start: addDays(today, -6), end: tomorrow, granularity: "day" };
  }
  if (preset === "month") {
    return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: tomorrow, granularity: "day" };
  }
  if (preset === "year") {
    return { start: new Date(today.getFullYear(), 0, 1), end: tomorrow, granularity: "month" };
  }

  const start = customStart ? startOfDay(customStart) : addDays(today, -6);
  const end = customEnd ? addDays(startOfDay(customEnd), 1) : tomorrow;
  const spanDays = Math.max(1, (end.getTime() - start.getTime()) / 86_400_000);
  return { start, end, granularity: spanDays > CUSTOM_DAY_BUCKET_MAX_SPAN_DAYS ? "month" : "day" };
}

export type ReportFilters = { branchId?: string; employeeId?: string };

type GroupableSale = { salePrice: unknown; costPrice: unknown };

function groupSummary<T extends GroupableSale>(items: T[], keyFn: (item: T) => string, labelFn: (item: T) => string) {
  const map = new Map<string, { key: string; label: string; tickets: number; revenue: number; cost: number }>();
  for (const item of items) {
    const key = keyFn(item);
    const entry = map.get(key) ?? { key, label: labelFn(item), tickets: 0, revenue: 0, cost: 0 };
    entry.tickets += 1;
    entry.revenue += Number(item.salePrice);
    entry.cost += Number(item.costPrice);
    map.set(key, entry);
  }
  return [...map.values()]
    .map((g) => ({ ...g, profit: g.revenue - g.cost }))
    .sort((a, b) => b.revenue - a.revenue);
}

const dayLabelFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const monthLabelFormat = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// Local calendar-date keys, not toISOString() — converting to UTC would
// shift the date backward for any timezone behind UTC, landing sales in
// the wrong bucket (or dropping them off the enumerated range entirely).
function bucketKey(date: Date, granularity: ReportGranularity) {
  const key = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
  return granularity === "day" ? `${key}-${pad2(date.getDate())}` : key;
}

function bucketLabel(key: string, granularity: ReportGranularity) {
  if (granularity === "day") {
    const [y, m, d] = key.split("-").map(Number);
    return dayLabelFormat.format(new Date(y, m - 1, d));
  }
  const [y, m] = key.split("-").map(Number);
  return monthLabelFormat.format(new Date(y, m - 1, 1));
}

function enumerateBucketKeys(start: Date, end: Date, granularity: ReportGranularity) {
  const keys: string[] = [];
  if (granularity === "day") {
    for (let cur = new Date(start); cur < end; cur = addDays(cur, 1)) keys.push(bucketKey(cur, granularity));
  } else {
    for (
      let cur = new Date(start.getFullYear(), start.getMonth(), 1);
      cur < end;
      cur = addMonths(cur, 1)
    ) {
      keys.push(bucketKey(cur, granularity));
    }
  }
  return keys;
}

/**
 * The generic report engine (requirements 6.1–6.3): one query, sliced by any
 * date range and optionally scoped to a branch/employee, producing totals,
 * top performers, top routes/airlines, and a period-over-period trend.
 */
export async function getSalesReport(
  organizationId: string,
  start: Date,
  end: Date,
  granularity: ReportGranularity,
  filters: ReportFilters = {},
) {
  const sales = await prisma.sale.findMany({
    where: {
      organizationId,
      saleDate: { gte: start, lt: end },
      ...(filters.branchId && { branchId: filters.branchId }),
      ...(filters.employeeId && { employeeId: filters.employeeId }),
    },
    include: {
      employee: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { saleDate: "asc" },
  });

  const issued = sales.filter((s) => s.status === "ISSUED");
  const totals = sumRevenueAndCost(issued);
  const tickets = issued.length;
  const avgSale = tickets > 0 ? totals.revenue / tickets : 0;

  const byBranch = groupSummary(issued, (s) => s.branchId, (s) => s.branch.name);
  const byEmployee = groupSummary(issued, (s) => s.employeeId, (s) => s.employee.name);
  const byRoute = groupSummary(
    issued,
    (s) => `${s.origin}-${s.destination}`,
    (s) => `${s.origin} → ${s.destination}`,
  ).slice(0, 5);
  const byAirline = groupSummary(issued, (s) => s.airline, (s) => s.airline).slice(0, 5);

  const trendTotals = new Map<string, { tickets: number; revenue: number; cost: number }>();
  for (const key of enumerateBucketKeys(start, end, granularity)) trendTotals.set(key, { tickets: 0, revenue: 0, cost: 0 });
  for (const sale of issued) {
    const key = bucketKey(new Date(sale.saleDate), granularity);
    const bucket = trendTotals.get(key);
    if (!bucket) continue; // sale falls outside the enumerated range boundary
    bucket.tickets += 1;
    bucket.revenue += Number(sale.salePrice);
    bucket.cost += Number(sale.costPrice);
  }
  const trend = [...trendTotals.entries()].map(([key, v]) => ({
    key,
    label: bucketLabel(key, granularity),
    tickets: v.tickets,
    revenue: v.revenue,
    profit: v.revenue - v.cost,
  }));

  return {
    range: { start, end, granularity },
    totals: { tickets, revenue: totals.revenue, cost: totals.cost, profit: totals.profit, avgSale },
    topBranch: byBranch[0] ?? null,
    topEmployee: byEmployee[0] ?? null,
    byBranch,
    byEmployee,
    byRoute,
    byAirline,
    trend,
  };
}

export async function getOrgFilterOptions(organizationId: string) {
  const [branches, employees] = await Promise.all([
    prisma.branch.findMany({ where: { organizationId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { organizationId, role: "EMPLOYEE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { branches, employees };
}
