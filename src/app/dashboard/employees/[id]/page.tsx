import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { getEmployeeDetail } from "@/lib/dashboard";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { EditedIndicator } from "@/components/edited-indicator";
import { SummaryCard } from "@/components/summary-card";
import { SERVICE_TYPE_LABEL } from "@/lib/service-types";

type PageProps = { params: Promise<{ id: string }> };

export default async function EmployeeDetailPage({ params }: PageProps) {
  const session = await requireSession();
  if (session.user.role !== "OWNER") redirect("/sales");

  const { id } = await params;
  const detail = await getEmployeeDetail(session.user.organizationId, id);
  if (!detail) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      {detail.employee.branch && (
        <Link
          href={`/dashboard/branches/${detail.employee.branch.id}`}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
        >
          ← Back to {detail.employee.branch.name}
        </Link>
      )}
      <div className="animate-fade-in-up mt-2 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{detail.employee.name}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{detail.employee.email}</p>
      </div>

      <div className="animate-fade-in-up mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard label="Tickets (all time)" value={String(detail.tickets)} accent="sky" />
        <SummaryCard label="Revenue (all time)" value={formatMoney(detail.revenue)} accent="blue" />
        <SummaryCard label="Ticket margin (all time)" value={formatMoney(detail.profit)} accent="amber" />
        <SummaryCard label="Compensation (all time)" value={formatMoney(detail.compensation.total)} accent="rose" />
        <SummaryCard
          label="Net (margin − compensation)"
          value={formatMoney(detail.profit - detail.compensation.total)}
          accent="emerald"
        />
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Compensation</h2>
          <Link
            href={`/dashboard/expenses?employeeId=${detail.employee.id}`}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Add / manage →
          </Link>
        </div>
        {detail.compensation.entries.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No salary or other compensation recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-sky-50/60 dark:bg-sky-950/30 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {detail.compensation.entries.map((e) => (
                  <tr
                    key={e.id}
                    className={`border-t border-slate-100 dark:border-slate-800 transition-colors hover:bg-sky-50/40 dark:hover:bg-sky-950/20 ${e.voided ? "opacity-50" : ""}`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{formatDate(e.expenseDate)}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                      {e.description}
                      {e.voided && <span className="ml-2 text-xs text-rose-600 dark:text-rose-400">(voided)</span>}
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{e.category}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{formatMoney(e.amount.toString())}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Sales history</h2>
      {detail.sales.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No sales yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-sky-50/60 dark:bg-sky-950/30 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2 font-medium">Sale date</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell print:table-cell">Service</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="hidden px-3 py-2 font-medium md:table-cell print:table-cell">Margin</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {detail.sales.map((sale) => {
                const margin = Number(sale.salePrice) - Number(sale.costPrice);
                return (
                  <tr key={sale.id} className="border-t border-slate-100 dark:border-slate-800 transition-colors hover:bg-sky-50/40 dark:hover:bg-sky-950/20">
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{formatDate(sale.saleDate)}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{sale.passengerName}</td>
                    <td className="hidden px-3 py-2 text-slate-700 dark:text-slate-300 sm:table-cell print:table-cell">
                      {sale.serviceType === "AIR_TICKET"
                        ? `${sale.origin} → ${sale.destination}`
                        : SERVICE_TYPE_LABEL[sale.serviceType]}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{formatMoney(sale.salePrice.toString())}</td>
                    <td className="hidden px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300 md:table-cell print:table-cell">{formatMoney(margin)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={sale.status} />
                        <EditedIndicator
                          updatedAt={sale.updatedById ? sale.updatedAt : null}
                          updatedByName={sale.updatedBy?.name}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
