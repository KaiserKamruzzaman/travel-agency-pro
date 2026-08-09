import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireOwner, ApiError } from "@/lib/authz";
import { updateEmployeeSchema } from "@/lib/validation/employee";
import { hashPassword } from "@/lib/password";

type RouteParams = { params: Promise<{ id: string }> };

// Requirements 3.2: owner can add/edit/remove employee accounts, assigned to
// a branch. "Remove" deactivates (active: false) rather than deletes — sales
// reference the employee, so hard-deleting would break audit history.
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireOwner();
    const { id } = await params;

    const existing = await prisma.user.findFirst({
      where: { id, organizationId: session.user.organizationId, role: "EMPLOYEE" },
    });
    if (!existing) throw new ApiError(404, "Employee not found");

    const body = await req.json();
    const parsed = updateEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }
    const data = parsed.data;

    if (data.branchId !== undefined) {
      const branch = await prisma.branch.findFirst({
        where: { id: data.branchId, organizationId: session.user.organizationId, active: true },
      });
      if (!branch) throw new ApiError(400, "Branch not found");
    }

    const employee = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.branchId !== undefined && { branchId: data.branchId }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.password !== undefined && { passwordHash: await hashPassword(data.password) }),
      },
    });

    return NextResponse.json({ employee: { id: employee.id, name: employee.name, email: employee.email } });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
