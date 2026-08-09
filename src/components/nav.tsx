import Link from "next/link";
import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { logoutAction } from "@/app/actions/auth";

function PlaneMark() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-sm shadow-sky-300/50">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
        <path d="M21 12.5c0 .4-.3.8-.7.9l-5.6 1.9-2.1 5.8c-.1.4-.5.6-.9.6-.1 0-.2 0-.3-.1-.4-.1-.6-.5-.6-.9l.4-6-4.4 1.5-1.1 2.5c-.1.3-.4.5-.7.5h-.1c-.4 0-.7-.3-.7-.7v-3l-1.7-.6c-.3-.1-.5-.4-.5-.7 0-.3.2-.6.5-.7l1.7-.6v-3c0-.4.3-.7.7-.7h.1c.3 0 .6.2.7.5l1.1 2.5 4.4 1.5-.4-6c0-.4.2-.8.6-.9.4-.1.8 0 1 .4l2.1 5.8 5.6 1.9c.4.1.7.5.7.9z" />
      </svg>
    </span>
  );
}

export function Nav({ session }: { session: Session }) {
  const isOwner = session.user.role === "OWNER";

  return (
    <header className="sticky top-0 z-30 border-b border-sky-100 bg-white/80 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/sales" className="flex items-center gap-2 font-semibold text-slate-900">
            <PlaneMark />
            <span className="hidden sm:inline">Wanderlust Travel</span>
          </Link>
          <nav className="flex items-center gap-1">
            {isOwner && (
              <>
                <NavLink href="/dashboard">Dashboard</NavLink>
                <NavLink href="/reports">Reports</NavLink>
                <NavLink href="/dashboard/branches">Branches</NavLink>
                <NavLink href="/dashboard/employees">Employees</NavLink>
                <NavLink href="/dashboard/assets">Assets</NavLink>
              </>
            )}
            <NavLink href="/sales">Sales</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Link href="/profile" className="hidden items-center gap-2 sm:flex hover:text-blue-600">
            <span className="text-slate-600 hover:text-blue-600">{session.user.name}</span>
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
              {isOwner ? "Owner" : "Employee"}
            </span>
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-slate-900"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-sky-50 hover:text-slate-900"
    >
      {children}
    </Link>
  );
}
