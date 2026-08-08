import { redirect } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { SaleForm } from "@/components/sale-form";

export default async function NewSalePage() {
  const session = await requireSession();
  if (session.user.role !== "EMPLOYEE") {
    redirect("/sales");
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">New sale</h1>
      <SaleForm mode="create" />
    </div>
  );
}
