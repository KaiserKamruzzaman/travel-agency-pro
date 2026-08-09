import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireOwner, ApiError } from "@/lib/authz";
import { updateAssetSchema } from "@/lib/validation/asset";

type RouteParams = { params: Promise<{ id: string }> };

// Removal is a status change to RETIRED, not a delete — assets are never
// hard-deleted, matching the Branch/Sale soft-status pattern.
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireOwner();
    const { id } = await params;

    const existing = await prisma.asset.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!existing) throw new ApiError(404, "Asset not found");

    const body = await req.json();
    const parsed = updateAssetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }
    const data = parsed.data;

    if (data.branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: data.branchId, organizationId: session.user.organizationId },
      });
      if (!branch) throw new ApiError(400, "Branch not found");
    }

    if (data.assignedToId) {
      const assignee = await prisma.user.findFirst({
        where: { id: data.assignedToId, organizationId: session.user.organizationId },
      });
      if (!assignee) throw new ApiError(400, "Assignee not found");
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        ...(data.branchId !== undefined && { branchId: data.branchId }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber || null }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId || null }),
        ...(data.purchaseDate !== undefined && { purchaseDate: data.purchaseDate }),
        ...(data.purchasePrice !== undefined && { purchasePrice: data.purchasePrice }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
    });

    return NextResponse.json({ asset });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
