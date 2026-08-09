import { z } from "zod";

// Employees are always tied to exactly one branch (requirements 2.1) — owner
// accounts are provisioned outside this flow (seed/db), not through this form.
export const createEmployeeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().toLowerCase().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  branchId: z.string().trim().min(1, "Branch is required"),
});

export const updateEmployeeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  branchId: z.string().trim().min(1, "Branch is required").optional(),
  active: z.boolean().optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
