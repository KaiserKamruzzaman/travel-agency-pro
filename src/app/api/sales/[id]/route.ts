import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { apiErrorResponse, requireSession, saleScopeWhere, ApiError } from "@/lib/authz";
import { updateSaleSchema } from "@/lib/validation/sale";
import { buildServiceAttributesSchema, isNonAirServiceType } from "@/lib/service-fields";

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

    // A partial update may not include serviceType at all — resolve it (and
    // the fields whose requiredness depends on it) against the existing
    // record before checking, since createSaleSchema's cross-field check
    // can't see prior state.
    const resolvedServiceType = data.serviceType ?? existing.serviceType;
    const isAirTicket = resolvedServiceType === "AIR_TICKET";
    let resolvedServiceAttributes: Prisma.InputJsonValue | null = null;
    if (isAirTicket) {
      const airline = data.airline !== undefined ? data.airline : existing.airline;
      const origin = data.origin !== undefined ? data.origin : existing.origin;
      const destination = data.destination !== undefined ? data.destination : existing.destination;
      if (!airline || !origin || !destination) {
        throw new ApiError(400, "Airline, origin, and destination are required for an air ticket sale");
      }
    } else if (isNonAirServiceType(resolvedServiceType)) {
      const rawAttributes = data.serviceAttributes !== undefined ? data.serviceAttributes : (existing.serviceAttributes ?? {});
      const result = buildServiceAttributesSchema(resolvedServiceType).safeParse(rawAttributes);
      if (!result.success) {
        throw new ApiError(400, result.error.issues.map((i) => i.message).join(", "));
      }
      resolvedServiceAttributes = result.data as Prisma.InputJsonValue;
    }

    const sale = await prisma.sale.update({
      where: { id },
      data: {
        ...(data.serviceType !== undefined && { serviceType: data.serviceType }),
        ...(data.passengerName !== undefined && { passengerName: data.passengerName }),
        ...(data.pnr !== undefined && { pnr: isAirTicket ? data.pnr || null : null }),
        ...(data.airline !== undefined && { airline: isAirTicket ? data.airline || null : null }),
        ...(data.origin !== undefined && { origin: isAirTicket ? data.origin || null : null }),
        ...(data.destination !== undefined && { destination: isAirTicket ? data.destination || null : null }),
        ...((data.serviceType !== undefined || data.serviceAttributes !== undefined) && {
          serviceAttributes: isAirTicket ? Prisma.JsonNull : (resolvedServiceAttributes as Prisma.InputJsonValue),
        }),
        // Switching serviceType must clear whichever side's fields the
        // client didn't resend, so a flip doesn't leave stale data behind.
        ...(data.serviceType !== undefined &&
          !isAirTicket && { pnr: null, airline: null, origin: null, destination: null }),
        ...(data.travelDate !== undefined && { travelDate: data.travelDate }),
        ...(data.tripType !== undefined && { tripType: isAirTicket ? data.tripType : "ONE_WAY" }),
        // Return date means "round-trip return" for AIR_TICKET (only kept
        // when tripType is ROUND_TRIP) but a plain optional end date
        // (check-out, coverage end, ...) for other service types.
        ...(data.serviceType !== undefined && {
          returnDate: isAirTicket ? (data.tripType === "ROUND_TRIP" ? (data.returnDate ?? null) : null) : (data.returnDate ?? null),
        }),
        ...(data.cabinClass !== undefined && { cabinClass: data.cabinClass }),
        ...(data.paxCount !== undefined && { paxCount: data.paxCount }),
        ...(data.supplier !== undefined && { supplier: data.supplier || null }),
        ...(data.salePrice !== undefined && { salePrice: data.salePrice }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.paymentStatus !== undefined && { paymentStatus: data.paymentStatus }),
        ...(data.amountPaid !== undefined && { amountPaid: data.amountPaid }),
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
