import { auth } from "@/auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function apiErrorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

/** Every authenticated API route must call this first — never trust a role/org id from the request body. */
export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError(401, "Not authenticated");
  }
  return session;
}

export async function requireOwner(): Promise<Session> {
  const session = await requireSession();
  if (session.user.role !== "OWNER") {
    throw new ApiError(403, "Owner access required");
  }
  return session;
}

/**
 * Scopes any sale query to what this user is allowed to see:
 * owners see their whole organization, employees see only their own sales.
 * Always AND this into a query's `where` — never rely on the UI to filter.
 */
export function saleScopeWhere(user: Session["user"]): Prisma.SaleWhereInput {
  if (user.role === "OWNER") {
    return { organizationId: user.organizationId };
  }
  return { organizationId: user.organizationId, employeeId: user.id };
}
