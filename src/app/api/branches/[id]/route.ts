import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireOwner, ApiError } from "@/lib/authz";
import { updateBranchSchema } from "@/lib/validation/branch";

type RouteParams = { params: Promise<{ id: string }> };

// Requirements 3.2: owner can add/edit/remove branches. "Remove" archives
// (active: false) rather than deletes — sales and employees reference the
// branch, so hard-deleting it would break audit history.
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireOwner();
    const { id } = await params;

    const existing = await prisma.branch.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!existing) throw new ApiError(404, "Branch not found");

    const body = await req.json();
    const parsed = updateBranchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }
    const data = parsed.data;

    if (data.active === false) {
      const activeEmployeeCount = await prisma.user.count({
        where: { branchId: id, role: "EMPLOYEE", active: true },
      });
      if (activeEmployeeCount > 0) {
        throw new ApiError(400, "Reassign or deactivate this branch's employees before archiving it");
      }
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.location !== undefined && { location: data.location || null }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });

    return NextResponse.json({ branch });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
