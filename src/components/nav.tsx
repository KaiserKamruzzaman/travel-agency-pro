import Link from "next/link";
import type { Session } from "next-auth";
import { logoutAction } from "@/app/actions/auth";

export function Nav({ session }: { session: Session }) {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/sales" className="font-semibold">
            Wanderlust Travel
          </Link>
          <Link href="/sales" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
            Sales
          </Link>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="text-neutral-500">
            {session.user.name}
            <span className="ml-1 rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {session.user.role === "OWNER" ? "Owner" : "Employee"}
            </span>
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-2.5 py-1 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
