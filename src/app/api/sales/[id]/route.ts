import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireSession, saleScopeWhere, ApiError } from "@/lib/authz";
import { updateSaleSchema } from "@/lib/validation/sale";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { id } = await params;

    // AND the ownership/org scope directly into the lookup so a sale
    // outside a user's scope 404s instead of leaking a 403 (which would
    // confirm the record exists).
    const sale = await prisma.sale.findFirst({
      where: { id, ...saleScopeWhere(session.user) },
      include: {
        employee: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });
    if (!sale) throw new ApiError(404, "Sale not found");

    return NextResponse.json({ sale });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { id } = await params;

    // Requirements 3.1: employees can edit only their own sales. Owners
    // have view access in Phase 1, not edit access, over other people's
    // sale records.
    const existing = await prisma.sale.findFirst({
      where: { id, employeeId: session.user.id, organizationId: session.user.organizationId },
    });
    if (!existing) throw new ApiError(404, "Sale not found");

    const body = await req.json();
    const parsed = updateSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const sale = await prisma.sale.update({
      where: { id },
      data: {
        ...(data.passengerName !== undefined && { passengerName: data.passengerName }),
        ...(data.pnr !== undefined && { pnr: data.pnr || null }),
        ...(data.airline !== undefined && { airline: data.airline }),
        ...(data.origin !== undefined && { origin: data.origin }),
        ...(data.destination !== undefined && { destination: data.destination }),
        ...(data.travelDate !== undefined && { travelDate: data.travelDate }),
        ...(data.salePrice !== undefined && { salePrice: data.salePrice }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.paymentStatus !== undefined && { paymentStatus: data.paymentStatus }),
        ...(data.customerPhone !== undefined && { customerPhone: data.customerPhone || null }),
        ...(data.customerEmail !== undefined && { customerEmail: data.customerEmail || null }),
        ...(data.saleDate !== undefined && { saleDate: data.saleDate }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.status !== undefined && { status: data.status }),
        updatedById: session.user.id,
      },
    });

    return NextResponse.json({ sale });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

// Soft delete only — sales are voided, never hard-deleted, to preserve
// audit history (requirements section 7).
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const existing = await prisma.sale.findFirst({
      where: { id, employeeId: session.user.id, organizationId: session.user.organizationId },
    });
    if (!existing) throw new ApiError(404, "Sale not found");

    const sale = await prisma.sale.update({
      where: { id },
      data: { status: "VOID", updatedById: session.user.id },
    });

    return NextResponse.json({ sale });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
