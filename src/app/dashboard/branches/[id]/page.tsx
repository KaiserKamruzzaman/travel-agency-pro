import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { getBranchDetail } from "@/lib/dashboard";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { SummaryCard } from "@/components/summary-card";

type PageProps = { params: Promise<{ id: string }> };

export default async function BranchDetailPage({ params }: PageProps) {
  const session = await requireSession();
  if (session.user.role !== "OWNER") redirect("/sales");

  const { id } = await params;
  const detail = await getBranchDetail(session.user.organizationId, id);
  if (!detail) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <Link href="/dashboard" className="text-sm text-neutral-500 hover:underline">
        ← Back to dashboard
      </Link>
      <div className="mt-2 mb-6">
        <h1 className="text-xl font-semibold">{detail.branch.name}</h1>
        {detail.branch.location && <p className="text-sm text-neutral-500">{detail.branch.location}</p>}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Tickets (all time)" value={String(detail.tickets)} />
        <SummaryCard label="Revenue (all time)" value={formatMoney(detail.revenue)} />
        <SummaryCard label="Profit (all time)" value={formatMoney(detail.profit)} />
      </div>

      <h2 className="mb-3 text-sm font-semibold">Employees</h2>
      <div className="mb-8 overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900">
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
                <td className="px-3 py-3 text-sm text-neutral-500" colSpan={4}>
                  No employees assigned.
                </td>
              </tr>
            ) : (
              detail.employees.map((e) => (
                <tr key={e.employee.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-3 py-2">
                    <Link href={`/dashboard/employees/${e.employee.id}`} className="text-blue-600 hover:underline">
                      {e.employee.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{e.tickets}</td>
                  <td className="px-3 py-2">{formatMoney(e.revenue)}</td>
                  <td className="px-3 py-2">{formatMoney(e.profit)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-sm font-semibold">All sales</h2>
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
                <th className="px-3 py-2 font-medium">Employee</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {detail.sales.map((sale) => (
                <tr key={sale.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(sale.saleDate)}</td>
                  <td className="px-3 py-2">{sale.passengerName}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {sale.origin} → {sale.destination}
                  </td>
                  <td className="px-3 py-2">{sale.employee.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatMoney(sale.salePrice.toString())}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={sale.status} />
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
