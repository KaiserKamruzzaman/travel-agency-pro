import { prisma } from "@/lib/prisma";

export async function getOwnProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { branch: { select: { name: true } } },
  });
  if (!user) return null;
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    branchName: user.branch?.name ?? null,
    createdAt: user.createdAt,
  };
}
