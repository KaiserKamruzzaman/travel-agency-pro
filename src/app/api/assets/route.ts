import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireOwner, ApiError } from "@/lib/authz";
import { createAssetSchema } from "@/lib/validation/asset";

// Fixed asset / equipment inventory — owner-only, same as branches/employees.
export async function POST(req: NextRequest) {
  try {
    const session = await requireOwner();

    const body = await req.json();
    const parsed = createAssetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }
    const data = parsed.data;

    const branch = await prisma.branch.findFirst({
      where: { id: data.branchId, organizationId: session.user.organizationId },
    });
    if (!branch) throw new ApiError(400, "Branch not found");

    if (data.assignedToId) {
      const assignee = await prisma.user.findFirst({
        where: { id: data.assignedToId, organizationId: session.user.organizationId },
      });
      if (!assignee) throw new ApiError(400, "Assignee not found");
    }

    const asset = await prisma.asset.create({
      data: {
        organizationId: session.user.organizationId,
        branchId: data.branchId,
        name: data.name,
        category: data.category,
        serialNumber: data.serialNumber || null,
        quantity: data.quantity,
        assignedToId: data.assignedToId || null,
        purchaseDate: data.purchaseDate,
        purchasePrice: data.purchasePrice,
        notes: data.notes || null,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
