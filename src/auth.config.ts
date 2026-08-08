import type { NextAuthConfig } from "next-auth";

// Edge-safe base config (no Prisma/bcrypt) so middleware, which runs in the
// Edge runtime, doesn't bundle Node-only code. The Credentials provider
// itself (which does touch Prisma) is added on top of this in src/auth.ts,
// which is only ever used from Node runtimes (route handlers, server
// components, server actions) — never from middleware.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.branchId = user.branchId;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.organizationId = token.organizationId;
      session.user.branchId = token.branchId;
      return session;
    },
  },
} satisfies NextAuthConfig;
