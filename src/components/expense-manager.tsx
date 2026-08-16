"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { ExpenseCategory } from "@/generated/prisma/client";
import { formatMoney, formatDate, toDateInputValue } from "@/lib/format";
import { useConfirm } from "@/components/ui/confirm-dialog";

export type ManagedExpense = {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: string;
  expenseDate: string;
  voided: boolean;
  branch: { id: string; name: string } | null;
  employee: { id: string; name: string } | null;
  notes: string | null;
};

type Option = { id: string; name: string };

const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  SALARY: "Salary",
  RENT: "Rent",
  UTILITIES: "Utilities",
  MARKETING: "Marketing",
  SUPPLIES: "Supplies",
  OTHER: "Other",
};

const CATEGORY_STYLES: Record<ExpenseCategory, string> = {
  SALARY: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 ring-1 ring-inset ring-sky-200 dark:ring-sky-800",
  RENT: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-200 dark:ring-amber-800",
  UTILITIES: "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 ring-1 ring-inset ring-violet-200 dark:ring-violet-800",
  MARKETING: "bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 ring-1 ring-inset ring-pink-200 dark:ring-pink-800",
  SUPPLIES: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-800",
  OTHER: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-1 ring-inset ring-slate-200 dark:ring-slate-700",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors focus:border-sky-400 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/40 disabled:bg-slate-50 dark:disabled:bg-slate-800/60 disabled:text-slate-400 dark:disabled:text-slate-500";
const labelClass = "block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300";

function issuesToMessage(issues: unknown): string | undefined {
  return Array.isArray(issues) ? issues.map((i: { message: string }) => i.message).join(", ") : undefined;
}

export function ExpenseManager({
  expenses,
  branches,
  employees,
}: {
  expenses: ManagedExpense[];
  branches: Option[];
  employees: Option[];
}) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("SALARY");
  const [branchId, setBranchId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(toDateInputValue(new Date()));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          category,
          branchId,
          employeeId,
          amount,
          expenseDate,
          notes,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(issuesToMessage(body.issues) || body.error || "Could not add expense");
        return;
      }
      setDescription("");
      setAmount("");
      setNotes("");
      setEmployeeId("");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  const totalShown = expenses.filter((e) => !e.voided).reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="rounded-xl border border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Add an expense</h2>
        {error && (
          <p className="mb-3 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-sm text-rose-700 dark:text-rose-300" role="alert">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className={labelClass} htmlFor="expenseDescription">
              Description *
            </label>
            <input
              id="expenseDescription"
              required
              placeholder="e.g. August salary — Rafi"
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="expenseCategory">
              Category *
            </label>
            <select
              id="expenseCategory"
              required
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            >
              {(Object.keys(CATEGORY_LABEL) as ExpenseCategory[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="expenseAmount">
              Amount *
            </label>
            <input
              id="expenseAmount"
              type="number"
              required
              min={0}
              step="0.01"
              className={inputClass}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="expenseBranch">
              Branch
            </label>
            <select id="expenseBranch" className={inputClass} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">Org-wide</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="expenseEmployee">
              Employee
            </label>
            <select
              id="expenseEmployee"
              className={inputClass}
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Not tied to one person</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="expenseDate">
              Date *
            </label>
            <input
              id="expenseDate"
              type="date"
              required
              className={inputClass}
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={labelClass} htmlFor="expenseNotes">
              Notes
            </label>
            <input id="expenseNotes" className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-300/50 transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "Adding…" : "Add expense"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-sky-50/60 dark:bg-sky-950/30 text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="px-3 py-2 font-medium">Branch</th>
              <th className="px-3 py-2 font-medium">Employee</th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-slate-500 dark:text-slate-400" colSpan={6}>
                  No expenses yet.
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} branches={branches} employees={employees} />
              ))
            )}
          </tbody>
          {expenses.length > 0 && (
            <tfoot>
              <tr className="border-t border-slate-200 dark:border-slate-700 bg-sky-50/40 dark:bg-sky-950/20 font-medium text-slate-700 dark:text-slate-300">
                <td className="px-3 py-2" colSpan={4}>
                  Total (excluding voided)
                </td>
                <td className="px-3 py-2">{formatMoney(totalShown)}</td>
                <td className="px-3 py-2" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function ExpenseRow({
  expense,
  branches,
  employees,
}: {
  expense: ManagedExpense;
  branches: Option[];
  employees: Option[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(expense.description);
  const [category, setCategory] = useState<ExpenseCategory>(expense.category);
  const [branchId, setBranchId] = useState(expense.branch?.id ?? "");
  const [employeeId, setEmployeeId] = useState(expense.employee?.id ?? "");
  const [amount, setAmount] = useState(expense.amount);
  const [expenseDate, setExpenseDate] = useState(toDateInputValue(expense.expenseDate));
  const [notes, setNotes] = useState(expense.notes ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const resBody = await res.json().catch(() => ({}));
        setError(issuesToMessage(resBody.issues) || resBody.error || "Could not update expense");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Network error — please try again");
      return false;
    } finally {
      setPending(false);
    }
  }

  const branchOptions = expense.branch && !branches.some((b) => b.id === expense.branch!.id)
    ? [...branches, { id: expense.branch.id, name: `${expense.branch.name} (archived)` }]
    : branches;
  const employeeOptions =
    expense.employee && !employees.some((e) => e.id === expense.employee!.id)
      ? [...employees, { id: expense.employee.id, name: `${expense.employee.name} (inactive)` }]
      : employees;

  async function handleSave() {
    const ok = await patch({
      description,
      category,
      branchId,
      employeeId,
      amount,
      expenseDate,
      notes,
    });
    if (ok) setEditing(false);
  }

  async function handleVoidToggle() {
    if (!expense.voided) {
      const ok = await confirm({
        title: `Void "${expense.description}"?`,
        description: "It stops counting toward totals.",
        confirmLabel: "Void expense",
        variant: "danger",
      });
      if (!ok) return;
    }
    await patch({ voided: !expense.voided });
  }

  if (editing) {
    return (
      <tr className="border-t border-slate-100 dark:border-slate-800 align-top">
        <td className="px-3 py-2">
          <input className={`${inputClass} mb-1`} value={description} onChange={(e) => setDescription(e.target.value)} />
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {(Object.keys(CATEGORY_LABEL) as ExpenseCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2">
          <select className={inputClass} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">Org-wide</option>
            {branchOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2">
          <select className={inputClass} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">—</option>
            {employeeOptions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2">
          <input
            type="date"
            className={inputClass}
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            min={0}
            step="0.01"
            className={inputClass}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </td>
        <td className="px-3 py-2">
          <input
            className={`${inputClass} mb-2`}
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={handleSave}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-60"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDescription(expense.description);
                setCategory(expense.category);
                setBranchId(expense.branch?.id ?? "");
                setEmployeeId(expense.employee?.id ?? "");
                setAmount(expense.amount);
                setExpenseDate(toDateInputValue(expense.expenseDate));
                setNotes(expense.notes ?? "");
                setError(null);
              }}
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:underline"
            >
              Cancel
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr className={`border-t border-slate-100 dark:border-slate-800 transition-colors hover:bg-sky-50/40 dark:hover:bg-sky-950/20 ${expense.voided ? "opacity-50" : ""}`}>
      <td className="px-3 py-2">
        <div className="font-medium text-slate-900 dark:text-slate-100">{expense.description}</div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_STYLES[expense.category]}`}>
            {CATEGORY_LABEL[expense.category]}
          </span>
          {expense.voided && (
            <span className="rounded-full bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400 ring-1 ring-inset ring-rose-200 dark:ring-rose-800">
              Voided
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{expense.branch?.name ?? "Org-wide"}</td>
      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{expense.employee?.name ?? "—"}</td>
      <td className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{formatDate(expense.expenseDate)}</td>
      <td className="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300">{formatMoney(expense.amount)}</td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            Edit
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleVoidToggle}
            className="text-sm font-medium text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-60"
          >
            {expense.voided ? "Restore" : "Void"}
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      </td>
    </tr>
  );
}
