import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireSession, saleScopeWhere, ApiError } from "@/lib/authz";
import { createSaleSchema } from "@/lib/validation/sale";

export async function GET() {
  try {
    const session = await requireSession();

    const sales = await prisma.sale.findMany({
      where: saleScopeWhere(session.user),
      orderBy: { saleDate: "desc" },
      include: {
        employee: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ sales });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    // Only employees/agents enter their own sales (requirements 3.1, 4.1).
    // Owners have organization-wide *view* access but do not author sales.
    if (session.user.role !== "EMPLOYEE") {
      throw new ApiError(403, "Only employees can create sale records");
    }
    if (!session.user.branchId) {
      throw new ApiError(400, "Your account is not assigned to a branch");
    }

    const body = await req.json();
    const parsed = createSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const sale = await prisma.sale.create({
      data: {
        organizationId: session.user.organizationId,
        branchId: session.user.branchId,
        employeeId: session.user.id,
        passengerName: data.passengerName,
        pnr: data.pnr || null,
        airline: data.airline,
        origin: data.origin,
        destination: data.destination,
        travelDate: data.travelDate,
        salePrice: data.salePrice,
        costPrice: data.costPrice,
        paymentStatus: data.paymentStatus,
        customerPhone: data.customerPhone || null,
        customerEmail: data.customerEmail || null,
        saleDate: data.saleDate,
        notes: data.notes || null,
        source: data.source,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ sale }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
