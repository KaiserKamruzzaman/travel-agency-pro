import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireOwner, ApiError } from "@/lib/authz";
import { createExpenseSchema } from "@/lib/validation/expense";

// Operating costs (salary, rent, utilities, ...) — owner-only, same as assets/branches/employees.
export async function POST(req: NextRequest) {
  try {
    const session = await requireOwner();

    const body = await req.json();
    const parsed = createExpenseSchema.safeParse(body);
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

    if (data.employeeId) {
      const employee = await prisma.user.findFirst({
        where: { id: data.employeeId, organizationId: session.user.organizationId },
      });
      if (!employee) throw new ApiError(400, "Employee not found");
    }

    const expense = await prisma.expense.create({
      data: {
        organizationId: session.user.organizationId,
        branchId: data.branchId || null,
        employeeId: data.employeeId || null,
        category: data.category,
        description: data.description,
        amount: data.amount,
        expenseDate: data.expenseDate,
        notes: data.notes || null,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
