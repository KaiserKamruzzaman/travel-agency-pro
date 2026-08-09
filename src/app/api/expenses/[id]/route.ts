import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireOwner, ApiError } from "@/lib/authz";
import { updateExpenseSchema } from "@/lib/validation/expense";

type RouteParams = { params: Promise<{ id: string }> };

// Voiding is a status change, not a delete — expenses are never hard-deleted,
// same soft-status pattern as Sale/Asset, so accounting history stays intact.
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireOwner();
    const { id } = await params;

    const existing = await prisma.expense.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });
    if (!existing) throw new ApiError(404, "Expense not found");

    const body = await req.json();
    const parsed = updateExpenseSchema.safeParse(body);
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

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(data.branchId !== undefined && { branchId: data.branchId || null }),
        ...(data.employeeId !== undefined && { employeeId: data.employeeId || null }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.expenseDate !== undefined && { expenseDate: data.expenseDate }),
        ...(data.voided !== undefined && { voided: data.voided }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
    });

    return NextResponse.json({ expense });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
