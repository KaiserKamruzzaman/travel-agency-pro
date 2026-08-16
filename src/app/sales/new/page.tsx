import { requireSession } from "@/lib/authz";
import { listBranchesForOrg } from "@/lib/branches";
import { SaleForm } from "@/components/sale-form";

export default async function NewSalePage() {
  const session = await requireSession();
  const isOwner = session.user.role === "OWNER";

  const branches = isOwner
    ? (await listBranchesForOrg(session.user.organizationId))
        .filter((b) => b.active)
        .map((b) => ({ id: b.id, name: b.name }))
    : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="animate-fade-in-up mb-6 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">New sale</h1>
      <div className="animate-fade-in-up">
        <SaleForm mode="create" branches={branches} />
      </div>
    </div>
  );
}
