import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireOwner, ApiError } from "@/lib/authz";
import { createEmployeeSchema } from "@/lib/validation/employee";
import { hashPassword } from "@/lib/password";

// Requirements 3.2: owner can add/edit/remove employee accounts, assigned to
// a branch. Role is always EMPLOYEE here — owner accounts are provisioned
// outside this flow.
export async function POST(req: NextRequest) {
  try {
    const session = await requireOwner();

    const body = await req.json();
    const parsed = createEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }
    const data = parsed.data;

    const branch = await prisma.branch.findFirst({
      where: { id: data.branchId, organizationId: session.user.organizationId },
    });
    if (!branch) throw new ApiError(400, "Branch not found");

    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) throw new ApiError(409, "An account with this email already exists");

    const passwordHash = await hashPassword(data.password);
    const employee = await prisma.user.create({
      data: {
        organizationId: session.user.organizationId,
        branchId: data.branchId,
        name: data.name,
        email: data.email,
        passwordHash,
        role: "EMPLOYEE",
      },
    });

    return NextResponse.json({ employee: { id: employee.id, name: employee.name, email: employee.email } }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
