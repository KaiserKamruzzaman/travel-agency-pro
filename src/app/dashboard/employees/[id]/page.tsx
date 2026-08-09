import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { getEmployeeDetail } from "@/lib/dashboard";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { EditedIndicator } from "@/components/edited-indicator";
import { SummaryCard } from "@/components/summary-card";

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
          className="text-sm text-slate-500 hover:text-blue-600 hover:underline"
        >
          ← Back to {detail.employee.branch.name}
        </Link>
      )}
      <div className="animate-fade-in-up mt-2 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{detail.employee.name}</h1>
        <p className="text-sm text-slate-500">{detail.employee.email}</p>
      </div>

      <div className="animate-fade-in-up mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <SummaryCard label="Tickets (all time)" value={String(detail.tickets)} accent="sky" />
        <SummaryCard label="Revenue (all time)" value={formatMoney(detail.revenue)} accent="blue" />
        <SummaryCard label="Profit (all time)" value={formatMoney(detail.profit)} accent="emerald" />
        <SummaryCard label="Avg. sale value" value={formatMoney(detail.avgSale)} accent="amber" />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700">Sales history</h2>
      {detail.sales.length === 0 ? (
        <p className="text-sm text-slate-500">No sales yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-sky-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-sky-50/60 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Sale date</th>
                <th className="px-3 py-2 font-medium">Passenger</th>
                <th className="px-3 py-2 font-medium">Route</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Margin</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {detail.sales.map((sale) => {
                const margin = Number(sale.salePrice) - Number(sale.costPrice);
                return (
                  <tr key={sale.id} className="border-t border-slate-100 transition-colors hover:bg-sky-50/40">
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700">{formatDate(sale.saleDate)}</td>
                    <td className="px-3 py-2 text-slate-700">{sale.passengerName}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700">
                      {sale.origin} → {sale.destination}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700">{formatMoney(sale.salePrice.toString())}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700">{formatMoney(margin)}</td>
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
