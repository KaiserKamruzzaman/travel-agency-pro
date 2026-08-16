"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-100 dark:from-slate-900 via-white dark:via-slate-950 to-blue-50 dark:to-slate-900" />
        <div className="animate-float-slow absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-200/50 dark:bg-sky-900/20 blur-3xl" />
        <div className="animate-float-slower absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-blue-200/50 dark:bg-blue-900/20 blur-3xl" />
        <div className="animate-float-slow absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-sky-100/70 dark:bg-sky-900/20 blur-3xl" />
      </div>

      <div className="animate-fade-in-up w-full max-w-sm">
        <div className="rounded-2xl border border-sky-100 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 p-8 shadow-xl shadow-sky-900/5 backdrop-blur-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md shadow-sky-300/60">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M21 12.5c0 .4-.3.8-.7.9l-5.6 1.9-2.1 5.8c-.1.4-.5.6-.9.6-.1 0-.2 0-.3-.1-.4-.1-.6-.5-.6-.9l.4-6-4.4 1.5-1.1 2.5c-.1.3-.4.5-.7.5h-.1c-.4 0-.7-.3-.7-.7v-3l-1.7-.6c-.3-.1-.5-.4-.5-.7 0-.3.2-.6.5-.7l1.7-.6v-3c0-.4.3-.7.7-.7h.1c.3 0 .6.2.7.5l1.1 2.5 4.4 1.5-.4-6c0-.4.2-.8.6-.9.4-.1.8 0 1 .4l2.1 5.8 5.6 1.9c.4.1.7.5.7.9z" />
              </svg>
            </span>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Wanderlust Travel</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to your sales tracker</p>
          </div>

          <form action={formAction} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors focus:border-sky-400 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/40"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition-colors focus:border-sky-400 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/40"
              />
            </div>

            {state?.error && (
              <p
                className="animate-fade-in rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-sm text-rose-700 dark:text-rose-300"
                role="alert"
              >
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm shadow-sky-300/50 transition-all hover:shadow-md hover:shadow-sky-300/60 active:scale-[0.99] disabled:opacity-60"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-sky-100 dark:border-slate-700 bg-sky-50/60 dark:bg-sky-950/30 p-3 text-xs text-slate-500 dark:text-slate-400">
            <p className="mb-1 font-medium text-slate-600 dark:text-slate-400">Seed accounts</p>
            <p>owner@wanderlust.test / owner123</p>
            <p>alice@wanderlust.test / employee123 (employee)</p>
            <p>bob@wanderlust.test / employee123 (employee)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
