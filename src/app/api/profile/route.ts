import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireSession, ApiError } from "@/lib/authz";
import { changePasswordSchema } from "@/lib/validation/profile";
import { hashPassword, verifyPassword } from "@/lib/password";

// Self-service password change for any logged-in user. Owner account
// creation happens outside the app (seed/db), so this is the only way an
// owner can ever change their own password once deployed.
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
    }
    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) throw new ApiError(404, "Account not found");

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) throw new ApiError(400, "Current password is incorrect");

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
