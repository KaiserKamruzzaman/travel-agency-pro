"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function VoidSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!confirm("Void this sale? It will be kept for audit history but marked void.")) return;
    setPending(true);
    const res = await fetch(`/api/sales/${saleId}`, { method: "DELETE" });
    setPending(false);
    if (res.ok) {
      router.refresh();
    } else {
      alert("Could not void this sale.");
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-sm font-medium text-rose-600 transition-colors hover:text-rose-700 hover:underline disabled:opacity-60"
    >
      {pending ? "Voiding…" : "Void"}
    </button>
  );
}
