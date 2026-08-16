"use client";

import { useState } from "react";
import { formatCompactMoney, formatMoney } from "@/lib/format";

export type MonthlyExpensePoint = {
  key: string;
  label: string;
  total: number;
};

// Single series — an expense-specific hue distinct from the sales chart's
// blue/emerald pair (see dataviz skill: identity for a lone series comes
// from the chart title, not a legend).
const EXPENSE_COLOR = "fill-rose-500";

const VIEW_W = 960;
const VIEW_H = 260;
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

export function ExpenseChart({ points, year }: { points: MonthlyExpensePoint[]; year: number }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (points.every((p) => p.total === 0)) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-500 dark:text-slate-400 shadow-sm">
        No expenses recorded for {year} yet.
      </div>
    );
  }

  const maxValue = niceCeil(Math.max(...points.map((p) => p.total)));
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxValue);
  const bandWidth = PLOT_W / points.length;
  const barWidth = Math.max(4, Math.min(24, bandWidth * 0.5));

  function yFor(value: number) {
    return MARGIN.top + PLOT_H * (1 - value / maxValue);
  }

  const active = hovered !== null ? points[hovered] : null;
  const activeLeftPct = hovered !== null ? ((hovered + 0.5) / points.length) * 100 : 0;

  return (
    <div className="rounded-xl border border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Monthly expenses — {year}</h2>
      <div className="relative">
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full" role="img" aria-label={`Monthly expenses for ${year}`}>
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={VIEW_W - MARGIN.right}
                y1={yFor(tick)}
                y2={yFor(tick)}
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth={1}
              />
              <text
                x={MARGIN.left - 8}
                y={yFor(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-slate-400 dark:fill-slate-500 text-[11px]"
              >
                {formatCompactMoney(tick)}
              </text>
            </g>
          ))}

          {points.map((point, i) => {
            const bandX = MARGIN.left + i * bandWidth;
            const barX = bandX + (bandWidth - barWidth) / 2;
            const isHovered = hovered === i;
            return (
              <g key={point.key}>
                <rect
                  x={bandX}
                  y={MARGIN.top}
                  width={bandWidth}
                  height={PLOT_H}
                  fill="transparent"
                  tabIndex={0}
                  role="img"
                  aria-label={`${point.label}: ${formatMoney(point.total)}`}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  className="outline-none"
                />
                {isHovered && (
                  <rect x={bandX} y={MARGIN.top} width={bandWidth} height={PLOT_H} className="fill-rose-500/5" pointerEvents="none" />
                )}
                <path
                  d={roundedTopBarPath(barX, yFor(point.total), barWidth, PLOT_H * (point.total / maxValue), 4)}
                  className={EXPENSE_COLOR}
                  pointerEvents="none"
                />
                <text
                  x={bandX + bandWidth / 2}
                  y={VIEW_H - MARGIN.bottom + 16}
                  textAnchor="middle"
                  className="fill-slate-400 dark:fill-slate-500 text-[11px]"
                >
                  {point.label}
                </text>
              </g>
            );
          })}
          <line
            x1={MARGIN.left}
            x2={VIEW_W - MARGIN.right}
            y1={VIEW_H - MARGIN.bottom}
            y2={VIEW_H - MARGIN.bottom}
            className="stroke-slate-300 dark:stroke-slate-600"
            strokeWidth={1}
          />
        </svg>

        {active && (
          <div
            className="animate-fade-in pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs shadow-lg shadow-sky-900/10"
            style={{ left: `${Math.min(88, Math.max(12, activeLeftPct))}%` }}
          >
            <p className="mb-1 font-medium text-slate-700 dark:text-slate-300">{active.label}</p>
            <p className="flex items-center gap-1.5">
              <span className={`inline-block h-2 w-3 rounded-sm ${EXPENSE_COLOR}`} />
              <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatMoney(active.total)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
