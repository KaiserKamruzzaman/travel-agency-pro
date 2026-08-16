export function SummaryCard({
  label,
  value,
  accent = "sky",
}: {
  label: string;
  value: string;
  accent?: "sky" | "blue" | "emerald" | "amber" | "rose";
}) {
  const barColor = {
    sky: "from-sky-400 to-blue-500",
    blue: "from-blue-500 to-indigo-500",
    emerald: "from-emerald-400 to-teal-500",
    amber: "from-amber-400 to-orange-500",
    rose: "from-rose-400 to-red-500",
  }[accent];

  return (
    <div className="group relative overflow-hidden rounded-xl border border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-sky-900/5">
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${barColor}`} />
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
