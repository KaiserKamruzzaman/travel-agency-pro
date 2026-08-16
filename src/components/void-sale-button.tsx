"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useConfirm } from "@/components/ui/confirm-dialog";

export function VoidSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    const ok = await confirm({
      title: "Void this sale?",
      description: "It will be kept for audit history but marked void.",
      confirmLabel: "Void sale",
      variant: "danger",
    });
    if (!ok) return;
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
      className="text-sm font-medium text-rose-600 dark:text-rose-400 transition-colors hover:text-rose-700 dark:hover:text-rose-300 hover:underline disabled:opacity-60"
    >
      {pending ? "Voiding…" : "Void"}
    </button>
  );
}
