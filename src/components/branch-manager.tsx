"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export type ManagedBranch = {
  id: string;
  name: string;
  location: string | null;
  active: boolean;
  activeEmployeeCount: number;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
const labelClass = "block text-sm font-medium mb-1 text-slate-700";

export function BranchManager({ branches }: { branches: ManagedBranch[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Could not create branch");
        return;
      }
      setName("");
      setLocation("");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-sky-100 bg-white p-5 shadow-sm"
      >
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Add a branch</h2>
        {error && (
          <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="branchName">
              Name *
            </label>
            <input
              id="branchName"
              required
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="branchLocation">
              Location / address
            </label>
            <input
              id="branchLocation"
              className={inputClass}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-300/50 transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "Adding…" : "Add branch"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-sky-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-sky-50/60 text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Location</th>
              <th className="px-3 py-2 font-medium">Active employees</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={5}>
                  No branches yet.
                </td>
              </tr>
            ) : (
              branches.map((branch) => <BranchRow key={branch.id} branch={branch} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BranchRow({ branch }: { branch: ManagedBranch }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(branch.name);
  const [location, setLocation] = useState(branch.location ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const resBody = await res.json().catch(() => ({}));
        setError(resBody.error || "Could not update branch");
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

  async function handleSave() {
    const ok = await patch({ name, location });
    if (ok) setEditing(false);
  }

  async function handleToggleActive() {
    if (branch.active && !confirm(`Archive ${branch.name}? It stops appearing for new sales/employee assignment.`)) {
      return;
    }
    await patch({ active: !branch.active });
  }

  if (editing) {
    return (
      <tr className="border-t border-slate-100">
        <td className="px-3 py-2">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </td>
        <td className="px-3 py-2">
          <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
        </td>
        <td className="px-3 py-2 text-slate-500">{branch.activeEmployeeCount}</td>
        <td className="px-3 py-2 text-slate-500">{branch.active ? "Active" : "Archived"}</td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={handleSave}
              className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-60"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setName(branch.name);
                setLocation(branch.location ?? "");
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
      <td className="px-3 py-2 font-medium text-slate-900">{branch.name}</td>
      <td className="px-3 py-2 text-slate-700">{branch.location || "—"}</td>
      <td className="px-3 py-2 text-slate-700">{branch.activeEmployeeCount}</td>
      <td className="px-3 py-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            branch.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {branch.active ? "Active" : "Archived"}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-sm font-medium text-blue-600 hover:underline">
            Edit
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleToggleActive}
            className="text-sm font-medium text-rose-600 hover:underline disabled:opacity-60"
          >
            {branch.active ? "Archive" : "Reactivate"}
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </td>
    </tr>
  );
}
