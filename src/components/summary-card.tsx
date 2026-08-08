export function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
