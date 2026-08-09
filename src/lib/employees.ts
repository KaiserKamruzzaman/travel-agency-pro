import { prisma } from "@/lib/prisma";

export async function listEmployeesForOrg(organizationId: string) {
  const employees = await prisma.user.findMany({
    where: { organizationId, role: "EMPLOYEE" },
    include: { branch: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });
  return employees.map((e) => ({
    id: e.id,
    name: e.name,
    email: e.email,
    active: e.active,
    branch: e.branch,
  }));
}
