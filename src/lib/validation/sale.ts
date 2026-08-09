import { z } from "zod";

// Required per requirements 4.1: passenger name, route, sale price, sale date.
const baseSaleSchema = z.object({
  passengerName: z.string().trim().min(1, "Passenger name is required"),
  pnr: z.string().trim().optional().or(z.literal("")),
  airline: z.string().trim().min(1, "Airline is required"),
  origin: z.string().trim().min(1, "Origin is required"),
  destination: z.string().trim().min(1, "Destination is required"),
  travelDate: z.coerce.date({ error: "Travel date is required" }),
  tripType: z.enum(["ONE_WAY", "ROUND_TRIP"]).default("ONE_WAY"),
  // Only meaningful (and required) for ROUND_TRIP — cross-checked below.
  returnDate: z.coerce.date().optional(),
  cabinClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).default("ECONOMY"),
  paxCount: z.coerce.number().int("Passengers must be a whole number").min(1, "At least 1 passenger").default(1),
  supplier: z.string().trim().optional().or(z.literal("")),
  salePrice: z.coerce.number().nonnegative("Sale price must be 0 or more"),
  costPrice: z.coerce.number().nonnegative("Cost price must be 0 or more"),
  paymentStatus: z.enum(["PAID", "PARTIAL", "DUE"]).default("DUE"),
  amountPaid: z.coerce.number().nonnegative("Amount paid must be 0 or more").default(0),
  customerPhone: z.string().trim().optional().or(z.literal("")),
  customerEmail: z
    .union([z.string().trim().email(), z.literal("")])
    .optional(),
  saleDate: z.coerce.date({ error: "Sale date is required" }),
  notes: z.string().trim().optional().or(z.literal("")),
  source: z.enum(["MANUAL", "DOCUMENT_UPLOAD"]).default("MANUAL"),
  // Only used for owner-authored sales — an employee's branch always comes
  // from their own account, never the request body (see POST /api/sales).
  branchId: z.string().trim().optional(),
});

function crossCheckSale<T extends { tripType?: string; returnDate?: Date; salePrice?: number; amountPaid?: number }>(
  data: T,
  ctx: z.RefinementCtx,
) {
  if (data.tripType === "ROUND_TRIP" && !data.returnDate) {
    ctx.addIssue({ code: "custom", message: "Return date is required for round-trip sales", path: ["returnDate"] });
  }
  if (data.salePrice !== undefined && data.amountPaid !== undefined && data.amountPaid > data.salePrice) {
    ctx.addIssue({ code: "custom", message: "Amount paid cannot exceed the sale price", path: ["amountPaid"] });
  }
}

export const createSaleSchema = baseSaleSchema.superRefine(crossCheckSale);

export const updateSaleSchema = baseSaleSchema
  .partial()
  .extend({ status: z.enum(["ISSUED", "CANCELLED", "REFUNDED", "VOID"]).optional() })
  .superRefine(crossCheckSale);

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
