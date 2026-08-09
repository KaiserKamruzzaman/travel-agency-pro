import Link from "next/link";

type Option = { id: string; name: string };

const inputClass =
  "rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
const labelClass = "mb-1 block text-xs font-medium text-slate-500";

export type AssetFilterValues = {
  branchId?: string;
  category?: string;
  status?: string;
};

export function AssetFilters({
  branches,
  categories,
  values,
  hasActiveFilters,
}: {
  branches: Option[];
  categories: string[];
  values: AssetFilterValues;
  hasActiveFilters: boolean;
}) {
  return (
    <form
      method="get"
      action="/dashboard/assets"
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
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
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
          <option value="IN_USE">In use</option>
          <option value="SPARE">Spare</option>
          <option value="UNDER_REPAIR">Under repair</option>
          <option value="RETIRED">Retired</option>
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
          <Link href="/dashboard/assets" className="text-sm text-slate-500 hover:text-blue-600 hover:underline">
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
