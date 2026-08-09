import { redirect } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { listExpensesForOrg, listExpenseYearsForOrg, getMonthlyExpenseTotals } from "@/lib/expenses";
import { listBranchesForOrg } from "@/lib/branches";
import { listEmployeesForOrg } from "@/lib/employees";
import { ExpenseFilters } from "@/components/expense-filters";
import { ExpenseManager } from "@/components/expense-manager";
import { ExpenseChart } from "@/components/expense-chart";
import { ExpenseCategory } from "@/generated/prisma/client";

type SearchParams = { [key: string]: string | string[] | undefined };
type PageProps = { searchParams: Promise<SearchParams> };

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const session = await requireSession();
  if (session.user.role !== "OWNER") redirect("/sales");

  const sp = await searchParams;
  const branchId = firstParam(sp.branchId) || undefined;
  const employeeId = firstParam(sp.employeeId) || undefined;
  const categoryParam = firstParam(sp.category);
  const category =
    categoryParam && (Object.values(ExpenseCategory) as string[]).includes(categoryParam)
      ? (categoryParam as ExpenseCategory)
      : undefined;

  const monthParam = Number(firstParam(sp.month));
  const month = monthParam >= 1 && monthParam <= 12 ? monthParam : undefined;
  const yearParam = Number(firstParam(sp.year));
  // A month picked with no year is ambiguous — default to the current year
  // rather than leaving the filter silently ignored.
  const year = yearParam > 0 ? yearParam : month ? new Date().getFullYear() : undefined;

  const currentYear = new Date().getFullYear();
  // The chart always shows a full year — reuse the year filter when one's
  // picked so "Year: 2025" narrows both the table and the chart together.
  const chartYear = year ?? currentYear;

  const [expenses, branches, employees, expenseYears, monthlyTotals] = await Promise.all([
    listExpensesForOrg(session.user.organizationId, { branchId, category, employeeId, year, month }),
    listBranchesForOrg(session.user.organizationId),
    listEmployeesForOrg(session.user.organizationId),
    listExpenseYearsForOrg(session.user.organizationId),
    getMonthlyExpenseTotals(session.user.organizationId, chartYear, { branchId, category, employeeId }),
  ]);
  const years = [...new Set([currentYear, ...expenseYears])].sort((a, b) => b - a);

  const managedExpenses = expenses.map((e) => ({
    id: e.id,
    category: e.category,
    description: e.description,
    amount: e.amount.toString(),
    expenseDate: e.expenseDate.toISOString(),
    voided: e.voided,
    branch: e.branch,
    employee: e.employee,
    notes: e.notes,
  }));

  const hasActiveFilters = Boolean(branchId || category || employeeId || year || month);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="animate-fade-in-up mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Expenses</h1>
        <p className="text-sm text-slate-500">
          Track salaries, rent, utilities, and other operating costs alongside sales — see the Reports page for net
          profit after expenses.
        </p>
      </div>

      <ExpenseFilters
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
        employees={employees.map((e) => ({ id: e.id, name: e.name }))}
        years={years}
        values={{ branchId, category, employeeId, year, month }}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="animate-fade-in-up mb-6">
        <ExpenseChart points={monthlyTotals} year={chartYear} />
      </div>

      <div className="animate-fade-in-up">
        <ExpenseManager
          expenses={managedExpenses}
          branches={branches.filter((b) => b.active).map((b) => ({ id: b.id, name: b.name }))}
          employees={employees.filter((e) => e.active).map((e) => ({ id: e.id, name: e.name }))}
        />
      </div>
    </div>
  );
}
