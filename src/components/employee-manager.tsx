"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useConfirm } from "@/components/ui/confirm-dialog";

export type ManagedEmployee = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  branch: { id: string; name: string } | null;
};

type BranchOption = { id: string; name: string };

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
const labelClass = "block text-sm font-medium mb-1 text-slate-700";

export function EmployeeManager({ employees, branches }: { employees: ManagedEmployee[]; branches: BranchOption[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, branchId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const issueMessage = Array.isArray(body.issues)
          ? body.issues.map((i: { message: string }) => i.message).join(", ")
          : undefined;
        setError(issueMessage || body.error || "Could not create employee");
        return;
      }
      setName("");
      setEmail("");
      setPassword("");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="rounded-xl border border-sky-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Add an employee</h2>
        {error && (
          <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {error}
          </p>
        )}
        {branches.length === 0 ? (
          <p className="text-sm text-slate-500">
            Add a branch first — employees must be assigned to one.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="employeeName">
                  Name *
                </label>
                <input id="employeeName" required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="employeeEmail">
                  Email *
                </label>
                <input
                  id="employeeEmail"
                  type="email"
                  required
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="employeePassword">
                  Temporary password *
                </label>
                <input
                  id="employeePassword"
                  type="password"
                  required
                  minLength={8}
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="employeeBranch">
                  Branch *
                </label>
                <select
                  id="employeeBranch"
                  required
                  className={inputClass}
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-300/50 transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? "Adding…" : "Add employee"}
            </button>
          </>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border border-sky-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-sky-50/60 text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Branch</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={5}>
                  No employees yet.
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <EmployeeRow key={employee.id} employee={employee} branches={branches} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmployeeRow({ employee, branches }: { employee: ManagedEmployee; branches: BranchOption[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [name, setName] = useState(employee.name);
  const [branchId, setBranchId] = useState(employee.branch?.id ?? branches[0]?.id ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const resBody = await res.json().catch(() => ({}));
        const issueMessage = Array.isArray(resBody.issues)
          ? resBody.issues.map((i: { message: string }) => i.message).join(", ")
          : undefined;
        setError(issueMessage || resBody.error || "Could not update employee");
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

  const branchOptions =
    employee.branch && !branches.some((b) => b.id === employee.branch!.id)
      ? [...branches, { id: employee.branch.id, name: `${employee.branch.name} (archived)` }]
      : branches;

  async function handleSave() {
    const body: Record<string, unknown> = { name };
    if (branchId !== employee.branch?.id) body.branchId = branchId;
    const ok = await patch(body);
    if (ok) setEditing(false);
  }

  async function handleResetPassword() {
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    const ok = await patch({ password: newPassword });
    if (ok) {
      setResetting(false);
      setNewPassword("");
    }
  }

  async function handleToggleActive() {
    if (employee.active) {
      const ok = await confirm({
        title: `Deactivate ${employee.name}?`,
        description: "They'll no longer be able to log in.",
        confirmLabel: "Deactivate",
        variant: "danger",
      });
      if (!ok) return;
    }
    await patch({ active: !employee.active });
  }

  if (editing) {
    return (
      <tr className="border-t border-slate-100">
        <td className="px-3 py-2">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </td>
        <td className="px-3 py-2 text-slate-500">{employee.email}</td>
        <td className="px-3 py-2">
          <select className={inputClass} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            {branchOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2 text-slate-500">{employee.active ? "Active" : "Deactivated"}</td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-3">
            <button type="button" disabled={pending} onClick={handleSave} className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-60">
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setName(employee.name);
                setBranchId(employee.branch?.id ?? branches[0]?.id ?? "");
                setError(null);
              }}
              className="text-sm font-medium text-slate-500 hover:underline"
            >
              Cancel
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-slate-100 transition-colors hover:bg-sky-50/40">
      <td className="px-3 py-2 font-medium text-slate-900">{employee.name}</td>
      <td className="px-3 py-2 text-slate-700">{employee.email}</td>
      <td className="px-3 py-2 text-slate-700">{employee.branch?.name ?? "—"}</td>
      <td className="px-3 py-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            employee.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {employee.active ? "Active" : "Deactivated"}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-sm font-medium text-blue-600 hover:underline">
            Edit
          </button>
          <button type="button" onClick={() => setResetting((v) => !v)} className="text-sm font-medium text-slate-600 hover:underline">
            Reset password
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleToggleActive}
            className="text-sm font-medium text-rose-600 hover:underline disabled:opacity-60"
          >
            {employee.active ? "Deactivate" : "Reactivate"}
          </button>
        </div>
        {resetting && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="password"
              placeholder="New password"
              minLength={8}
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              disabled={pending}
              onClick={handleResetPassword}
              className="whitespace-nowrap text-sm font-medium text-blue-600 hover:underline disabled:opacity-60"
            >
              Set
            </button>
          </div>
        )}
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </td>
    </tr>
  );
}
