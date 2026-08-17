"use client";

import * as Popover from "@radix-ui/react-popover";
import { useEffect, useState } from "react";
import { formatDate, parseDateInputValue, toDateInputValue } from "@/lib/format";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_LABEL_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

const triggerClass =
  "flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors hover:border-sky-300 dark:hover:border-sky-700 focus:border-sky-400 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/40 data-[state=open]:border-sky-400 dark:data-[state=open]:border-sky-500 data-[state=open]:ring-2 data-[state=open]:ring-sky-100 dark:data-[state=open]:ring-sky-900/40";

const popoverContentClass =
  "animate-popper-pop-in z-50 rounded-xl border border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg shadow-sky-900/10 outline-none";

// Local calendar-date math throughout this file, never toISOString() — same
// timezone-shift reasoning as toDateInputValue in format.ts.
function sameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isBetween(date: Date, a: Date, b: Date): boolean {
  const [lo, hi] = a.getTime() <= b.getTime() ? [a, b] : [b, a];
  const t = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return t >= new Date(lo.getFullYear(), lo.getMonth(), lo.getDate()).getTime() && t <= new Date(hi.getFullYear(), hi.getMonth(), hi.getDate()).getTime();
}

function addMonths(year: number, month: number, delta: number) {
  const total = month + delta;
  return { year: year + Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

function buildGrid(year: number, month: number): Date[] {
  const leadingBlanks = new Date(year, month, 1).getDay();
  const gridStart = new Date(year, month, 1 - leadingBlanks);
  return Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ direction, className }: { direction: "left" | "right"; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type DayCell = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected?: boolean;
  isRangeStart?: boolean;
  isRangeEnd?: boolean;
  isInRange?: boolean;
};

function dayClass({ isCurrentMonth, isToday, isSelected, isRangeStart, isRangeEnd, isInRange }: DayCell) {
  const base = "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors";
  if (isSelected || isRangeStart || isRangeEnd) {
    return `${base} bg-gradient-to-r from-sky-500 to-blue-600 font-medium text-white shadow-sm shadow-sky-300/50`;
  }
  if (isInRange) {
    return `${base} rounded-none bg-sky-50 text-slate-900 dark:bg-sky-950/40 dark:text-slate-100`;
  }
  if (!isCurrentMonth) {
    return `${base} text-slate-300 hover:bg-sky-50 dark:text-slate-600 dark:hover:bg-sky-950/40`;
  }
  if (isToday) {
    return `${base} border border-sky-400 text-slate-900 hover:bg-sky-50 dark:border-sky-500 dark:text-slate-100 dark:hover:bg-sky-950/40`;
  }
  return `${base} text-slate-700 hover:bg-sky-50 dark:text-slate-300 dark:hover:bg-sky-950/40`;
}

function MonthGrid({
  year,
  month,
  onPrev,
  onNext,
  cells,
  onDayClick,
  onDayHover,
}: {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  cells: DayCell[];
  onDayClick: (date: Date) => void;
  onDayHover?: (date: Date | null) => void;
}) {
  return (
    <div className="w-64">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-md p-1 text-slate-500 transition-colors hover:bg-sky-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-sky-950/40 dark:hover:text-slate-100"
        >
          <ChevronIcon direction="left" className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {MONTH_LABEL_FORMAT.format(new Date(year, month, 1))}
        </span>
        <button
          type="button"
          onClick={onNext}
          className="rounded-md p-1 text-slate-500 transition-colors hover:bg-sky-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-sky-950/40 dark:hover:text-slate-100"
        >
          <ChevronIcon direction="right" className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {d}
          </span>
        ))}
        {cells.map((cell) => (
          <button
            key={cell.date.getTime()}
            type="button"
            onClick={() => onDayClick(cell.date)}
            onMouseEnter={() => onDayHover?.(cell.date)}
            onMouseLeave={() => onDayHover?.(null)}
            className={dayClass(cell)}
          >
            {cell.date.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}

export type DatePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export function DatePicker({ id, value, onChange, required, disabled, placeholder = "Select date", className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDateInputValue(value);
  const [view, setView] = useState(() => {
    const seed = selected ?? new Date();
    return { year: seed.getFullYear(), month: seed.getMonth() };
  });

  useEffect(() => {
    if (!open) return;
    const seed = parseDateInputValue(value) ?? new Date();
    setView({ year: seed.getFullYear(), month: seed.getMonth() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const cells: DayCell[] = buildGrid(view.year, view.month).map((date) => ({
    date,
    isCurrentMonth: date.getMonth() === view.month,
    isToday: sameDay(date, new Date()),
    isSelected: sameDay(date, selected),
  }));

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={`${triggerClass} ${required && !value ? "ring-1 ring-rose-200 dark:ring-rose-900/50" : ""} ${disabled ? "cursor-not-allowed opacity-60" : ""} ${className ?? ""}`}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-sky-500 dark:text-sky-400" />
          <span className={value ? "" : "text-slate-400 dark:text-slate-500"}>{value ? formatDate(value) : placeholder}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={8} className={popoverContentClass}>
          <MonthGrid
            year={view.year}
            month={view.month}
            onPrev={() => setView((v) => addMonths(v.year, v.month, -1))}
            onNext={() => setView((v) => addMonths(v.year, v.month, 1))}
            cells={cells}
            onDayClick={(date) => {
              onChange(toDateInputValue(date));
              setOpen(false);
            }}
          />
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                onChange(toDateInputValue(new Date()));
                setOpen(false);
              }}
              className="text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
            >
              Today
            </button>
            {!required && value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 hover:underline dark:text-slate-500 dark:hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export type DateRangePickerProps = {
  fromName: string;
  toName: string;
  defaultFrom?: string;
  defaultTo?: string;
  placeholder?: string;
  className?: string;
};

export function DateRangePicker({ fromName, toName, defaultFrom, defaultTo, placeholder = "Any date", className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState<Date | null>(() => parseDateInputValue(defaultFrom ?? ""));
  const [to, setTo] = useState<Date | null>(() => parseDateInputValue(defaultTo ?? ""));
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // This component isn't remounted by a from/to filter reset (e.g. the
  // filter bar's "Clear" link) — Next.js re-renders the same instance with
  // new defaultFrom/defaultTo props, so the lazy useState initializer above
  // never reruns. Resync explicitly whenever the seed props change.
  useEffect(() => {
    setFrom(parseDateInputValue(defaultFrom ?? ""));
    setTo(parseDateInputValue(defaultTo ?? ""));
  }, [defaultFrom, defaultTo]);
  const [view, setView] = useState(() => {
    const seed = from ?? new Date();
    return { year: seed.getFullYear(), month: seed.getMonth() };
  });

  const previewEnd = to ?? hoverDate;

  const cells: DayCell[] = buildGrid(view.year, view.month).map((date) => {
    const isRangeStart = sameDay(date, from);
    const isRangeEnd = sameDay(date, previewEnd);
    const inRange = Boolean(from && previewEnd && isBetween(date, from, previewEnd));
    return {
      date,
      isCurrentMonth: date.getMonth() === view.month,
      isToday: sameDay(date, new Date()),
      isRangeStart,
      isRangeEnd,
      isInRange: inRange && !isRangeStart && !isRangeEnd,
    };
  });

  function handleDayClick(date: Date) {
    if (!from || to) {
      setFrom(date);
      setTo(null);
      return;
    }
    if (date.getTime() < from.getTime()) {
      setFrom(date);
      setTo(null);
      return;
    }
    setTo(date);
    setOpen(false);
  }

  const label = from
    ? `${formatDate(toDateInputValue(from))} – ${to ? formatDate(toDateInputValue(to)) : "…"}`
    : placeholder;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <input type="hidden" name={fromName} value={from ? toDateInputValue(from) : ""} />
      <input type="hidden" name={toName} value={to ? toDateInputValue(to) : ""} />
      <Popover.Trigger asChild>
        <button type="button" className={`${triggerClass} ${className ?? ""}`}>
          <CalendarIcon className="h-4 w-4 shrink-0 text-sky-500 dark:text-sky-400" />
          <span className={from ? "" : "text-slate-400 dark:text-slate-500"}>{label}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={8} className={popoverContentClass}>
          <MonthGrid
            year={view.year}
            month={view.month}
            onPrev={() => setView((v) => addMonths(v.year, v.month, -1))}
            onNext={() => setView((v) => addMonths(v.year, v.month, 1))}
            cells={cells}
            onDayClick={handleDayClick}
            onDayHover={setHoverDate}
          />
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setFrom(null);
                setTo(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 hover:underline dark:text-slate-500 dark:hover:text-slate-300"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
            >
              Done
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
