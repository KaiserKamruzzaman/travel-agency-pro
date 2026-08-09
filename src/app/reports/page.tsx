import { redirect } from "next/navigation";
import { requireSession } from "@/lib/authz";
import { getOrgFilterOptions, getPresetRange, getSalesReport, type ReportPreset } from "@/lib/reports";
import { formatDate, formatMoney, toDateInputValue } from "@/lib/format";
import { ReportFilters } from "@/components/report-filters";
import { ReportChart } from "@/components/report-chart";
import { SummaryCard } from "@/components/summary-card";
import { ExportButtons } from "@/components/export-buttons";

type SearchParams = { [key: string]: string | string[] | undefined };
type PageProps = { searchParams: Promise<SearchParams> };

const VALID_PRESETS: ReportPreset[] = ["week", "month", "year", "custom"];

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function reportExportParams({
  start,
  displayEnd,
  branchId,
  employeeId,
}: {
  start: Date;
  displayEnd: Date;
  branchId?: string;
  employeeId?: string;
}): URLSearchParams {
  const params = new URLSearchParams({
    preset: "custom",
    start: toDateInputValue(start),
    end: toDateInputValue(displayEnd),
  });
  if (branchId) params.set("branchId", branchId);
  if (employeeId) params.set("employeeId", employeeId);
  return params;
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
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="animate-fade-in-up mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500">
            {formatDate(start)} – {formatDate(displayEnd)}
          </p>
        </div>
        <ExportButtons csvHref={`/api/reports/export?${reportExportParams({ start, displayEnd, branchId, employeeId }).toString()}`} />
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

      <Section title="Overview">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Tickets sold" value={String(report.totals.tickets)} accent="sky" />
          <SummaryCard label="Gross revenue" value={formatMoney(report.totals.revenue)} accent="blue" />
          <SummaryCard label="Ticket margin" value={formatMoney(report.totals.profit)} accent="amber" />
          <SummaryCard label="Net profit (after expenses)" value={formatMoney(report.totals.netProfit)} accent="emerald" />
        </div>

        <StatStrip
          items={[
            { label: "Total cost", value: formatMoney(report.totals.cost) },
            { label: "Operating expenses", value: formatMoney(report.totals.expenses) },
            { label: "Avg. sale value", value: formatMoney(report.totals.avgSale) },
          ]}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Top performers</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SummaryCard label="Top branch" value={report.topBranch?.label ?? "—"} accent="sky" />
              <SummaryCard label="Top employee" value={report.topEmployee?.label ?? "—"} accent="sky" />
            </div>
          </div>
          <ExpenseCategoryList rows={report.byExpenseCategory} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PaymentStatusList rows={report.byPaymentStatus} outstanding={report.totals.outstanding} />
          <CancellationList
            rows={report.byCancellationStatus}
            tickets={report.totals.cancelledTickets}
            revenue={report.totals.lostRevenue}
          />
        </div>
      </Section>

      <Section title="Trend">
        <ReportChart trend={report.trend} />
      </Section>

      <Section title="Branch & employee breakdown">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BreakdownTable title="By branch" rows={report.byBranch} />
          <BreakdownTable title="By employee" rows={report.byEmployee} />
        </div>
      </Section>

      <Section title="Sales mix" last>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <TopList title="Top routes" rows={report.byRoute} />
          <TopList title="Top airlines" rows={report.byAirline} />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children, last = false }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={last ? "" : "mb-8"}>
      <h2 className="mb-4 text-base font-semibold text-slate-800">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function StatStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3 rounded-xl border border-sky-100 bg-white px-4 py-3 shadow-sm">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-xs font-medium text-slate-500">{item.label}</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-800">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

type SummaryRow = { key: string; label: string; tickets: number; revenue: number; profit: number };

function BreakdownTable({ title, rows }: { title: string; rows: SummaryRow[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">No sales in this period.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-sky-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-sky-50/60 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Tickets</th>
                <th className="px-3 py-2 font-medium">Revenue</th>
                <th className="px-3 py-2 font-medium">Profit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-t border-slate-100 transition-colors hover:bg-sky-50/40">
                  <td className="px-3 py-2 text-slate-700">{row.label}</td>
                  <td className="px-3 py-2 text-slate-700">{row.tickets}</td>
                  <td className="px-3 py-2 text-slate-700">{formatMoney(row.revenue)}</td>
                  <td className="px-3 py-2 text-slate-700">{formatMoney(row.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const EXPENSE_CATEGORY_LABEL: Record<string, string> = {
  SALARY: "Salary",
  RENT: "Rent",
  UTILITIES: "Utilities",
  MARKETING: "Marketing",
  SUPPLIES: "Supplies",
  OTHER: "Other",
};

function ExpenseCategoryList({ rows }: { rows: { category: string; total: number }[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-700">Expenses by category</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">No expenses in this period.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-sky-100 bg-white text-sm shadow-sm">
          {rows.map((row) => (
            <li key={row.category} className="flex items-center justify-between px-3 py-2 transition-colors hover:bg-sky-50/40">
              <span className="text-slate-700">{EXPENSE_CATEGORY_LABEL[row.category] ?? row.category}</span>
              <span className="text-slate-500">{formatMoney(row.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PAID: "Paid",
  PARTIAL: "Partial",
  DUE: "Due",
};

function PaymentStatusList({
  rows,
  outstanding,
}: {
  rows: { status: string; tickets: number; revenue: number }[];
  outstanding: number;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-700">Payment status</h3>
      <div className="mb-3 rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2">
        <p className="text-xs font-medium text-rose-600">Outstanding (partial + due)</p>
        <p className="text-lg font-semibold text-rose-700">{formatMoney(outstanding)}</p>
      </div>
      <ul className="divide-y divide-slate-100 rounded-xl border border-sky-100 bg-white text-sm shadow-sm">
        {rows.map((row) => (
          <li key={row.status} className="flex items-center justify-between px-3 py-2 transition-colors hover:bg-sky-50/40">
            <span className="text-slate-700">{PAYMENT_STATUS_LABEL[row.status] ?? row.status}</span>
            <span className="text-slate-500">
              {row.tickets} tickets · {formatMoney(row.revenue)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const CANCELLATION_STATUS_LABEL: Record<string, string> = {
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  VOID: "Void",
};

function CancellationList({
  rows,
  tickets,
  revenue,
}: {
  rows: { status: string; tickets: number; revenue: number }[];
  tickets: number;
  revenue: number;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-700">Cancellations & refunds</h3>
      <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2">
        <div>
          <p className="text-xs font-medium text-amber-700">Fell through this period</p>
          <p className="text-lg font-semibold text-amber-800">{tickets} tickets</p>
        </div>
        <p className="text-sm font-semibold text-amber-800">{formatMoney(revenue)} lost</p>
      </div>
      <ul className="divide-y divide-slate-100 rounded-xl border border-sky-100 bg-white text-sm shadow-sm">
        {rows.map((row) => (
          <li key={row.status} className="flex items-center justify-between px-3 py-2 transition-colors hover:bg-sky-50/40">
            <span className="text-slate-700">{CANCELLATION_STATUS_LABEL[row.status] ?? row.status}</span>
            <span className="text-slate-500">
              {row.tickets} tickets · {formatMoney(row.revenue)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TopList({ title, rows }: { title: string; rows: SummaryRow[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">No sales in this period.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-sky-100 bg-white text-sm shadow-sm">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center justify-between px-3 py-2 transition-colors hover:bg-sky-50/40">
              <span className="text-slate-700">{row.label}</span>
              <span className="text-slate-500">
                {row.tickets} tickets · {formatMoney(row.revenue)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
