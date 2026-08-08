import { redirect } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { SaleForm } from "@/components/sale-form";

export default async function NewSalePage() {
  const session = await requireSession();
  if (session.user.role !== "EMPLOYEE") {
    redirect("/sales");
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="animate-fade-in-up mb-6 text-2xl font-semibold tracking-tight text-slate-900">New sale</h1>
      <div className="animate-fade-in-up">
        <SaleForm mode="create" />
      </div>
    </div>
  );
}
