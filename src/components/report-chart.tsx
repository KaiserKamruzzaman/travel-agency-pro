"use client";

import { useState } from "react";
import { formatCompactMoney, formatMoney } from "@/lib/format";

export type TrendPoint = {
  key: string;
  label: string;
  tickets: number;
  revenue: number;
  profit: number;
};

// Validated categorical slots (blue, aqua) — see dataviz skill palette.md.
// Chart chrome (grid/axis/text) reuses the app's existing neutral scale so
// the chart reads as part of the same UI, not a bolted-on widget.
const REVENUE_COLOR = "fill-[#2a78d6] dark:fill-[#3987e5]";
const PROFIT_COLOR = "fill-[#1baf7a] dark:fill-[#199e70]";

const VIEW_W = 960;
const VIEW_H = 320;
const MARGIN = { top: 16, right: 12, bottom: 28, left: 56 };
const PLOT_W = VIEW_W - MARGIN.left - MARGIN.right;
const PLOT_H = VIEW_H - MARGIN.top - MARGIN.bottom;

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = 10 ** exponent;
  const residual = value / magnitude;
  const niceResidual = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  return niceResidual * magnitude;
}

// Rounded top corners, square baseline — the bar mark spec.
function roundedTopBarPath(x: number, yTop: number, width: number, height: number, radius: number) {
  const r = Math.max(0, Math.min(radius, width / 2, height));
  const yBottom = yTop + height;
  if (height <= 0) return "";
  return `M ${x} ${yBottom} L ${x} ${yTop + r} Q ${x} ${yTop} ${x + r} ${yTop} L ${x + width - r} ${yTop} Q ${x + width} ${yTop} ${x + width} ${yTop + r} L ${x + width} ${yBottom} Z`;
}

export function ReportChart({ trend }: { trend: TrendPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (trend.length === 0 || trend.every((t) => t.revenue === 0 && t.profit === 0)) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-neutral-200 text-sm text-neutral-500 dark:border-neutral-800">
        No sales in this period yet.
      </div>
    );
  }

  const maxValue = niceCeil(Math.max(...trend.map((t) => Math.max(t.revenue, t.profit))));
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxValue);
  const bandWidth = PLOT_W / trend.length;
  const barWidth = Math.max(2, Math.min(24, bandWidth * 0.32));
  const barGap = 2; // surface gap between the two bars in a group
  const labelStride = Math.max(1, Math.ceil(trend.length / 10));

  function yFor(value: number) {
    return MARGIN.top + PLOT_H * (1 - value / maxValue);
  }

  const active = hovered !== null ? trend[hovered] : null;
  const activeLeftPct = hovered !== null ? ((hovered + 0.5) / trend.length) * 100 : 0;

  return (
    <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-3 flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
          <span className={`inline-block h-2.5 w-2.5 rounded-sm ${REVENUE_COLOR}`} />
          Revenue
        </span>
        <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
          <span className={`inline-block h-2.5 w-2.5 rounded-sm ring-1 ring-neutral-300 dark:ring-neutral-700 ${PROFIT_COLOR}`} />
          Profit
        </span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full" role="img" aria-label="Revenue and profit trend chart">
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={VIEW_W - MARGIN.right}
                y1={yFor(tick)}
                y2={yFor(tick)}
                className="stroke-neutral-200 dark:stroke-neutral-800"
                strokeWidth={1}
              />
              <text
                x={MARGIN.left - 8}
                y={yFor(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-neutral-500 text-[11px]"
              >
                {formatCompactMoney(tick)}
              </text>
            </g>
          ))}

          {trend.map((point, i) => {
            const bandX = MARGIN.left + i * bandWidth;
            const groupWidth = barWidth * 2 + barGap;
            const groupX = bandX + (bandWidth - groupWidth) / 2;
            const isHovered = hovered === i;
            return (
              <g key={point.key}>
                {/* Hit target — bigger than the bars, carries hover + keyboard focus. */}
                <rect
                  x={bandX}
                  y={MARGIN.top}
                  width={bandWidth}
                  height={PLOT_H}
                  fill="transparent"
                  tabIndex={0}
                  role="img"
                  aria-label={`${point.label}: revenue ${formatMoney(point.revenue)}, profit ${formatMoney(point.profit)}`}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  className="outline-none"
                />
                {isHovered && (
                  <rect
                    x={bandX}
                    y={MARGIN.top}
                    width={bandWidth}
                    height={PLOT_H}
                    className="fill-neutral-500/5"
                    pointerEvents="none"
                  />
                )}
                <path
                  d={roundedTopBarPath(groupX, yFor(point.revenue), barWidth, PLOT_H * (point.revenue / maxValue), 4)}
                  className={REVENUE_COLOR}
                  pointerEvents="none"
                />
                <path
                  d={roundedTopBarPath(
                    groupX + barWidth + barGap,
                    yFor(point.profit),
                    barWidth,
                    PLOT_H * (point.profit / maxValue),
                    4,
                  )}
                  className={PROFIT_COLOR}
                  pointerEvents="none"
                />
                {i % labelStride === 0 && (
                  <text
                    x={bandX + bandWidth / 2}
                    y={VIEW_H - MARGIN.bottom + 16}
                    textAnchor="middle"
                    className="fill-neutral-500 text-[11px]"
                  >
                    {point.label}
                  </text>
                )}
              </g>
            );
          })}
          <line
            x1={MARGIN.left}
            x2={VIEW_W - MARGIN.right}
            y1={VIEW_H - MARGIN.bottom}
            y2={VIEW_H - MARGIN.bottom}
            className="stroke-neutral-300 dark:stroke-neutral-700"
            strokeWidth={1}
          />
        </svg>

        {active && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md dark:border-neutral-700 dark:bg-neutral-900"
            style={{ left: `${Math.min(88, Math.max(12, activeLeftPct))}%` }}
          >
            <p className="mb-1 font-medium text-neutral-700 dark:text-neutral-200">{active.label}</p>
            <p className="flex items-center gap-1.5">
              <span className={`inline-block h-2 w-3 rounded-sm ${REVENUE_COLOR}`} />
              <span className="font-semibold text-neutral-900 dark:text-neutral-50">{formatMoney(active.revenue)}</span>
              <span className="text-neutral-500">Revenue</span>
            </p>
            <p className="flex items-center gap-1.5">
              <span className={`inline-block h-2 w-3 rounded-sm ${PROFIT_COLOR}`} />
              <span className="font-semibold text-neutral-900 dark:text-neutral-50">{formatMoney(active.profit)}</span>
              <span className="text-neutral-500">Profit</span>
            </p>
            <p className="mt-1 text-neutral-500">{active.tickets} tickets</p>
          </div>
        )}
      </div>
    </div>
  );
}
