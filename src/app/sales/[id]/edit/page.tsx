import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/authz";
import { SaleForm, type SaleFormValues } from "@/components/sale-form";
import { toDateInputValue } from "@/lib/format";

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  // Only the employee who owns this sale can edit it (requirements 3.1).
  const sale = await prisma.sale.findFirst({
    where: { id, employeeId: session.user.id, organizationId: session.user.organizationId },
  });
  if (!sale) notFound();

  const initialValues: Partial<SaleFormValues> = {
    passengerName: sale.passengerName,
    pnr: sale.pnr ?? "",
    airline: sale.airline,
    origin: sale.origin,
    destination: sale.destination,
    travelDate: toDateInputValue(sale.travelDate),
    salePrice: sale.salePrice.toString(),
    costPrice: sale.costPrice.toString(),
    paymentStatus: sale.paymentStatus,
    customerPhone: sale.customerPhone ?? "",
    customerEmail: sale.customerEmail ?? "",
    saleDate: toDateInputValue(sale.saleDate),
    status: sale.status,
    notes: sale.notes ?? "",
  };

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Edit sale</h1>
      <SaleForm mode="edit" saleId={sale.id} initialValues={initialValues} />
    </div>
  );
}
