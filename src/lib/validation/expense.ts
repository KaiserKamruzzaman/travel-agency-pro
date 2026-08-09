import { z } from "zod";

const CATEGORIES = ["SALARY", "RENT", "UTILITIES", "MARKETING", "SUPPLIES", "OTHER"] as const;

export const createExpenseSchema = z.object({
  branchId: z.string().trim().optional().or(z.literal("")),
  employeeId: z.string().trim().optional().or(z.literal("")),
  category: z.enum(CATEGORIES),
  description: z.string().trim().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  expenseDate: z.coerce.date(),
  notes: z.string().trim().optional().or(z.literal("")),
});

export const updateExpenseSchema = z.object({
  branchId: z.string().trim().optional().or(z.literal("")),
  employeeId: z.string().trim().optional().or(z.literal("")),
  category: z.enum(CATEGORIES).optional(),
  description: z.string().trim().min(1, "Description is required").optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0").optional(),
  expenseDate: z.coerce.date().optional(),
  voided: z.boolean().optional(),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
