import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/authz";
import { SaleForm, type SaleFormValues } from "@/components/sale-form";
import { toDateInputValue } from "@/lib/format";
import { serviceAttributesToFormValues } from "@/lib/service-fields";

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  // Only the employee who owns this sale can edit it (requirements 3.1).
  const sale = await prisma.sale.findFirst({
    where: { id, employeeId: session.user.id, organizationId: session.user.organizationId },
  });
  if (!sale) notFound();

  const initialValues: Partial<SaleFormValues> = {
    serviceType: sale.serviceType,
    passengerName: sale.passengerName,
    pnr: sale.pnr ?? "",
    airline: sale.airline ?? "",
    origin: sale.origin ?? "",
    destination: sale.destination ?? "",
    serviceAttributes: serviceAttributesToFormValues(sale.serviceAttributes),
    travelDate: toDateInputValue(sale.travelDate),
    tripType: sale.tripType,
    returnDate: sale.returnDate ? toDateInputValue(sale.returnDate) : "",
    cabinClass: sale.cabinClass,
    paxCount: sale.paxCount.toString(),
    supplier: sale.supplier ?? "",
    salePrice: sale.salePrice.toString(),
    costPrice: sale.costPrice.toString(),
    paymentStatus: sale.paymentStatus,
    amountPaid: sale.amountPaid.toString(),
    customerPhone: sale.customerPhone ?? "",
    customerEmail: sale.customerEmail ?? "",
    saleDate: toDateInputValue(sale.saleDate),
    status: sale.status,
    notes: sale.notes ?? "",
  };

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="animate-fade-in-up mb-6 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Edit sale</h1>
      <div className="animate-fade-in-up">
        <SaleForm mode="edit" saleId={sale.id} initialValues={initialValues} />
      </div>
    </div>
  );
}
