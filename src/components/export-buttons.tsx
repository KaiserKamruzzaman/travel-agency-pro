"use client";

const buttonClass =
  "rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-slate-900";

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
