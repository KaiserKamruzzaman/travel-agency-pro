import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, requireSession, ApiError } from "@/lib/authz";
import { extractSaleFieldsFromText, extractTextFromPdf, ExtractionError } from "@/lib/extraction";

const MAX_FILE_BYTES = 15 * 1024 * 1024;

// Assisted entry (requirements 4.2): agents upload a GDS PDF or paste raw
// confirmation text; this pre-fills the manual sale form and is never saved
// directly. Restricted to employees, same as sale creation itself.
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session.user.role !== "EMPLOYEE") {
      throw new ApiError(403, "Only employees can use assisted entry");
    }

    const form = await req.formData().catch(() => {
      throw new ApiError(400, "Upload a PDF or paste confirmation text");
    });
    const file = form.get("file");
    const pastedText = form.get("text");

    let documentText: string;
    if (file instanceof File) {
      if (file.type !== "application/pdf") {
        throw new ApiError(400, "Only PDF files are supported for upload");
      }
      if (file.size > MAX_FILE_BYTES) {
        throw new ApiError(400, "PDF is too large (max 15MB)");
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      documentText = await extractTextFromPdf(buffer);
    } else if (typeof pastedText === "string" && pastedText.trim()) {
      documentText = pastedText;
    } else {
      throw new ApiError(400, "Upload a PDF or paste confirmation text");
    }

    const fields = await extractSaleFieldsFromText(documentText);
    return NextResponse.json({ fields });
  } catch (err) {
    if (err instanceof ExtractionError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return apiErrorResponse(err);
  }
}
