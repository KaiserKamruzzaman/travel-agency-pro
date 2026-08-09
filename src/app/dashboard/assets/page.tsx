import { redirect } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { listAssetsForOrg, listAssetCategoriesForOrg } from "@/lib/assets";
import { listBranchesForOrg } from "@/lib/branches";
import { listEmployeesForOrg } from "@/lib/employees";
import { AssetFilters } from "@/components/asset-filters";
import { AssetManager } from "@/components/asset-manager";
import { AssetStatus } from "@/generated/prisma/client";

type SearchParams = { [key: string]: string | string[] | undefined };
type PageProps = { searchParams: Promise<SearchParams> };

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AssetsPage({ searchParams }: PageProps) {
  const session = await requireSession();
  if (session.user.role !== "OWNER") redirect("/sales");

  const sp = await searchParams;
  const branchId = firstParam(sp.branchId) || undefined;
  const category = firstParam(sp.category) || undefined;
  const statusParam = firstParam(sp.status);
  const status = statusParam && (Object.values(AssetStatus) as string[]).includes(statusParam)
    ? (statusParam as AssetStatus)
    : undefined;

  const [assets, branches, employees, categories] = await Promise.all([
    listAssetsForOrg(session.user.organizationId, { branchId, category, status }),
    listBranchesForOrg(session.user.organizationId),
    listEmployeesForOrg(session.user.organizationId),
    listAssetCategoriesForOrg(session.user.organizationId),
  ]);

  const managedAssets = assets.map((a) => ({
    id: a.id,
    name: a.name,
    category: a.category,
    serialNumber: a.serialNumber,
    quantity: a.quantity,
    status: a.status,
    branch: a.branch,
    assignedTo: a.assignedTo,
    purchaseDate: a.purchaseDate ? a.purchaseDate.toISOString() : null,
    purchasePrice: a.purchasePrice ? a.purchasePrice.toString() : null,
    notes: a.notes,
  }));

  const hasActiveFilters = Boolean(branchId || category || status);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="animate-fade-in-up mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Assets</h1>
        <p className="text-sm text-slate-500">
          Track office equipment and furniture across branches — computers, printers, scanners, mobiles, and more.
        </p>
      </div>

      <AssetFilters
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
        categories={categories}
        values={{ branchId, category, status }}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="animate-fade-in-up">
        <AssetManager
          assets={managedAssets}
          branches={branches.filter((b) => b.active).map((b) => ({ id: b.id, name: b.name }))}
          employees={employees.filter((e) => e.active).map((e) => ({ id: e.id, name: e.name }))}
        />
      </div>
    </div>
  );
}
