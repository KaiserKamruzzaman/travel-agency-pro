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
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <AutoRefresh />
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Today&apos;s overview</h1>
        <p className="text-sm text-neutral-500">
          End-of-day summary across all branches. Refreshes automatically.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <SummaryCard label="Tickets sold today" value={String(summary.totalTickets)} />
        <SummaryCard label="Revenue today" value={formatMoney(summary.totalRevenue)} />
        <SummaryCard label="Profit today" value={formatMoney(summary.totalProfit)} />
        <SummaryCard label="Avg. sale value" value={formatMoney(summary.avgSale)} />
      </div>

      {flagCount > 0 && (
        <div className="mb-8 rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <h2 className="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
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

      <h2 className="mb-3 text-sm font-semibold">Breakdown by branch</h2>
      <div className="space-y-4">
        {summary.branchBreakdown.map((b) => (
          <div key={b.branch.id} className="rounded-md border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900">
              <Link href={`/dashboard/branches/${b.branch.id}`} className="text-sm font-medium hover:underline">
                {b.branch.name}
              </Link>
              <span className="text-sm text-neutral-500">
                {b.tickets} tickets · {formatMoney(b.revenue)} revenue · {formatMoney(b.profit)} profit
              </span>
            </div>
            {b.employees.length === 0 ? (
              <p className="px-4 py-3 text-sm text-neutral-500">No employees assigned.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-neutral-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Employee</th>
                    <th className="px-4 py-2 font-medium">Tickets</th>
                    <th className="px-4 py-2 font-medium">Revenue</th>
                    <th className="px-4 py-2 font-medium">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {b.employees.map((e) => (
                    <tr key={e.employee.id} className="border-t border-neutral-100 dark:border-neutral-800">
                      <td className="px-4 py-2">
                        <Link
                          href={`/dashboard/employees/${e.employee.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {e.employee.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2">{e.tickets}</td>
                      <td className="px-4 py-2">{formatMoney(e.revenue)}</td>
                      <td className="px-4 py-2">{formatMoney(e.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
