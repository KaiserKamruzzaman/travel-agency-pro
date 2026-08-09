"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { AssetStatus } from "@/generated/prisma/client";
import { formatMoney, formatDate, toDateInputValue } from "@/lib/format";

export type ManagedAsset = {
  id: string;
  name: string;
  category: string;
  serialNumber: string | null;
  quantity: number;
  status: AssetStatus;
  branch: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
  purchaseDate: string | null;
  purchasePrice: string | null;
  notes: string | null;
};

type Option = { id: string; name: string };

const CATEGORY_SUGGESTIONS = ["Computer", "Printer", "Scanner", "Mobile", "Furniture", "Other"];

const STATUS_LABEL: Record<AssetStatus, string> = {
  IN_USE: "In use",
  SPARE: "Spare",
  UNDER_REPAIR: "Under repair",
  RETIRED: "Retired",
};

const STATUS_STYLES: Record<AssetStatus, string> = {
  IN_USE: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  SPARE: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  UNDER_REPAIR: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  RETIRED: "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-400";
const labelClass = "block text-sm font-medium mb-1 text-slate-700";

function issuesToMessage(issues: unknown): string | undefined {
  return Array.isArray(issues) ? issues.map((i: { message: string }) => i.message).join(", ") : undefined;
}

export function AssetManager({
  assets,
  branches,
  employees,
}: {
  assets: ManagedAsset[];
  branches: Option[];
  employees: Option[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [serialNumber, setSerialNumber] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [assignedToId, setAssignedToId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          branchId,
          serialNumber,
          quantity: serialNumber ? 1 : Number(quantity) || 1,
          assignedToId,
          purchaseDate: purchaseDate || undefined,
          purchasePrice: purchasePrice || undefined,
          notes,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(issuesToMessage(body.issues) || body.error || "Could not create asset");
        return;
      }
      setName("");
      setCategory("");
      setSerialNumber("");
      setQuantity("1");
      setAssignedToId("");
      setPurchaseDate("");
      setPurchasePrice("");
      setNotes("");
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
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Add an asset</h2>
        {error && (
          <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {error}
          </p>
        )}
        {branches.length === 0 ? (
          <p className="text-sm text-slate-500">Add a branch first — assets must be assigned to one.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={labelClass} htmlFor="assetName">
                  Item name *
                </label>
                <input
                  id="assetName"
                  required
                  placeholder="e.g. Dell OptiPlex 3080"
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="assetCategory">
                  Category *
                </label>
                <input
                  id="assetCategory"
                  required
                  list="assetCategorySuggestions"
                  className={inputClass}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
                <datalist id="assetCategorySuggestions">
                  {CATEGORY_SUGGESTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={labelClass} htmlFor="assetBranch">
                  Branch *
                </label>
                <select
                  id="assetBranch"
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
              <div>
                <label className={labelClass} htmlFor="assetSerial">
                  Serial / tag number
                </label>
                <input
                  id="assetSerial"
                  placeholder="Leave blank for bulk items"
                  className={inputClass}
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="assetQuantity">
                  Quantity
                </label>
                <input
                  id="assetQuantity"
                  type="number"
                  min={1}
                  disabled={Boolean(serialNumber)}
                  className={inputClass}
                  value={serialNumber ? "1" : quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="assetAssignee">
                  Assigned to
                </label>
                <select
                  id="assetAssignee"
                  className={inputClass}
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="assetPurchaseDate">
                  Purchase date
                </label>
                <input
                  id="assetPurchaseDate"
                  type="date"
                  className={inputClass}
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="assetPurchasePrice">
                  Purchase price
                </label>
                <input
                  id="assetPurchasePrice"
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputClass}
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelClass} htmlFor="assetNotes">
                  Notes
                </label>
                <input id="assetNotes" className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-300/50 transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? "Adding…" : "Add asset"}
            </button>
          </>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border border-sky-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-sky-50/60 text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Item</th>
              <th className="px-3 py-2 font-medium">Branch</th>
              <th className="px-3 py-2 font-medium">Serial / Qty</th>
              <th className="px-3 py-2 font-medium">Assigned to</th>
              <th className="px-3 py-2 font-medium">Purchased</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-slate-500" colSpan={7}>
                  No assets yet.
                </td>
              </tr>
            ) : (
              assets.map((asset) => (
                <AssetRow key={asset.id} asset={asset} branches={branches} employees={employees} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssetRow({ asset, branches, employees }: { asset: ManagedAsset; branches: Option[]; employees: Option[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(asset.name);
  const [category, setCategory] = useState(asset.category);
  const [branchId, setBranchId] = useState(asset.branch.id);
  const [serialNumber, setSerialNumber] = useState(asset.serialNumber ?? "");
  const [quantity, setQuantity] = useState(String(asset.quantity));
  const [assignedToId, setAssignedToId] = useState(asset.assignedTo?.id ?? "");
  const [purchaseDate, setPurchaseDate] = useState(asset.purchaseDate ? toDateInputValue(asset.purchaseDate) : "");
  const [purchasePrice, setPurchasePrice] = useState(asset.purchasePrice ?? "");
  const [notes, setNotes] = useState(asset.notes ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const resBody = await res.json().catch(() => ({}));
        setError(issuesToMessage(resBody.issues) || resBody.error || "Could not update asset");
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

  const branchOptions = branches.some((b) => b.id === asset.branch.id)
    ? branches
    : [...branches, { id: asset.branch.id, name: `${asset.branch.name} (archived)` }];
  const employeeOptions =
    asset.assignedTo && !employees.some((e) => e.id === asset.assignedTo!.id)
      ? [...employees, { id: asset.assignedTo.id, name: `${asset.assignedTo.name} (inactive)` }]
      : employees;

  async function handleSave() {
    const ok = await patch({
      name,
      category,
      branchId,
      serialNumber,
      quantity: serialNumber ? 1 : Number(quantity) || 1,
      assignedToId,
      purchaseDate: purchaseDate || undefined,
      purchasePrice: purchasePrice || undefined,
      notes,
    });
    if (ok) setEditing(false);
  }

  async function handleStatusChange(status: AssetStatus) {
    if (status === "RETIRED" && !confirm(`Retire ${asset.name}? It stops appearing as an active asset.`)) return;
    await patch({ status });
  }

  if (editing) {
    return (
      <tr className="border-t border-slate-100 align-top">
        <td className="px-3 py-2">
          <input className={`${inputClass} mb-1`} value={name} onChange={(e) => setName(e.target.value)} />
          <input
            className={inputClass}
            list="assetCategorySuggestions"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </td>
        <td className="px-3 py-2">
          <select className={inputClass} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            {branchOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2">
          <input
            className={`${inputClass} mb-1`}
            placeholder="Serial"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
          />
          <input
            type="number"
            min={1}
            disabled={Boolean(serialNumber)}
            className={inputClass}
            value={serialNumber ? "1" : quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </td>
        <td className="px-3 py-2">
          <select className={inputClass} value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
            <option value="">Unassigned</option>
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
            className={`${inputClass} mb-1`}
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="Price"
            className={inputClass}
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
          />
        </td>
        <td className="px-3 py-2 text-slate-500">{STATUS_LABEL[asset.status]}</td>
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
              className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-60"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setName(asset.name);
                setCategory(asset.category);
                setBranchId(asset.branch.id);
                setSerialNumber(asset.serialNumber ?? "");
                setQuantity(String(asset.quantity));
                setAssignedToId(asset.assignedTo?.id ?? "");
                setPurchaseDate(asset.purchaseDate ? toDateInputValue(asset.purchaseDate) : "");
                setPurchasePrice(asset.purchasePrice ?? "");
                setNotes(asset.notes ?? "");
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
      <td className="px-3 py-2">
        <div className="font-medium text-slate-900">{asset.name}</div>
        <div className="text-xs text-slate-500">{asset.category}</div>
      </td>
      <td className="px-3 py-2 text-slate-700">{asset.branch.name}</td>
      <td className="px-3 py-2 text-slate-700">{asset.serialNumber || `Qty: ${asset.quantity}`}</td>
      <td className="px-3 py-2 text-slate-700">{asset.assignedTo?.name ?? "—"}</td>
      <td className="px-3 py-2 text-slate-700">
        {asset.purchaseDate ? formatDate(asset.purchaseDate) : "—"}
        {asset.purchasePrice && <div className="text-xs text-slate-500">{formatMoney(asset.purchasePrice)}</div>}
      </td>
      <td className="px-3 py-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[asset.status]}`}>
          {STATUS_LABEL[asset.status]}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-sm font-medium text-blue-600 hover:underline">
            Edit
          </button>
          <select
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 outline-none focus:border-sky-400"
            value={asset.status}
            disabled={pending}
            onChange={(e) => handleStatusChange(e.target.value as AssetStatus)}
          >
            {(Object.keys(STATUS_LABEL) as AssetStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </td>
    </tr>
  );
}
