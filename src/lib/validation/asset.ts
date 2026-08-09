import { z } from "zod";

// An asset is either individually tracked (serialNumber set, quantity 1) or a
// bulk/untracked count (no serialNumber, quantity may be > 1) — never both.
const serialQuantityRefinement = <T extends { serialNumber?: string; quantity?: number }>(
  data: T,
  ctx: z.RefinementCtx,
) => {
  if (data.serialNumber && data.quantity !== undefined && data.quantity > 1) {
    ctx.addIssue({
      code: "custom",
      message: "Items with a serial number must have quantity 1",
      path: ["quantity"],
    });
  }
};

export const createAssetSchema = z
  .object({
    branchId: z.string().trim().min(1, "Branch is required"),
    name: z.string().trim().min(1, "Item name is required"),
    category: z.string().trim().min(1, "Category is required"),
    serialNumber: z.string().trim().optional().or(z.literal("")),
    quantity: z.coerce.number().int().min(1).default(1),
    assignedToId: z.string().trim().optional().or(z.literal("")),
    purchaseDate: z.coerce.date().optional(),
    purchasePrice: z.coerce.number().nonnegative().optional(),
    notes: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine(serialQuantityRefinement);

export const updateAssetSchema = z
  .object({
    branchId: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1, "Item name is required").optional(),
    category: z.string().trim().min(1, "Category is required").optional(),
    serialNumber: z.string().trim().optional().or(z.literal("")),
    quantity: z.coerce.number().int().min(1).optional(),
    status: z.enum(["IN_USE", "SPARE", "UNDER_REPAIR", "RETIRED"]).optional(),
    assignedToId: z.string().trim().optional().or(z.literal("")),
    purchaseDate: z.coerce.date().optional(),
    purchasePrice: z.coerce.number().nonnegative().optional(),
    notes: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine(serialQuantityRefinement);

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
