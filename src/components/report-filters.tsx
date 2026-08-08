import Link from "next/link";
import { toDateInputValue } from "@/lib/format";
import type { ReportPreset } from "@/lib/reports";

type Option = { id: string; name: string };

const inputClass =
  "rounded-md border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900";
const labelClass = "mb-1 block text-xs font-medium text-neutral-500";

function tabClass(active: boolean) {
  return `rounded-md px-3 py-1.5 text-sm font-medium ${
    active
      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
      : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
  }`;
}

export function ReportFilters({
  preset,
  start,
  displayEnd,
  branchId,
  employeeId,
  branches,
  employees,
}: {
  preset: ReportPreset;
  start: Date;
  displayEnd: Date;
  branchId?: string;
  employeeId?: string;
  branches: Option[];
  employees: Option[];
}) {
  function presetHref(p: ReportPreset) {
    const params = new URLSearchParams({ preset: p });
    if (branchId) params.set("branchId", branchId);
    if (employeeId) params.set("employeeId", employeeId);
    return `/reports?${params.toString()}`;
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={presetHref("week")} className={tabClass(preset === "week")}>
          Last 7 days
        </Link>
        <Link href={presetHref("month")} className={tabClass(preset === "month")}>
          This month
        </Link>
        <Link href={presetHref("year")} className={tabClass(preset === "year")}>
          This year
        </Link>
        <Link href={presetHref("custom")} className={tabClass(preset === "custom")}>
          Custom
        </Link>
      </div>

      <form
        method="get"
        action="/reports"
        className="flex flex-wrap items-end gap-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
      >
        <input type="hidden" name="preset" value="custom" />
        <div>
          <label className={labelClass} htmlFor="start">
            From
          </label>
          <input id="start" type="date" name="start" defaultValue={toDateInputValue(start)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="end">
            To
          </label>
          <input id="end" type="date" name="end" defaultValue={toDateInputValue(displayEnd)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="branchId">
            Branch
          </label>
          <select id="branchId" name="branchId" defaultValue={branchId ?? ""} className={inputClass}>
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="employeeId">
            Employee
          </label>
          <select id="employeeId" name="employeeId" defaultValue={employeeId ?? ""} className={inputClass}>
            <option value="">All employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Apply
        </button>
      </form>
    </div>
  );
}
