import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, requireSession, saleScopeWhere } from "@/lib/authz";
import { buildSalesCsv, buildSalesWhere, getAllSales } from "@/lib/sales";
import { toDateInputValue } from "@/lib/format";
import { PaymentStatus, SaleStatus, ServiceType } from "@/generated/prisma/client";

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const isOwner = session.user.role === "OWNER";

    const sp = req.nextUrl.searchParams;
    const q = sp.get("q") || undefined;
    const fromParam = sp.get("from");
    const toParam = sp.get("to");
    // branchId/employeeId are owner-only drill-downs, same as the /sales page —
    // an employee-supplied value here must never widen their own scope.
    const branchId = isOwner ? sp.get("branchId") || undefined : undefined;
    const employeeId = isOwner ? sp.get("employeeId") || undefined : undefined;
    const airline = sp.get("airline") || undefined;
    const serviceTypeParam = sp.get("serviceType");
    const serviceType =
      serviceTypeParam && (Object.values(ServiceType) as string[]).includes(serviceTypeParam)
        ? (serviceTypeParam as ServiceType)
        : undefined;
    const statusParam = sp.get("status");
    const status =
      statusParam && (Object.values(SaleStatus) as string[]).includes(statusParam)
        ? (statusParam as SaleStatus)
        : undefined;
    const paymentStatusParam = sp.get("paymentStatus");
    const paymentStatus =
      paymentStatusParam && (Object.values(PaymentStatus) as string[]).includes(paymentStatusParam)
        ? (paymentStatusParam as PaymentStatus)
        : undefined;

    const from = parseDate(fromParam);
    const toRaw = parseDate(toParam);
    const to = toRaw ? new Date(toRaw.getFullYear(), toRaw.getMonth(), toRaw.getDate() + 1) : undefined;

    const scope = saleScopeWhere(session.user);
    const where = buildSalesWhere(scope, { from, to, branchId, employeeId, airline, serviceType, status, paymentStatus, q });

    const sales = await getAllSales(where);
    const csv = buildSalesCsv(sales);
    const filename = `sales_export_${toDateInputValue(new Date())}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
