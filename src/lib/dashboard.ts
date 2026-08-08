import { prisma } from "@/lib/prisma";
import { sumRevenueAndCost } from "@/lib/sale-metrics";

// Server's local calendar day. No per-organization timezone field exists
// yet, so "today" is defined the same way the rest of the app defines
// "now" (new Date()) — acceptable for a single-deployment v1.
function todayRange(now: Date = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

// Sales priced well above today's average are flagged as worth a look —
// only meaningful once there's enough volume to establish a baseline.
const LARGE_SALE_MULTIPLIER = 2;
const LARGE_SALE_MIN_SAMPLE = 3;

export async function getEndOfDaySummary(organizationId: string) {
  const { start, end } = todayRange();

  const [branches, todaySales, statusChangesToday] = await Promise.all([
    prisma.branch.findMany({
      where: { organizationId },
      include: { users: { where: { role: "EMPLOYEE" }, select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.sale.findMany({
      where: { organizationId, saleDate: { gte: start, lt: end } },
      include: {
        employee: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { saleDate: "desc" },
    }),
    // Status changes (refund/cancel/void) applied today, even to sales
    // originally made on an earlier day.
    prisma.sale.findMany({
      where: {
        organizationId,
        status: { in: ["CANCELLED", "REFUNDED", "VOID"] },
        updatedAt: { gte: start, lt: end },
      },
      include: {
        employee: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const issuedToday = todaySales.filter((s) => s.status === "ISSUED");
  const { revenue: totalRevenue, profit: totalProfit } = sumRevenueAndCost(issuedToday);
  const totalTickets = issuedToday.length;
  const avgSale = totalTickets > 0 ? totalRevenue / totalTickets : 0;

  const largeSales =
    totalTickets >= LARGE_SALE_MIN_SAMPLE
      ? issuedToday.filter((s) => Number(s.salePrice) >= avgSale * LARGE_SALE_MULTIPLIER)
      : [];

  const branchBreakdown = branches.map((branch) => {
    const branchSales = issuedToday.filter((s) => s.branchId === branch.id);
    const employees = branch.users.map((employee) => {
      const employeeSales = branchSales.filter((s) => s.employeeId === employee.id);
      const { revenue, profit } = sumRevenueAndCost(employeeSales);
      return { employee, tickets: employeeSales.length, revenue, profit };
    });
    const { revenue, profit } = sumRevenueAndCost(branchSales);
    return {
      branch: { id: branch.id, name: branch.name },
      tickets: branchSales.length,
      revenue,
      profit,
      employees,
    };
  });

  return {
    totalTickets,
    totalRevenue,
    totalProfit,
    avgSale,
    branchBreakdown,
    flags: { largeSales, statusChangesToday },
  };
}

export async function getBranchDetail(organizationId: string, branchId: string) {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, organizationId },
    include: { users: { where: { role: "EMPLOYEE" }, select: { id: true, name: true } } },
  });
  if (!branch) return null;

  const sales = await prisma.sale.findMany({
    where: { organizationId, branchId },
    include: { employee: { select: { id: true, name: true } } },
    orderBy: { saleDate: "desc" },
  });

  const issued = sales.filter((s) => s.status === "ISSUED");
  const { revenue, profit } = sumRevenueAndCost(issued);

  const employees = branch.users.map((employee) => {
    const employeeIssued = issued.filter((s) => s.employeeId === employee.id);
    const totals = sumRevenueAndCost(employeeIssued);
    return { employee, tickets: employeeIssued.length, revenue: totals.revenue, profit: totals.profit };
  });

  return {
    branch: { id: branch.id, name: branch.name, location: branch.location },
    tickets: issued.length,
    revenue,
    profit,
    employees,
    sales,
  };
}

export async function getEmployeeDetail(organizationId: string, employeeId: string) {
  const employee = await prisma.user.findFirst({
    where: { id: employeeId, organizationId, role: "EMPLOYEE" },
    include: { branch: { select: { id: true, name: true } } },
  });
  if (!employee) return null;

  const sales = await prisma.sale.findMany({
    where: { organizationId, employeeId },
    orderBy: { saleDate: "desc" },
  });

  const issued = sales.filter((s) => s.status === "ISSUED");
  const { revenue, profit } = sumRevenueAndCost(issued);

  return {
    employee: { id: employee.id, name: employee.name, email: employee.email, branch: employee.branch },
    tickets: issued.length,
    revenue,
    profit,
    avgSale: issued.length > 0 ? revenue / issued.length : 0,
    sales,
  };
}
