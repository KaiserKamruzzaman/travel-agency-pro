"use client";

const buttonClass =
  "rounded-lg border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 shadow-sm transition-colors hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-slate-900 dark:hover:text-slate-100";

export function ExportButtons({ csvHref }: { csvHref: string }) {
  return (
    <div className="flex items-center gap-2 print:hidden">
      <a href={csvHref} className={buttonClass}>
        Download CSV
      </a>
      <button type="button" onClick={() => window.print()} className={buttonClass}>
        Print / Save PDF
      </button>
    </div>
  );
}
