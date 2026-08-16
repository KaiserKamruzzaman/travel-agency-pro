import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { getBranchDetail } from "@/lib/dashboard";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { EditedIndicator } from "@/components/edited-indicator";
import { SummaryCard } from "@/components/summary-card";
import { SERVICE_TYPE_LABEL } from "@/lib/service-types";

type PageProps = { params: Promise<{ id: string }> };

export default async function BranchDetailPage({ params }: PageProps) {
  const session = await requireSession();
  if (session.user.role !== "OWNER") redirect("/sales");

  const { id } = await params;
  const detail = await getBranchDetail(session.user.organizationId, id);
  if (!detail) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <Link href="/dashboard" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
        ← Back to dashboard
      </Link>
      <div className="animate-fade-in-up mt-2 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{detail.branch.name}</h1>
        {detail.branch.location && <p className="text-sm text-slate-500 dark:text-slate-400">{detail.branch.location}</p>}
      </div>

      <div className="animate-fade-in-up mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Tickets (all time)" value={String(detail.tickets)} accent="sky" />
        <SummaryCard label="Revenue (all time)" value={formatMoney(detail.revenue)} accent="blue" />
        <SummaryCard label="Profit (all time)" value={formatMoney(detail.profit)} accent="emerald" />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Employees</h2>
      <div className="mb-8 overflow-x-auto rounded-xl border border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-sky-50/60 dark:bg-sky-950/30 text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2 font-medium">Employee</th>
              <th className="px-3 py-2 font-medium">Tickets</th>
              <th className="px-3 py-2 font-medium">Revenue</th>
              <th className="px-3 py-2 font-medium">Profit</th>
            </tr>
          </thead>
          <tbody>
            {detail.employees.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400" colSpan={4}>
                  No employees assigned.
                </td>
              </tr>
            ) : (
              detail.employees.map((e) => (
                <tr key={e.employee.id} className="border-t border-slate-100 dark:border-slate-800 transition-colors hover:bg-sky-50/40 dark:hover:bg-sky-950/20">
                  <td className="px-3 py-2">
                    <Link href={`/dashboard/employees/${e.employee.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {e.employee.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{e.tickets}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{formatMoney(e.revenue)}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{formatMoney(e.profit)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">All sales</h2>
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
                <th className="hidden px-3 py-2 font-medium md:table-cell print:table-cell">Employee</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {detail.sales.map((sale) => (
                <tr key={sale.id} className="border-t border-slate-100 dark:border-slate-800 transition-colors hover:bg-sky-50/40 dark:hover:bg-sky-950/20">
                  <td className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{formatDate(sale.saleDate)}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{sale.passengerName}</td>
                  <td className="hidden px-3 py-2 text-slate-700 dark:text-slate-300 sm:table-cell print:table-cell">
                    {sale.serviceType === "AIR_TICKET"
                      ? `${sale.origin} → ${sale.destination}`
                      : SERVICE_TYPE_LABEL[sale.serviceType]}
                  </td>
                  <td className="hidden px-3 py-2 text-slate-700 dark:text-slate-300 md:table-cell print:table-cell">{sale.employee.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{formatMoney(sale.salePrice.toString())}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
