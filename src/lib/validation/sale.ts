import { z } from "zod";
import { buildServiceAttributesSchema, isNonAirServiceType } from "@/lib/service-fields";

// Required per requirements 4.1: passenger name, route, sale price, sale date.
// Route/airline are only required for AIR_TICKET — cross-checked below,
// since other service types (hotel, visa, ...) don't have a flight route.
const baseSaleSchema = z.object({
  serviceType: z
    .enum(["AIR_TICKET", "HOTEL", "VISA", "TOUR_PACKAGE", "INSURANCE", "OTHER"])
    .default("AIR_TICKET"),
  passengerName: z.string().trim().min(1, "Name is required"),
  pnr: z.string().trim().optional().or(z.literal("")),
  airline: z.string().trim().optional().or(z.literal("")),
  origin: z.string().trim().optional().or(z.literal("")),
  destination: z.string().trim().optional().or(z.literal("")),
  // Per-service-type fields (hotel name, visa type, ...) — shape depends on
  // serviceType, validated in detail against src/lib/service-fields.ts below.
  serviceAttributes: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  travelDate: z.coerce.date({ error: "Travel date is required" }),
  tripType: z.enum(["ONE_WAY", "ROUND_TRIP"]).default("ONE_WAY"),
  // Only meaningful (and required) for ROUND_TRIP — cross-checked below.
  returnDate: z.coerce.date().optional(),
  cabinClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).default("ECONOMY"),
  paxCount: z.coerce.number().int("Must be a whole number").min(1, "At least 1 is required").default(1),
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

// Which fields are required depends on serviceType: a flight needs
// airline/origin/destination, every other service type validates
// serviceAttributes against that type's own field list (service-fields.ts).
// Only applied on create, where serviceType is always resolved (defaulted)
// — on update it's checked against the merged record in the PATCH route
// instead, since a partial update may not include serviceType at all.
function crossCheckServiceFields<
  T extends {
    serviceType?: string;
    airline?: string;
    origin?: string;
    destination?: string;
    serviceAttributes?: Record<string, string | number>;
  },
>(data: T, ctx: z.RefinementCtx) {
  if (data.serviceType === "AIR_TICKET") {
    if (!data.airline) ctx.addIssue({ code: "custom", message: "Airline is required", path: ["airline"] });
    if (!data.origin) ctx.addIssue({ code: "custom", message: "Origin is required", path: ["origin"] });
    if (!data.destination) ctx.addIssue({ code: "custom", message: "Destination is required", path: ["destination"] });
  } else if (data.serviceType && isNonAirServiceType(data.serviceType as never)) {
    const result = buildServiceAttributesSchema(data.serviceType as never).safeParse(data.serviceAttributes ?? {});
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ code: "custom", message: issue.message, path: ["serviceAttributes", ...issue.path] });
      }
    }
  }
}

export const createSaleSchema = baseSaleSchema.superRefine(crossCheckSale).superRefine(crossCheckServiceFields);

export const updateSaleSchema = baseSaleSchema
  .partial()
  .extend({ status: z.enum(["ISSUED", "CANCELLED", "REFUNDED", "VOID"]).optional() })
  .superRefine(crossCheckSale);

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
