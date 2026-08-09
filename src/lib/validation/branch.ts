import { z } from "zod";

export const createBranchSchema = z.object({
  name: z.string().trim().min(1, "Branch name is required"),
  location: z.string().trim().optional().or(z.literal("")),
});

export const updateBranchSchema = z.object({
  name: z.string().trim().min(1, "Branch name is required").optional(),
  location: z.string().trim().optional().or(z.literal("")),
  active: z.boolean().optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
