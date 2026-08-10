import { z } from "zod";
import type { ServiceType } from "@/generated/prisma/client";

export type ServiceFieldType = "text" | "textarea" | "date" | "number" | "select";

export type ServiceFieldOption = { value: string; label: string };

export type ServiceFieldDef = {
  key: string;
  label: string;
  type: ServiceFieldType;
  required: boolean;
  placeholder?: string;
  options?: ServiceFieldOption[];
};

export type NonAirServiceType = Exclude<ServiceType, "AIR_TICKET">;

// Each non-AIR_TICKET service type's real, distinct field list. AIR_TICKET
// isn't here — it uses Sale's dedicated flight columns instead. Adding a
// field (or a whole new service type) only touches this file, not the DB
// schema, since these are stored in Sale.serviceAttributes (JSON).
export const SERVICE_FIELDS: Record<NonAirServiceType, ServiceFieldDef[]> = {
  HOTEL: [
    { key: "hotelName", label: "Hotel name", type: "text", required: true, placeholder: "Grand Hyatt Dubai" },
    { key: "roomType", label: "Room type", type: "text", required: false, placeholder: "Deluxe, Suite, ..." },
  ],
  VISA: [
    { key: "destinationCountry", label: "Destination country", type: "text", required: true, placeholder: "UAE" },
    {
      key: "visaType",
      label: "Visa type",
      type: "select",
      required: true,
      options: [
        { value: "SINGLE_ENTRY", label: "Single entry" },
        { value: "MULTIPLE_ENTRY", label: "Multiple entry" },
      ],
    },
    {
      key: "processingSpeed",
      label: "Processing speed",
      type: "select",
      required: false,
      options: [
        { value: "NORMAL", label: "Normal" },
        { value: "URGENT", label: "Urgent" },
      ],
    },
  ],
  TOUR_PACKAGE: [
    { key: "packageName", label: "Package name", type: "text", required: true, placeholder: "Bali Explorer 5D4N" },
    { key: "destination", label: "Destination(s)", type: "text", required: true, placeholder: "Bali, Indonesia" },
    {
      key: "groupType",
      label: "Group or private",
      type: "select",
      required: false,
      options: [
        { value: "GROUP", label: "Group" },
        { value: "PRIVATE", label: "Private" },
      ],
    },
  ],
  INSURANCE: [
    { key: "coverageCountry", label: "Coverage country/region", type: "text", required: true, placeholder: "Schengen area" },
    { key: "policyType", label: "Policy type", type: "text", required: true, placeholder: "Single trip, annual multi-trip..." },
  ],
  OTHER: [
    { key: "details", label: "Service details", type: "textarea", required: true, placeholder: "Describe the service being sold" },
  ],
};

export function isNonAirServiceType(serviceType: ServiceType): serviceType is NonAirServiceType {
  return serviceType !== "AIR_TICKET";
}

function fieldSchema(field: ServiceFieldDef): z.ZodTypeAny {
  if (field.type === "select") {
    const values = (field.options ?? []).map((o) => o.value) as [string, ...string[]];
    const base = z.enum(values);
    return field.required ? base : base.optional().or(z.literal(""));
  }
  if (field.type === "number") {
    const base = z.coerce.number();
    return field.required ? base : z.coerce.number().optional().or(z.literal(""));
  }
  // text / textarea / date all stored as plain strings.
  const base = z.string().trim();
  return field.required ? base.min(1, `${field.label} is required`) : base.optional().or(z.literal(""));
}

/** Validates Sale.serviceAttributes against the field list for one service type. */
export function buildServiceAttributesSchema(serviceType: NonAirServiceType) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of SERVICE_FIELDS[serviceType]) {
    shape[field.key] = fieldSchema(field);
  }
  return z.object(shape);
}

/** Converts a stored JSON value back into the string-keyed record the form's controlled inputs expect. */
export function serviceAttributesToFormValues(attributes: unknown): Record<string, string> {
  if (!attributes || typeof attributes !== "object") return {};
  const values = attributes as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) result[key] = String(value);
  }
  return result;
}

/** Human-readable summary for tables/CSV — e.g. "Grand Hyatt Dubai — Deluxe room". */
export function formatServiceAttributes(serviceType: ServiceType, attributes: unknown): string {
  if (serviceType === "AIR_TICKET" || !attributes || typeof attributes !== "object") return "";
  const values = attributes as Record<string, unknown>;
  const parts: string[] = [];
  for (const field of SERVICE_FIELDS[serviceType]) {
    const raw = values[field.key];
    if (raw === undefined || raw === null || raw === "") continue;
    if (field.type === "select") {
      const opt = field.options?.find((o) => o.value === raw);
      parts.push(opt ? opt.label : String(raw));
    } else {
      parts.push(String(raw));
    }
  }
  return parts.join(" — ");
}
