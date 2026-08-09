import Anthropic from "@anthropic-ai/sdk";
import { PDFParse } from "pdf-parse";

const MAX_DOCUMENT_CHARS = 20000;

export class ExtractionError extends Error {}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } catch (err) {
    console.error("PDF parse error:", err);
    throw new ExtractionError("Could not read text from this PDF. Paste the confirmation text instead.");
  } finally {
    await parser.destroy();
  }
}

// Mirrors the manual-entry fields the agent would otherwise type by hand
// (requirements 4.2) — nullable so a partial extraction never blocks the form.
const fieldSchema = (type: "string" | "number") => ({
  anyOf: [{ type }, { type: "null" }],
});

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    passengerName: fieldSchema("string"),
    pnr: fieldSchema("string"),
    airline: fieldSchema("string"),
    origin: fieldSchema("string"),
    destination: fieldSchema("string"),
    travelDate: fieldSchema("string"),
    returnDate: fieldSchema("string"),
    cabinClass: {
      anyOf: [{ type: "string", enum: ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"] }, { type: "null" }],
    },
    salePrice: fieldSchema("number"),
    customerPhone: fieldSchema("string"),
    customerEmail: fieldSchema("string"),
    notes: fieldSchema("string"),
  },
  required: [
    "passengerName",
    "pnr",
    "airline",
    "origin",
    "destination",
    "travelDate",
    "returnDate",
    "cabinClass",
    "salePrice",
    "customerPhone",
    "customerEmail",
    "notes",
  ],
  additionalProperties: false,
} as const;

export type ExtractedSaleFields = {
  passengerName: string | null;
  pnr: string | null;
  airline: string | null;
  origin: string | null;
  destination: string | null;
  /** ISO date (YYYY-MM-DD), or null if not found */
  travelDate: string | null;
  /** ISO date (YYYY-MM-DD) of the return leg, or null for one-way/not found */
  returnDate: string | null;
  cabinClass: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST" | null;
  salePrice: number | null;
  customerPhone: string | null;
  customerEmail: string | null;
  notes: string | null;
};

const SYSTEM_PROMPT = `You extract structured air-ticket sale data from GDS e-ticket/itinerary confirmations (Amadeus, Sabre, Travelport/Galileo) so a travel agent can review it before saving.

- origin/destination: IATA airport or city codes (e.g. DAC, DXB).
- travelDate: the outbound departure date, formatted YYYY-MM-DD.
- returnDate: the return-leg departure date, formatted YYYY-MM-DD, only if this is a round-trip itinerary — otherwise null.
- cabinClass: map the fare/booking class to one of ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST if it can be determined; otherwise null.
- salePrice: the total fare/price charged to the passenger, as a plain number with no currency symbol, if present.
- notes: any flight number or other detail worth keeping that doesn't fit the other fields.
- If a field is not present in the document, return null for it. Never guess or invent a value.`;

/**
 * Sends extracted document text to Claude for structured extraction.
 * Per requirements 4.2: extraction failures or partial results must never
 * block the agent — callers should pre-fill whatever comes back and leave
 * the rest for manual entry, not treat a sparse result as an error.
 */
export async function extractSaleFieldsFromText(documentText: string): Promise<ExtractedSaleFields> {
  const trimmed = documentText.trim();
  if (!trimmed) {
    throw new ExtractionError("No text found to extract from.");
  }

  const client = new Anthropic();

  let response;
  try {
    response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      // Haiku 4.5 doesn't support output_config.effort (400s if set) — only
      // structured-output `format` applies here.
      output_config: {
        format: { type: "json_schema", schema: EXTRACTION_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `Extract the sale fields from this document text:\n\n${trimmed.slice(0, MAX_DOCUMENT_CHARS)}`,
        },
      ],
    });
  } catch (err) {
    console.error("Claude extraction error:", err);
    throw new ExtractionError("Extraction failed — please fill in the form manually.");
  }

  if (response.stop_reason === "refusal") {
    throw new ExtractionError("Extraction failed — please fill in the form manually.");
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new ExtractionError("Extraction failed — please fill in the form manually.");
  }

  try {
    return JSON.parse(textBlock.text) as ExtractedSaleFields;
  } catch {
    throw new ExtractionError("Extraction failed — please fill in the form manually.");
  }
}
