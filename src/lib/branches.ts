import { prisma } from "@/lib/prisma";

export async function listBranchesForOrg(organizationId: string) {
  const branches = await prisma.branch.findMany({
    where: { organizationId },
    include: { _count: { select: { users: { where: { role: "EMPLOYEE", active: true } } } } },
    orderBy: { name: "asc" },
  });
  return branches.map((b) => ({
    id: b.id,
    name: b.name,
    location: b.location,
    active: b.active,
    activeEmployeeCount: b._count.users,
  }));
}
