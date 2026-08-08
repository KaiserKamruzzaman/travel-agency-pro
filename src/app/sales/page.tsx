import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession, saleScopeWhere } from "@/lib/authz";
import { formatDate, formatMoney } from "@/lib/format";
import { VoidSaleButton } from "@/components/void-sale-button";

const STATUS_STYLES: Record<string, string> = {
  ISSUED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  CANCELLED: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  REFUNDED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  VOID: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default async function SalesPage() {
  const session = await requireSession();
  const isOwner = session.user.role === "OWNER";

  const sales = await prisma.sale.findMany({
    where: saleScopeWhere(session.user),
    orderBy: { saleDate: "desc" },
    include: {
      employee: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{isOwner ? "All sales" : "My sales"}</h1>
          <p className="text-sm text-neutral-500">
            {isOwner
              ? "Organization-wide view across all branches and employees."
              : "Sales you've entered."}
          </p>
        </div>
        {!isOwner && (
          <Link
            href="/sales/new"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            + New sale
          </Link>
        )}
      </div>

      {sales.length === 0 ? (
        <p className="text-sm text-neutral-500">No sales yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="px-3 py-2 font-medium">Sale date</th>
                <th className="px-3 py-2 font-medium">Passenger</th>
                <th className="px-3 py-2 font-medium">Route</th>
                <th className="px-3 py-2 font-medium">Airline</th>
                {isOwner && <th className="px-3 py-2 font-medium">Branch</th>}
                {isOwner && <th className="px-3 py-2 font-medium">Employee</th>}
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Margin</th>
                <th className="px-3 py-2 font-medium">Payment</th>
                <th className="px-3 py-2 font-medium">Status</th>
                {!isOwner && <th className="px-3 py-2 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => {
                const margin = Number(sale.salePrice) - Number(sale.costPrice);
                const isMine = sale.employeeId === session.user.id;
                return (
                  <tr key={sale.id} className="border-t border-neutral-200 dark:border-neutral-800">
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(sale.saleDate)}</td>
                    <td className="px-3 py-2">{sale.passengerName}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {sale.origin} → {sale.destination}
                    </td>
                    <td className="px-3 py-2">{sale.airline}</td>
                    {isOwner && <td className="px-3 py-2">{sale.branch.name}</td>}
                    {isOwner && <td className="px-3 py-2">{sale.employee.name}</td>}
                    <td className="px-3 py-2 whitespace-nowrap">{formatMoney(sale.salePrice.toString())}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatMoney(margin)}</td>
                    <td className="px-3 py-2">{sale.paymentStatus}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[sale.status]}`}>
                        {sale.status}
                      </span>
                    </td>
                    {!isOwner && (
                      <td className="px-3 py-2">
                        {isMine && sale.status !== "VOID" && (
                          <div className="flex items-center gap-3">
                            <Link href={`/sales/${sale.id}/edit`} className="text-sm text-blue-600 hover:underline">
                              Edit
                            </Link>
                            <VoidSaleButton saleId={sale.id} />
                          </div>
                        )}
                      </td>
                    )}
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
