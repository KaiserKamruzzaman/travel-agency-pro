import Link from "next/link";
import { requireSession, saleScopeWhere } from "@/lib/authz";
import { getOrgFilterOptions } from "@/lib/reports";
import { buildSalesWhere, getDistinctAirlines, getPaginatedSales, SALES_PAGE_SIZE } from "@/lib/sales";
import { formatDate, formatMoney } from "@/lib/format";
import { VoidSaleButton } from "@/components/void-sale-button";
import { StatusBadge } from "@/components/status-badge";
import { SalesFilters } from "@/components/sales-filters";
import { Pagination } from "@/components/pagination";
import { ExportButtons } from "@/components/export-buttons";
import { PaymentStatus, SaleStatus } from "@/generated/prisma/client";

type SearchParams = { [key: string]: string | string[] | undefined };
type PageProps = { searchParams: Promise<SearchParams> };

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function salesExportParams(values: Record<string, string | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  return params;
}

export default async function SalesPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const isOwner = session.user.role === "OWNER";

  const sp = await searchParams;
  const q = firstParam(sp.q) || undefined;
  const fromParam = firstParam(sp.from) || undefined;
  const toParam = firstParam(sp.to) || undefined;
  const branchId = isOwner ? firstParam(sp.branchId) || undefined : undefined;
  const employeeId = isOwner ? firstParam(sp.employeeId) || undefined : undefined;
  const airline = firstParam(sp.airline) || undefined;
  const statusParam = firstParam(sp.status);
  const status = statusParam && (Object.values(SaleStatus) as string[]).includes(statusParam)
    ? (statusParam as SaleStatus)
    : undefined;
  const paymentStatusParam = firstParam(sp.paymentStatus);
  const paymentStatus =
    paymentStatusParam && (Object.values(PaymentStatus) as string[]).includes(paymentStatusParam)
      ? (paymentStatusParam as PaymentStatus)
      : undefined;

  const from = parseDate(fromParam);
  const toRaw = parseDate(toParam);
  const to = toRaw ? new Date(toRaw.getFullYear(), toRaw.getMonth(), toRaw.getDate() + 1) : undefined;

  const pageParam = Number(firstParam(sp.page));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const scope = saleScopeWhere(session.user);
  const where = buildSalesWhere(scope, { from, to, branchId, employeeId, airline, status, paymentStatus, q });

  const [{ sales, total, pageCount }, filterOptions, airlines] = await Promise.all([
    getPaginatedSales(where, page),
    isOwner ? getOrgFilterOptions(session.user.organizationId) : Promise.resolve({ branches: [], employees: [] }),
    getDistinctAirlines(scope),
  ]);

  const hasActiveFilters = Boolean(
    q || fromParam || toParam || branchId || employeeId || airline || status || paymentStatus,
  );

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="animate-fade-in-up mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{isOwner ? "All sales" : "My sales"}</h1>
          <p className="text-sm text-slate-500">
            {isOwner
              ? "Organization-wide view across all branches and employees."
              : "Sales you've entered."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons
            csvHref={`/api/sales/export?${salesExportParams({
              q,
              from: fromParam,
              to: toParam,
              branchId,
              employeeId,
              airline,
              status,
              paymentStatus,
            }).toString()}`}
          />
          {!isOwner && (
            <Link
              href="/sales/new"
              className="print:hidden rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-300/50 transition-all hover:shadow-md active:scale-[0.98]"
            >
              + New sale
            </Link>
          )}
        </div>
      </div>

      <SalesFilters
        isOwner={isOwner}
        branches={filterOptions.branches}
        employees={filterOptions.employees}
        airlines={airlines}
        values={{
          q,
          from: fromParam,
          to: toParam,
          branchId,
          employeeId,
          airline,
          status,
          paymentStatus,
        }}
        hasActiveFilters={hasActiveFilters}
      />

      {sales.length === 0 ? (
        <p className="animate-fade-in-up text-sm text-slate-500">No sales match these filters.</p>
      ) : (
        <div className="animate-fade-in-up overflow-x-auto rounded-xl border border-sky-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-sky-50/60 text-slate-500">
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
                {!isOwner && <th className="px-3 py-2 font-medium print:hidden">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => {
                const margin = Number(sale.salePrice) - Number(sale.costPrice);
                const isMine = sale.employeeId === session.user.id;
                return (
                  <tr key={sale.id} className="border-t border-slate-100 transition-colors hover:bg-sky-50/40">
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700">{formatDate(sale.saleDate)}</td>
                    <td className="px-3 py-2 text-slate-700">{sale.passengerName}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700">
                      {sale.origin} → {sale.destination}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{sale.airline}</td>
                    {isOwner && <td className="px-3 py-2 text-slate-700">{sale.branch.name}</td>}
                    {isOwner && <td className="px-3 py-2 text-slate-700">{sale.employee.name}</td>}
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700">{formatMoney(sale.salePrice.toString())}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-700">{formatMoney(margin)}</td>
                    <td className="px-3 py-2 text-slate-700">{sale.paymentStatus}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={sale.status} />
                    </td>
                    {!isOwner && (
                      <td className="px-3 py-2 print:hidden">
                        {isMine && sale.status !== "VOID" && (
                          <div className="flex items-center gap-3">
                            <Link href={`/sales/${sale.id}/edit`} className="text-sm font-medium text-blue-600 hover:underline">
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

      <Pagination
        basePath="/sales"
        searchParams={{ q, from: fromParam, to: toParam, branchId, employeeId, airline, status, paymentStatus }}
        page={page}
        pageCount={pageCount}
        total={total}
        pageSize={SALES_PAGE_SIZE}
        resultCount={sales.length}
      />
    </div>
  );
}
