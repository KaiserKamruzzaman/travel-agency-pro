import { prisma } from "@/lib/prisma";
import type { AssetStatus } from "@/generated/prisma/client";

export type AssetListFilters = {
  branchId?: string;
  category?: string;
  status?: AssetStatus;
};

export async function listAssetsForOrg(organizationId: string, filters: AssetListFilters = {}) {
  const assets = await prisma.asset.findMany({
    where: {
      organizationId,
      ...(filters.branchId && { branchId: filters.branchId }),
      ...(filters.category && { category: filters.category }),
      ...(filters.status && { status: filters.status }),
    },
    include: {
      branch: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: [{ branch: { name: "asc" } }, { name: "asc" }],
  });
  return assets;
}

export async function listAssetCategoriesForOrg(organizationId: string) {
  const rows = await prisma.asset.findMany({
    where: { organizationId },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category);
}
