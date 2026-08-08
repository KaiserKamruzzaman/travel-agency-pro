import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { getEmployeeDetail } from "@/lib/dashboard";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { SummaryCard } from "@/components/summary-card";

type PageProps = { params: Promise<{ id: string }> };

export default async function EmployeeDetailPage({ params }: PageProps) {
  const session = await requireSession();
  if (session.user.role !== "OWNER") redirect("/sales");

  const { id } = await params;
  const detail = await getEmployeeDetail(session.user.organizationId, id);
  if (!detail) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      {detail.employee.branch && (
        <Link
          href={`/dashboard/branches/${detail.employee.branch.id}`}
          className="text-sm text-neutral-500 hover:underline"
        >
          ← Back to {detail.employee.branch.name}
        </Link>
      )}
      <div className="mt-2 mb-6">
        <h1 className="text-xl font-semibold">{detail.employee.name}</h1>
        <p className="text-sm text-neutral-500">{detail.employee.email}</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <SummaryCard label="Tickets (all time)" value={String(detail.tickets)} />
        <SummaryCard label="Revenue (all time)" value={formatMoney(detail.revenue)} />
        <SummaryCard label="Profit (all time)" value={formatMoney(detail.profit)} />
        <SummaryCard label="Avg. sale value" value={formatMoney(detail.avgSale)} />
      </div>

      <h2 className="mb-3 text-sm font-semibold">Sales history</h2>
      {detail.sales.length === 0 ? (
        <p className="text-sm text-neutral-500">No sales yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900">
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
                  <tr key={sale.id} className="border-t border-neutral-200 dark:border-neutral-800">
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(sale.saleDate)}</td>
                    <td className="px-3 py-2">{sale.passengerName}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {sale.origin} → {sale.destination}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatMoney(sale.salePrice.toString())}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatMoney(margin)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={sale.status} />
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
