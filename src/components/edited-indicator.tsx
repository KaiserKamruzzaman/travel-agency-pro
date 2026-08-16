import { formatDate } from "@/lib/format";

/**
 * updatedById is only ever set by a PATCH/void — never on create — so its
 * presence is an unambiguous "has this been touched since entry" signal.
 * (Comparing createdAt vs. updatedAt directly is not reliable: Prisma's
 * @updatedAt is stamped client-side while createdAt's default is evaluated
 * by Postgres, so the two can differ by a few ms on creation alone.)
 */
export function EditedIndicator({
  updatedAt,
  updatedByName,
}: {
  updatedAt: Date | null;
  updatedByName?: string | null;
}) {
  if (!updatedAt) return null;
  return (
    <span
      className="text-xs whitespace-nowrap text-amber-600 dark:text-amber-400"
      title={updatedByName ? `Edited by ${updatedByName}` : undefined}
    >
      Edited {formatDate(updatedAt)}
    </span>
  );
}
