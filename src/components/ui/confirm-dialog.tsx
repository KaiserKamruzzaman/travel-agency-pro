"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ConfirmVariant = "danger" | "neutral";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
};

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

const variantStyles: Record<ConfirmVariant, { icon: ReactNode; confirmClass: string }> = {
  danger: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-rose-600 dark:text-rose-400">
        <path
          d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.29 2.25h17.78A1.5 1.5 0 0 0 22.18 18L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    confirmClass:
      "bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-300/50 hover:shadow-md focus-visible:ring-rose-300 dark:focus-visible:ring-rose-700",
  },
  neutral: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-sky-600 dark:text-sky-400">
        <path
          d="M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    confirmClass:
      "bg-gradient-to-r from-sky-500 to-blue-600 shadow-sky-300/50 hover:shadow-md focus-visible:ring-sky-300 dark:focus-visible:ring-sky-700",
  },
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const close = useCallback(
    (value: boolean) => {
      state?.resolve(value);
      setState(null);
    },
    [state]
  );

  const { icon, confirmClass } = variantStyles[state?.variant ?? "danger"];

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog.Root open={state !== null} onOpenChange={(open) => !open && close(false)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm animate-dialog-overlay" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-2xl shadow-slate-900/10 outline-none animate-dialog-pop-in">
            {state && (
              <>
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      state.variant === "neutral" ? "bg-sky-50 dark:bg-sky-950/40" : "bg-rose-50 dark:bg-rose-950/30"
                    }`}
                  >
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <AlertDialog.Title className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {state.title}
                    </AlertDialog.Title>
                    {state.description && (
                      <AlertDialog.Description className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {state.description}
                      </AlertDialog.Description>
                    )}
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <AlertDialog.Cancel asChild>
                    <button
                      type="button"
                      onClick={() => close(false)}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 dark:focus-visible:ring-slate-700"
                    >
                      {state.cancelLabel ?? "Cancel"}
                    </button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button
                      type="button"
                      onClick={() => close(true)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 ${confirmClass}`}
                    >
                      {state.confirmLabel ?? "Confirm"}
                    </button>
                  </AlertDialog.Action>
                </div>
              </>
            )}
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
}
