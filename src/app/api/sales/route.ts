import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireSession, ApiError } from "@/lib/authz";
import { createSaleSchema } from "@/lib/validation/sale";

// No GET here — the sales list pages (owner and employee) read directly via
// lib/sales.ts's paginated/filtered queries server-side. An unpaginated
// "give me every sale" endpoint isn't something any page needs, and would be
// an easy footgun for an org with a large sales history.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    const body = await req.json();
    const parsed = createSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const data = parsed.data;

    // Employees always sell out of their own branch — never trust a
    // client-supplied branchId for them. Owners aren't tied to a branch, so
    // they pick one on the form instead (requirements 3.1/3.2 — owners can
    // now author sales too, on top of their view/manage access).
    let branchId: string;
    if (session.user.role === "EMPLOYEE") {
      if (!session.user.branchId) {
        throw new ApiError(400, "Your account is not assigned to a branch");
      }
      branchId = session.user.branchId;
    } else {
      if (!data.branchId) {
        throw new ApiError(400, "Select a branch");
      }
      const branch = await prisma.branch.findFirst({
        where: { id: data.branchId, organizationId: session.user.organizationId, active: true },
      });
      if (!branch) throw new ApiError(400, "Branch not found");
      branchId = branch.id;
    }

    const sale = await prisma.sale.create({
      data: {
        organizationId: session.user.organizationId,
        branchId,
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
