import { prisma } from "@/lib/prisma";
import type { Prisma, PaymentStatus, SaleStatus } from "@/generated/prisma/client";

export const SALES_PAGE_SIZE = 20;

export type SalesListFilters = {
  from?: Date;
  to?: Date; // exclusive upper bound
  branchId?: string;
  employeeId?: string;
  airline?: string;
  status?: SaleStatus;
  paymentStatus?: PaymentStatus;
  q?: string;
};

/** Layers list filters on top of a role-scoped `where` — never call with an unscoped base. */
export function buildSalesWhere(scope: Prisma.SaleWhereInput, filters: SalesListFilters): Prisma.SaleWhereInput {
  return {
    ...scope,
    ...((filters.from || filters.to) && {
      saleDate: {
        ...(filters.from && { gte: filters.from }),
        ...(filters.to && { lt: filters.to }),
      },
    }),
    ...(filters.branchId && { branchId: filters.branchId }),
    ...(filters.employeeId && { employeeId: filters.employeeId }),
    ...(filters.airline && { airline: filters.airline }),
    ...(filters.status && { status: filters.status }),
    ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
    ...(filters.q && {
      OR: [
        { passengerName: { contains: filters.q, mode: "insensitive" } },
        { pnr: { contains: filters.q, mode: "insensitive" } },
      ],
    }),
  };
}

export async function getPaginatedSales(where: Prisma.SaleWhereInput, page: number, pageSize = SALES_PAGE_SIZE) {
  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { saleDate: "desc" },
      include: {
        employee: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sale.count({ where }),
  ]);
  return { sales, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getDistinctAirlines(scope: Prisma.SaleWhereInput) {
  const rows = await prisma.sale.findMany({
    where: scope,
    select: { airline: true },
    distinct: ["airline"],
    orderBy: { airline: "asc" },
  });
  return rows.map((r) => r.airline);
}
