"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

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

type ExtractedSaleFields = {
  passengerName: string | null;
  pnr: string | null;
  airline: string | null;
  origin: string | null;
  destination: string | null;
  travelDate: string | null;
  salePrice: number | null;
  customerPhone: string | null;
  customerEmail: string | null;
  notes: string | null;
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
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
const labelClass = "block text-sm font-medium mb-1 text-slate-700";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<SaleFormValues>({ ...emptyValues, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [source, setSource] = useState<"MANUAL" | "DOCUMENT_UPLOAD">("MANUAL");
  const [pastedText, setPastedText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractNotice, setExtractNotice] = useState<string | null>(null);

  function update<K extends keyof SaleFormValues>(key: K, value: SaleFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleExtract(file: File | null) {
    if (!file && !pastedText.trim()) {
      setExtractError("Upload a PDF or paste confirmation text first");
      return;
    }
    setExtracting(true);
    setExtractError(null);
    setExtractNotice(null);

    const formData = new FormData();
    if (file) formData.append("file", file);
    else formData.append("text", pastedText);

    try {
      const res = await fetch("/api/sales/extract", { method: "POST", body: formData });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setExtractError(body.error || "Extraction failed — please fill in the form manually");
        return;
      }

      const fields = body.fields as ExtractedSaleFields;
      setValues((prev) => ({
        ...prev,
        passengerName: fields.passengerName ?? prev.passengerName,
        pnr: fields.pnr ?? prev.pnr,
        airline: fields.airline ?? prev.airline,
        origin: fields.origin ?? prev.origin,
        destination: fields.destination ?? prev.destination,
        travelDate: fields.travelDate ?? prev.travelDate,
        salePrice: fields.salePrice != null ? String(fields.salePrice) : prev.salePrice,
        customerPhone: fields.customerPhone ?? prev.customerPhone,
        customerEmail: fields.customerEmail ?? prev.customerEmail,
        notes: fields.notes ?? prev.notes,
      }));
      setSource("DOCUMENT_UPLOAD");
      setExtractNotice("Fields pre-filled from the document — review every field below before saving.");
    } catch {
      setExtractError("Network error — please fill in the form manually");
    } finally {
      setExtracting(false);
    }
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
    if (mode === "create") {
      payload.source = source;
    }
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
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <p className="animate-fade-in rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}

      {mode === "create" && (
        <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Import from document (optional)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Upload a GDS e-ticket/itinerary PDF, or paste the confirmation text. Extracted fields pre-fill the form
            below — nothing is saved until you review and click Save.
          </p>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="extractFile">
                PDF upload
              </label>
              <input
                id="extractFile"
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className={inputClass}
                disabled={extracting}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="extractText">
                Or paste confirmation text
              </label>
              <textarea
                id="extractText"
                rows={1}
                className={inputClass}
                placeholder="Paste raw GDS confirmation text"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                disabled={extracting}
              />
            </div>
          </div>

          {extractError && (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
              {extractError}
            </p>
          )}
          {extractNotice && (
            <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {extractNotice}
            </p>
          )}

          <button
            type="button"
            disabled={extracting}
            onClick={() => handleExtract(fileInputRef.current?.files?.[0] ?? null)}
            className="mt-3 rounded-lg border border-sky-300 bg-white px-4 py-2 text-sm font-medium text-sky-700 shadow-sm transition-colors hover:bg-sky-50 disabled:opacity-60"
          >
            {extracting ? "Extracting…" : "Extract details"}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-sky-100 bg-white p-5 shadow-sm">
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

      <div className="mt-4">
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
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-300/50 transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "Saving…" : mode === "create" ? "Save sale" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/sales")}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:border-sky-200 hover:bg-sky-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
