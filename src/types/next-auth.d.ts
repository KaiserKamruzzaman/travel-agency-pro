import type { Role } from "@/generated/prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      organizationId: string;
      branchId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    organizationId: string;
    branchId: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    organizationId: string;
    branchId: string | null;
  }
}
