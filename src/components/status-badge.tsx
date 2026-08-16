import type { SaleStatus } from "@/generated/prisma/client";

const STATUS_STYLES: Record<SaleStatus, string> = {
  ISSUED: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-800",
  CANCELLED: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-inset ring-slate-200 dark:ring-slate-700",
  REFUNDED: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-200 dark:ring-amber-800",
  VOID: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 ring-1 ring-inset ring-rose-200 dark:ring-rose-800",
};

const STATUS_DOT: Record<SaleStatus, string> = {
  ISSUED: "bg-emerald-500",
  CANCELLED: "bg-slate-400 dark:bg-slate-500",
  REFUNDED: "bg-amber-500",
  VOID: "bg-rose-500",
};

export function StatusBadge({ status }: { status: SaleStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {status}
    </span>
  );
}
