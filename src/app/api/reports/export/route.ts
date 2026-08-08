import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, requireOwner } from "@/lib/authz";
import { buildReportCsv, getPresetRange, getSalesReport, type ReportPreset } from "@/lib/reports";
import { toDateInputValue } from "@/lib/format";

const VALID_PRESETS: ReportPreset[] = ["week", "month", "year", "custom"];

// Requirement 6.4: reports must be exportable for accounting/tax use. CSV
// covers the "Excel" case directly (opens in Excel/Sheets); PDF is handled
// client-side via print-to-PDF on the reports page itself.
export async function GET(req: NextRequest) {
  try {
    const session = await requireOwner();

    const sp = req.nextUrl.searchParams;
    const presetParam = sp.get("preset");
    const preset: ReportPreset = VALID_PRESETS.includes(presetParam as ReportPreset)
      ? (presetParam as ReportPreset)
      : "month";
    const startParam = sp.get("start");
    const endParam = sp.get("end");
    const branchId = sp.get("branchId") || undefined;
    const employeeId = sp.get("employeeId") || undefined;

    const { start, end, granularity } = getPresetRange(
      preset,
      startParam ? new Date(startParam) : undefined,
      endParam ? new Date(endParam) : undefined,
    );
    const displayEnd = new Date(end);
    displayEnd.setDate(displayEnd.getDate() - 1);

    const report = await getSalesReport(session.user.organizationId, start, end, granularity, {
      branchId,
      employeeId,
    });
    const csv = buildReportCsv(report, { start, end: displayEnd });
    const filename = `sales-report_${toDateInputValue(start)}_${toDateInputValue(displayEnd)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
