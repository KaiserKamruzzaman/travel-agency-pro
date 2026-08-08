"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export type SaleFormValues = {
  passengerName: string;
  pnr: string;
  airline: string;
  origin: string;
  destination: string;
  travelDate: string;
  salePrice: string;
  costPrice: string;
  paymentStatus: "PAID" | "PARTIAL" | "DUE";
  customerPhone: string;
  customerEmail: string;
  saleDate: string;
  status: "ISSUED" | "CANCELLED" | "REFUNDED" | "VOID";
  notes: string;
};

const emptyValues: SaleFormValues = {
  passengerName: "",
  pnr: "",
  airline: "",
  origin: "",
  destination: "",
  travelDate: "",
  salePrice: "",
  costPrice: "",
  paymentStatus: "DUE",
  customerPhone: "",
  customerEmail: "",
  saleDate: new Date().toISOString().slice(0, 10),
  status: "ISSUED",
  notes: "",
};

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900";
const labelClass = "block text-sm font-medium mb-1";

export function SaleForm({
  mode,
  saleId,
  initialValues,
}: {
  mode: "create" | "edit";
  saleId?: string;
  initialValues?: Partial<SaleFormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<SaleFormValues>({ ...emptyValues, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof SaleFormValues>(key: K, value: SaleFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const url = mode === "create" ? "/api/sales" : `/api/sales/${saleId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const payload: Record<string, unknown> = {
      passengerName: values.passengerName,
      pnr: values.pnr,
      airline: values.airline,
      origin: values.origin,
      destination: values.destination,
      travelDate: values.travelDate,
      salePrice: values.salePrice,
      costPrice: values.costPrice,
      paymentStatus: values.paymentStatus,
      customerPhone: values.customerPhone,
      customerEmail: values.customerEmail,
      saleDate: values.saleDate,
      notes: values.notes,
    };
    if (mode === "edit") {
      payload.status = values.status;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const issueMessage = Array.isArray(body.issues)
          ? body.issues.map((i: { message: string }) => i.message).join(", ")
          : undefined;
        setError(issueMessage || body.error || "Something went wrong");
        setSubmitting(false);
        return;
      }

      router.push("/sales");
      router.refresh();
    } catch {
      setError("Network error — please try again");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300" role="alert">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="passengerName">
            Passenger name(s) *
          </label>
          <input
            id="passengerName"
            required
            className={inputClass}
            value={values.passengerName}
            onChange={(e) => update("passengerName", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="pnr">
            PNR / booking reference
          </label>
          <input
            id="pnr"
            className={inputClass}
            value={values.pnr}
            onChange={(e) => update("pnr", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="airline">
            Airline *
          </label>
          <input
            id="airline"
            required
            className={inputClass}
            value={values.airline}
            onChange={(e) => update("airline", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="origin">
              Origin *
            </label>
            <input
              id="origin"
              required
              placeholder="DAC"
              className={inputClass}
              value={values.origin}
              onChange={(e) => update("origin", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="destination">
              Destination *
            </label>
            <input
              id="destination"
              required
              placeholder="DXB"
              className={inputClass}
              value={values.destination}
              onChange={(e) => update("destination", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="travelDate">
            Travel date *
          </label>
          <input
            id="travelDate"
            type="date"
            required
            className={inputClass}
            value={values.travelDate}
            onChange={(e) => update("travelDate", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="saleDate">
            Sale date *
          </label>
          <input
            id="saleDate"
            type="date"
            required
            className={inputClass}
            value={values.saleDate}
            onChange={(e) => update("saleDate", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="salePrice">
            Sale price (USD) *
          </label>
          <input
            id="salePrice"
            type="number"
            step="0.01"
            min="0"
            required
            className={inputClass}
            value={values.salePrice}
            onChange={(e) => update("salePrice", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="costPrice">
            Cost / net price (USD) *
          </label>
          <input
            id="costPrice"
            type="number"
            step="0.01"
            min="0"
            required
            className={inputClass}
            value={values.costPrice}
            onChange={(e) => update("costPrice", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="paymentStatus">
            Payment status
          </label>
          <select
            id="paymentStatus"
            className={inputClass}
            value={values.paymentStatus}
            onChange={(e) => update("paymentStatus", e.target.value as SaleFormValues["paymentStatus"])}
          >
            <option value="DUE">Due</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid in full</option>
          </select>
        </div>

        {mode === "edit" && (
          <div>
            <label className={labelClass} htmlFor="status">
              Status
            </label>
            <select
              id="status"
              className={inputClass}
              value={values.status}
              onChange={(e) => update("status", e.target.value as SaleFormValues["status"])}
            >
              <option value="ISSUED">Issued</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
              <option value="VOID">Void</option>
            </select>
          </div>
        )}

        <div>
          <label className={labelClass} htmlFor="customerPhone">
            Customer phone
          </label>
          <input
            id="customerPhone"
            className={inputClass}
            value={values.customerPhone}
            onChange={(e) => update("customerPhone", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="customerEmail">
            Customer email
          </label>
          <input
            id="customerEmail"
            type="email"
            className={inputClass}
            value={values.customerEmail}
            onChange={(e) => update("customerEmail", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          className={inputClass}
          value={values.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
        >
          {submitting ? "Saving..." : mode === "create" ? "Save sale" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/sales")}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
