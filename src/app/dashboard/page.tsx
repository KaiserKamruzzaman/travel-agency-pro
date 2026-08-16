import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { getEndOfDaySummary } from "@/lib/dashboard";
import { formatMoney } from "@/lib/format";
import { AutoRefresh } from "@/components/auto-refresh";
import { SummaryCard } from "@/components/summary-card";

export default async function DashboardPage() {
  const session = await requireSession();
  if (session.user.role !== "OWNER") redirect("/sales");

  const summary = await getEndOfDaySummary(session.user.organizationId);
  const flagCount = summary.flags.largeSales.length + summary.flags.statusChangesToday.length;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <AutoRefresh />
      <div className="animate-fade-in-up mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Today&apos;s overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            End-of-day summary across all branches. Refreshes automatically.
          </p>
        </div>
        <Link
          href="/reports?preset=today"
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          View full report for today →
        </Link>
      </div>

      <div className="animate-fade-in-up mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4" style={{ animationDelay: "60ms" }}>
        <SummaryCard label="Tickets sold today" value={String(summary.totalTickets)} accent="sky" />
        <SummaryCard label="Revenue today" value={formatMoney(summary.totalRevenue)} accent="blue" />
        <SummaryCard label="Profit today" value={formatMoney(summary.totalProfit)} accent="emerald" />
        <SummaryCard label="Avg. sale value" value={formatMoney(summary.avgSale)} accent="amber" />
      </div>

      {flagCount > 0 && (
        <div className="animate-fade-in-up mb-8 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 shadow-sm">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-900 dark:text-amber-200">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800/60 text-xs">!</span>
            Needs attention ({flagCount})
          </h2>
          <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
            {summary.flags.statusChangesToday.map((s) => (
              <li key={s.id}>
                {s.status === "REFUNDED" ? "Refund" : s.status === "CANCELLED" ? "Cancellation" : "Void"}:{" "}
                {s.passengerName} ({s.branch.name} / {s.employee.name}) — {formatMoney(s.salePrice.toString())}
              </li>
            ))}
            {summary.flags.largeSales.map((s) => (
              <li key={s.id}>
                Unusually large sale: {s.passengerName} ({s.branch.name} / {s.employee.name}) —{" "}
                {formatMoney(s.salePrice.toString())}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Breakdown by branch</h2>
      <div className="space-y-4">
        {summary.branchBreakdown.map((b, i) => (
          <div
            key={b.branch.id}
            className="animate-fade-in-up overflow-hidden rounded-xl border border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-shadow hover:shadow-md"
            style={{ animationDelay: `${100 + i * 60}ms` }}
          >
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-sky-100 dark:border-slate-700 bg-sky-50/60 dark:bg-sky-950/30 px-4 py-2.5">
              <Link href={`/dashboard/branches/${b.branch.id}`} className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400">
                {b.branch.name}
              </Link>
              <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">
                {b.tickets} tickets · {formatMoney(b.revenue)} revenue · {formatMoney(b.profit)} profit
              </span>
            </div>
            {b.employees.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">No employees assigned.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-2 font-medium">Employee</th>
                      <th className="px-4 py-2 font-medium">Tickets</th>
                      <th className="px-4 py-2 font-medium">Revenue</th>
                      <th className="px-4 py-2 font-medium">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.employees.map((e) => (
                      <tr key={e.employee.id} className="border-t border-slate-100 dark:border-slate-800 transition-colors hover:bg-sky-50/40 dark:hover:bg-sky-950/20">
                        <td className="px-4 py-2">
                          <Link
                            href={`/dashboard/employees/${e.employee.id}`}
                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {e.employee.name}
                          </Link>
                        </td>
                        <td className="px-4 py-2 tabular-nums text-slate-700 dark:text-slate-300">{e.tickets}</td>
                        <td className="px-4 py-2 tabular-nums text-slate-700 dark:text-slate-300">{formatMoney(e.revenue)}</td>
                        <td className="px-4 py-2 tabular-nums text-slate-700 dark:text-slate-300">{formatMoney(e.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
