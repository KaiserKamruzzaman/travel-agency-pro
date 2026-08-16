import Link from "next/link";
import { SERVICE_TYPE_OPTIONS } from "@/lib/service-types";

type Option = { id: string; name: string };

const inputClass =
  "rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors focus:border-sky-400 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/40";
const labelClass = "mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400";

export type SalesFilterValues = {
  q?: string;
  from?: string;
  to?: string;
  branchId?: string;
  employeeId?: string;
  airline?: string;
  serviceType?: string;
  status?: string;
  paymentStatus?: string;
};

export function SalesFilters({
  isOwner,
  branches,
  employees,
  airlines,
  values,
  hasActiveFilters,
}: {
  isOwner: boolean;
  branches: Option[];
  employees: Option[];
  airlines: string[];
  values: SalesFilterValues;
  hasActiveFilters: boolean;
}) {
  return (
    <form
      method="get"
      action="/sales"
      className="animate-fade-in-up print:hidden mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm"
    >
      <div>
        <label className={labelClass} htmlFor="q">
          Search
        </label>
        <input
          id="q"
          name="q"
          type="text"
          placeholder="Name or PNR"
          defaultValue={values.q ?? ""}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="from">
          From
        </label>
        <input id="from" name="from" type="date" defaultValue={values.from ?? ""} className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="to">
          To
        </label>
        <input id="to" name="to" type="date" defaultValue={values.to ?? ""} className={inputClass} />
      </div>
      {isOwner && (
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
      )}
      {isOwner && (
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
      )}
      <div>
        <label className={labelClass} htmlFor="serviceType">
          Service
        </label>
        <select id="serviceType" name="serviceType" defaultValue={values.serviceType ?? ""} className={inputClass}>
          <option value="">All services</option>
          {SERVICE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="airline">
          Airline
        </label>
        <select id="airline" name="airline" defaultValue={values.airline ?? ""} className={inputClass}>
          <option value="">All airlines</option>
          {airlines.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="status">
          Status
        </label>
        <select id="status" name="status" defaultValue={values.status ?? ""} className={inputClass}>
          <option value="">All statuses</option>
          <option value="ISSUED">Issued</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUNDED">Refunded</option>
          <option value="VOID">Void</option>
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor="paymentStatus">
          Payment
        </label>
        <select id="paymentStatus" name="paymentStatus" defaultValue={values.paymentStatus ?? ""} className={inputClass}>
          <option value="">All payments</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partial</option>
          <option value="DUE">Due</option>
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
          <Link href="/sales" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
