import { redirect } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { getOrgFilterOptions, getPresetRange, getSalesReport, type ReportPreset } from "@/lib/reports";
import { formatDate, formatMoney } from "@/lib/format";
import { ReportFilters } from "@/components/report-filters";
import { ReportChart } from "@/components/report-chart";
import { SummaryCard } from "@/components/summary-card";

type SearchParams = { [key: string]: string | string[] | undefined };
type PageProps = { searchParams: Promise<SearchParams> };

const VALID_PRESETS: ReportPreset[] = ["week", "month", "year", "custom"];

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const session = await requireSession();
  if (session.user.role !== "OWNER") redirect("/sales");

  const sp = await searchParams;
  const presetParam = firstParam(sp.preset);
  const preset: ReportPreset = VALID_PRESETS.includes(presetParam as ReportPreset)
    ? (presetParam as ReportPreset)
    : "month";
  const startParam = firstParam(sp.start);
  const endParam = firstParam(sp.end);
  const branchId = firstParam(sp.branchId) || undefined;
  const employeeId = firstParam(sp.employeeId) || undefined;

  const { start, end, granularity } = getPresetRange(
    preset,
    startParam ? new Date(startParam) : undefined,
    endParam ? new Date(endParam) : undefined,
  );
  const displayEnd = new Date(end);
  displayEnd.setDate(displayEnd.getDate() - 1);

  const [{ branches, employees }, report] = await Promise.all([
    getOrgFilterOptions(session.user.organizationId),
    getSalesReport(session.user.organizationId, start, end, granularity, { branchId, employeeId }),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="text-sm text-neutral-500">
          {formatDate(start)} – {formatDate(displayEnd)}
        </p>
      </div>

      <ReportFilters
        preset={preset}
        start={start}
        displayEnd={displayEnd}
        branchId={branchId}
        employeeId={employeeId}
        branches={branches}
        employees={employees}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard label="Tickets sold" value={String(report.totals.tickets)} />
        <SummaryCard label="Gross revenue" value={formatMoney(report.totals.revenue)} />
        <SummaryCard label="Net profit" value={formatMoney(report.totals.profit)} />
        <SummaryCard label="Avg. sale value" value={formatMoney(report.totals.avgSale)} />
        <SummaryCard label="Top branch" value={report.topBranch?.label ?? "—"} />
      </div>

      <div className="mb-8">
        <ReportChart trend={report.trend} />
      </div>

      <div className="mb-8 overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2 font-medium">Period</th>
              <th className="px-3 py-2 font-medium">Tickets</th>
              <th className="px-3 py-2 font-medium">Revenue</th>
              <th className="px-3 py-2 font-medium">Profit</th>
            </tr>
          </thead>
          <tbody>
            {report.trend.map((point) => (
              <tr key={point.key} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="px-3 py-2">{point.label}</td>
                <td className="px-3 py-2">{point.tickets}</td>
                <td className="px-3 py-2">{formatMoney(point.revenue)}</td>
                <td className="px-3 py-2">{formatMoney(point.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BreakdownTable title="By branch" rows={report.byBranch} />
        <BreakdownTable title="By employee" rows={report.byEmployee} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopList title="Top routes" rows={report.byRoute} />
        <TopList title="Top airlines" rows={report.byAirline} />
      </div>
    </div>
  );
}

type SummaryRow = { key: string; label: string; tickets: number; revenue: number; profit: number };

function BreakdownTable({ title, rows }: { title: string; rows: SummaryRow[] }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">No sales in this period.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Tickets</th>
                <th className="px-3 py-2 font-medium">Revenue</th>
                <th className="px-3 py-2 font-medium">Profit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-3 py-2">{row.label}</td>
                  <td className="px-3 py-2">{row.tickets}</td>
                  <td className="px-3 py-2">{formatMoney(row.revenue)}</td>
                  <td className="px-3 py-2">{formatMoney(row.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TopList({ title, rows }: { title: string; rows: SummaryRow[] }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">No sales in this period.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 text-sm dark:divide-neutral-800 dark:border-neutral-800">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center justify-between px-3 py-2">
              <span>{row.label}</span>
              <span className="text-neutral-500">
                {row.tickets} tickets · {formatMoney(row.revenue)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
