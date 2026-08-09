import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireOwner } from "@/lib/authz";
import { createBranchSchema } from "@/lib/validation/branch";

// Requirements 3.2: owner can add/edit/remove branches.
export async function POST(req: NextRequest) {
  try {
    const session = await requireOwner();

    const body = await req.json();
    const parsed = createBranchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }
    const data = parsed.data;

    const branch = await prisma.branch.create({
      data: {
        organizationId: session.user.organizationId,
        name: data.name,
        location: data.location || null,
      },
    });

    return NextResponse.json({ branch }, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
