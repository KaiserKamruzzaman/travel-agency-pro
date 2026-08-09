import Link from "next/link";

type Option = { id: string; name: string };

const inputClass =
  "rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
const labelClass = "mb-1 block text-xs font-medium text-slate-500";

const CATEGORY_LABEL: Record<string, string> = {
  SALARY: "Salary",
  RENT: "Rent",
  UTILITIES: "Utilities",
  MARKETING: "Marketing",
  SUPPLIES: "Supplies",
  OTHER: "Other",
};

const MONTH_LABEL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type ExpenseFilterValues = {
  branchId?: string;
  category?: string;
  employeeId?: string;
  year?: number;
  month?: number;
};

export function ExpenseFilters({
  branches,
  employees,
  years,
  values,
  hasActiveFilters,
}: {
  branches: Option[];
  employees: Option[];
  years: number[];
  values: ExpenseFilterValues;
  hasActiveFilters: boolean;
}) {
  return (
    <form
      method="get"
      action="/dashboard/expenses"
      className="animate-fade-in-up mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-sky-100 bg-white p-3 shadow-sm"
    >
      <div>
        <label className={labelClass} htmlFor="branchId">
          Branch
        </label>
        <select id="branchId" name="branchId" defaultValue={values.branchId ?? ""} className={inputClass}>
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="category">
          Category
        </label>
        <select id="category" name="category" defaultValue={values.category ?? ""} className={inputClass}>
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="employeeId">
          Employee
        </label>
        <select id="employeeId" name="employeeId" defaultValue={values.employeeId ?? ""} className={inputClass}>
          <option value="">All employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="year">
          Year
        </label>
        <select id="year" name="year" defaultValue={values.year ? String(values.year) : ""} className={inputClass}>
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="month">
          Month
        </label>
        <select id="month" name="month" defaultValue={values.month ? String(values.month) : ""} className={inputClass}>
          <option value="">All months</option>
          {MONTH_LABEL.map((label, i) => (
            <option key={label} value={i + 1}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm shadow-sky-300/50 transition-all hover:shadow-md active:scale-[0.98]"
        >
          Apply
        </button>
        {hasActiveFilters && (
          <Link href="/dashboard/expenses" className="text-sm text-slate-500 hover:text-blue-600 hover:underline">
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
