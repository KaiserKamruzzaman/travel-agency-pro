import { redirect } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { listBranchesForOrg } from "@/lib/branches";
import { BranchManager } from "@/components/branch-manager";

export default async function BranchesPage() {
  const session = await requireSession();
  if (session.user.role !== "OWNER") redirect("/sales");

  const branches = await listBranchesForOrg(session.user.organizationId);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="animate-fade-in-up mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Branches</h1>
        <p className="text-sm text-slate-500">Add branches, edit details, or archive locations you&apos;ve closed.</p>
      </div>
      <div className="animate-fade-in-up">
        <BranchManager branches={branches} />
      </div>
    </div>
  );
}
