import { prisma } from "@/lib/prisma";
import type { ExpenseCategory, Prisma } from "@/generated/prisma/client";

export type ExpenseListFilters = {
  branchId?: string;
  category?: ExpenseCategory;
  employeeId?: string;
  // Calendar-year and (optionally) calendar-month to narrow the list to —
  // month is only meaningful paired with a year, since "August across every
  // year" isn't a filter owners actually reach for here.
  year?: number;
  month?: number;
};

function calendarRange(year?: number, month?: number): { gte: Date; lt: Date } | undefined {
  if (!year) return undefined;
  if (month) return { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) };
  return { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) };
}

export async function listExpensesForOrg(organizationId: string, filters: ExpenseListFilters = {}) {
  const expenseDate = calendarRange(filters.year, filters.month);
  const expenses = await prisma.expense.findMany({
    where: {
      organizationId,
      ...(filters.branchId && { branchId: filters.branchId }),
      ...(filters.category && { category: filters.category }),
      ...(filters.employeeId && { employeeId: filters.employeeId }),
      ...(expenseDate && { expenseDate }),
    },
    include: {
      branch: { select: { id: true, name: true } },
      employee: { select: { id: true, name: true } },
    },
    orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
  });
  return expenses;
}

const MONTH_SHORT_LABEL = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type MonthlyExpenseFilters = { branchId?: string; category?: ExpenseCategory; employeeId?: string };

/** Twelve-month expense total for a calendar year — powers the "Monthly expenses" chart. */
export async function getMonthlyExpenseTotals(
  organizationId: string,
  year: number,
  filters: MonthlyExpenseFilters = {},
) {
  const expenses = await prisma.expense.findMany({
    where: {
      organizationId,
      voided: false,
      expenseDate: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
      ...(filters.branchId && { branchId: filters.branchId }),
      ...(filters.category && { category: filters.category }),
      ...(filters.employeeId && { employeeId: filters.employeeId }),
    },
    select: { amount: true, expenseDate: true },
  });

  const totals = new Array(12).fill(0) as number[];
  for (const e of expenses) totals[e.expenseDate.getMonth()] += Number(e.amount);

  return totals.map((total, i) => ({
    key: `${year}-${String(i + 1).padStart(2, "0")}`,
    label: MONTH_SHORT_LABEL[i],
    total,
  }));
}

/** Distinct calendar years that have at least one expense, newest first — powers the year filter dropdown. */
export async function listExpenseYearsForOrg(organizationId: string) {
  const rows = await prisma.expense.findMany({
    where: { organizationId },
    select: { expenseDate: true },
  });
  const years = [...new Set(rows.map((r) => r.expenseDate.getFullYear()))];
  return years.sort((a, b) => b - a);
}

export type ExpenseTotalsFilters = {
  branchId?: string;
  employeeId?: string;
  start?: Date;
  end?: Date;
};

/**
 * Sums voided-excluded expenses for a scope, optionally bounded to a date
 * range (reports) or left open-ended (all-time, e.g. an employee's detail
 * page). Org-wide expenses (branchId null) always count toward a
 * branch-scoped total, since they're still part of running that branch's
 * business — just not attributable to one specific location.
 */
export async function getExpenseTotals(organizationId: string, filters: ExpenseTotalsFilters = {}) {
  const where: Prisma.ExpenseWhereInput = {
    organizationId,
    voided: false,
    ...(filters.start || filters.end
      ? { expenseDate: { ...(filters.start && { gte: filters.start }), ...(filters.end && { lt: filters.end }) } }
      : {}),
    ...(filters.employeeId
      ? { employeeId: filters.employeeId }
      : filters.branchId
        ? { OR: [{ branchId: filters.branchId }, { branchId: null }] }
        : {}),
  };

  const expenses = await prisma.expense.findMany({ where });

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const byCategory = new Map<string, { category: string; total: number }>();
  for (const e of expenses) {
    const entry = byCategory.get(e.category) ?? { category: e.category, total: 0 };
    entry.total += Number(e.amount);
    byCategory.set(e.category, entry);
  }

  return {
    total,
    byCategory: [...byCategory.values()].sort((a, b) => b.total - a.total),
  };
}
