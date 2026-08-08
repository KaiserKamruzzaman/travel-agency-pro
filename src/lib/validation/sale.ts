import { z } from "zod";

// Required per requirements 4.1: passenger name, route, sale price, sale date.
export const createSaleSchema = z.object({
  passengerName: z.string().trim().min(1, "Passenger name is required"),
  pnr: z.string().trim().optional().or(z.literal("")),
  airline: z.string().trim().min(1, "Airline is required"),
  origin: z.string().trim().min(1, "Origin is required"),
  destination: z.string().trim().min(1, "Destination is required"),
  travelDate: z.coerce.date({ error: "Travel date is required" }),
  salePrice: z.coerce.number().nonnegative("Sale price must be 0 or more"),
  costPrice: z.coerce.number().nonnegative("Cost price must be 0 or more"),
  paymentStatus: z.enum(["PAID", "PARTIAL", "DUE"]).default("DUE"),
  customerPhone: z.string().trim().optional().or(z.literal("")),
  customerEmail: z
    .union([z.string().trim().email(), z.literal("")])
    .optional(),
  saleDate: z.coerce.date({ error: "Sale date is required" }),
  notes: z.string().trim().optional().or(z.literal("")),
  source: z.enum(["MANUAL", "DOCUMENT_UPLOAD"]).default("MANUAL"),
});

export const updateSaleSchema = createSaleSchema.partial().extend({
  status: z.enum(["ISSUED", "CANCELLED", "REFUNDED", "VOID"]).optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
