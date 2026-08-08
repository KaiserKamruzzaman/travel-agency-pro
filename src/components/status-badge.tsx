import type { SaleStatus } from "@/generated/prisma/client";

const STATUS_STYLES: Record<SaleStatus, string> = {
  ISSUED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  CANCELLED: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  REFUNDED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  VOID: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function StatusBadge({ status }: { status: SaleStatus }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}
