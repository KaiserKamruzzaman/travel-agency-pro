import Link from "next/link";
import { toDateInputValue } from "@/lib/format";
import type { ReportPreset } from "@/lib/reports";

type Option = { id: string; name: string };

const inputClass =
  "rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
const labelClass = "mb-1 block text-xs font-medium text-slate-500";

function tabClass(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
    active
      ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-300/50"
      : "border border-slate-200 text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-slate-900"
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
        className="flex flex-wrap items-end gap-3 rounded-xl border border-sky-100 bg-white p-3 shadow-sm"
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
          className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm shadow-sky-300/50 transition-all hover:shadow-md active:scale-[0.98]"
        >
          Apply
        </button>
      </form>
    </div>
  );
}
