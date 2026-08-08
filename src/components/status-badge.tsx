import type { SaleStatus } from "@/generated/prisma/client";

const STATUS_STYLES: Record<SaleStatus, string> = {
  ISSUED: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
  REFUNDED: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  VOID: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
};

const STATUS_DOT: Record<SaleStatus, string> = {
  ISSUED: "bg-emerald-500",
  CANCELLED: "bg-slate-400",
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
