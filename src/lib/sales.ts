import { prisma } from "@/lib/prisma";
import type { Prisma, PaymentStatus, SaleStatus, ServiceType } from "@/generated/prisma/client";
import { SERVICE_TYPE_LABEL } from "@/lib/service-types";
import { formatServiceAttributes } from "@/lib/service-fields";

export const SALES_PAGE_SIZE = 20;

export type SalesListFilters = {
  from?: Date;
  to?: Date; // exclusive upper bound
  branchId?: string;
  employeeId?: string;
  airline?: string;
  serviceType?: ServiceType;
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
    ...(filters.serviceType && { serviceType: filters.serviceType }),
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
        updatedBy: { select: { id: true, name: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sale.count({ where }),
  ]);
  return { sales, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Unpaginated fetch for export — the CSV/print export must cover every matching sale, not just the current page. */
export async function getAllSales(where: Prisma.SaleWhereInput) {
  return prisma.sale.findMany({
    where,
    orderBy: { saleDate: "desc" },
    include: {
      employee: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
      updatedBy: { select: { id: true, name: true } },
    },
  });
}

type ExportableSale = Awaited<ReturnType<typeof getAllSales>>[number];

function csvField(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRow(fields: (string | number)[]): string {
  return fields.map(csvField).join(",") + "\r\n";
}

export function buildSalesCsv(sales: ExportableSale[]): string {
  let csv = csvRow([
    "Sale date",
    "Service type",
    "Name",
    "PNR",
    "Airline",
    "Origin",
    "Destination",
    "Service details",
    "Travel date",
    "Trip type",
    "Return date",
    "Cabin class",
    "Units",
    "Supplier",
    "Branch",
    "Employee",
    "Sale price",
    "Cost price",
    "Margin",
    "Payment status",
    "Amount paid",
    "Balance due",
    "Status",
    "Customer phone",
    "Customer email",
    "Notes",
    "Edited by",
    "Edited at",
  ]);
  for (const sale of sales) {
    const margin = Number(sale.salePrice) - Number(sale.costPrice);
    const balanceDue = Number(sale.salePrice) - Number(sale.amountPaid);
    csv += csvRow([
      sale.saleDate.toDateString(),
      SERVICE_TYPE_LABEL[sale.serviceType],
      sale.passengerName,
      sale.pnr ?? "",
      sale.airline ?? "",
      sale.origin ?? "",
      sale.destination ?? "",
      formatServiceAttributes(sale.serviceType, sale.serviceAttributes),
      sale.travelDate.toDateString(),
      sale.tripType,
      sale.returnDate ? sale.returnDate.toDateString() : "",
      sale.cabinClass,
      sale.paxCount,
      sale.supplier ?? "",
      sale.branch.name,
      sale.employee.name,
      Number(sale.salePrice).toFixed(2),
      Number(sale.costPrice).toFixed(2),
      margin.toFixed(2),
      sale.paymentStatus,
      Number(sale.amountPaid).toFixed(2),
      balanceDue.toFixed(2),
      sale.status,
      sale.customerPhone ?? "",
      sale.customerEmail ?? "",
      sale.notes ?? "",
      sale.updatedById ? sale.updatedBy?.name ?? "" : "",
      sale.updatedById ? sale.updatedAt.toDateString() : "",
    ]);
  }
  return csv;
}

export async function getDistinctAirlines(scope: Prisma.SaleWhereInput) {
  // Only AIR_TICKET sales carry an airline — other service types leave it
  // null, which would otherwise surface as a blank option in the filter.
  const rows = await prisma.sale.findMany({
    where: { ...scope, airline: { not: null } },
    select: { airline: true },
    distinct: ["airline"],
    orderBy: { airline: "asc" },
  });
  return rows.map((r) => r.airline as string);
}
