"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "next-auth";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { logoutAction } from "@/app/actions/auth";

type Theme = "light" | "dark" | "system";
const THEME_KEY = "wanderlust-theme";

function applyTheme(theme: Theme) {
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function ThemeToggle({ theme, onChange, className }: { theme: Theme; onChange: (t: Theme) => void; className?: string }) {
  const options: { value: Theme; label: string; icon: ReactNode }[] = [
    { value: "light", label: "Light", icon: <SunIcon /> },
    { value: "dark", label: "Dark", icon: <MoonIcon /> },
    { value: "system", label: "System", icon: <MonitorIcon /> },
  ];

  return (
    <div
      role="group"
      aria-label="Theme"
      className={`inline-flex items-center gap-0.5 rounded-full border border-slate-200 dark:border-slate-700 p-0.5 ${className ?? ""}`}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={opt.label}
          aria-pressed={theme === opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
            theme === opt.value
              ? "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"
              : "text-slate-400 hover:bg-sky-50 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-sky-950/40 dark:hover:text-slate-300"
          }`}
        >
          {opt.icon}
          <span className="sr-only">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ProfileMenu({ session, isOwner }: { session: Session; isOwner: boolean }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="hidden items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 transition-colors outline-none hover:bg-sky-50 hover:text-slate-900 data-[state=open]:bg-sky-50 data-[state=open]:text-slate-900 dark:text-slate-400 dark:hover:bg-sky-950/40 dark:hover:text-slate-100 dark:data-[state=open]:bg-sky-950/40 dark:data-[state=open]:text-slate-100 lg:flex"
        >
          <span className="max-w-32 truncate">{session.user.name}</span>
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
            {isOwner ? "Owner" : "Employee"}
          </span>
          <ChevronDownIcon />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="animate-popper-pop-in z-50 min-w-48 rounded-xl border border-sky-100 bg-white p-1.5 shadow-lg shadow-sky-900/10 outline-none dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="px-2.5 py-1.5">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{session.user.name}</p>
            {session.user.email && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{session.user.email}</p>}
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
          <DropdownMenu.Item asChild>
            <Link
              href="/profile"
              className="flex cursor-pointer items-center rounded-lg px-2.5 py-2 text-sm text-slate-600 outline-none transition-colors data-[highlighted]:bg-sky-50 data-[highlighted]:text-slate-900 dark:text-slate-400 dark:data-[highlighted]:bg-sky-950/40 dark:data-[highlighted]:text-slate-100"
            >
              Profile
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
          <DropdownMenu.Item
            onSelect={() => void logoutAction()}
            className="flex cursor-pointer items-center rounded-lg px-2.5 py-2 text-sm text-rose-600 outline-none transition-colors data-[highlighted]:bg-rose-50 dark:text-rose-400 dark:data-[highlighted]:bg-rose-950/30"
          >
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function PlaneMark() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-sm shadow-sky-300/50">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5">
        <path d="M21 12.5c0 .4-.3.8-.7.9l-5.6 1.9-2.1 5.8c-.1.4-.5.6-.9.6-.1 0-.2 0-.3-.1-.4-.1-.6-.5-.6-.9l.4-6-4.4 1.5-1.1 2.5c-.1.3-.4.5-.7.5h-.1c-.4 0-.7-.3-.7-.7v-3l-1.7-.6c-.3-.1-.5-.4-.5-.7 0-.3.2-.6.5-.7l1.7-.6v-3c0-.4.3-.7.7-.7h.1c.3 0 .6.2.7.5l1.1 2.5 4.4 1.5-.4-6c0-.4.2-.8.6-.9.4-.1.8 0 1 .4l2.1 5.8 5.6 1.9c.4.1.7.5.7.9z" />
      </svg>
    </span>
  );
}

export function Nav({ session }: { session: Session }) {
  const isOwner = session.user.role === "OWNER";
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const [theme, setTheme] = useState<Theme>("system");

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") setTheme(stored);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function selectTheme(t: Theme) {
    setTheme(t);
    localStorage.setItem(THEME_KEY, t);
    applyTheme(t);
  }

  const links = [
    ...(isOwner
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/reports", label: "Reports" },
          { href: "/dashboard/branches", label: "Branches" },
          { href: "/dashboard/employees", label: "Employees" },
          { href: "/dashboard/expenses", label: "Expenses" },
          { href: "/dashboard/assets", label: "Assets" },
        ]
      : []),
    { href: "/sales", label: "Sales" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-sky-100 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/sales" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
            <PlaneMark />
            <span className="hidden sm:inline">Wanderlust Travel</span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <ThemeToggle theme={theme} onChange={selectTheme} className="hidden lg:inline-flex" />
          <ProfileMenu session={session} isOwner={isOwner} />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="relative flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 transition-colors hover:bg-sky-50 dark:hover:bg-sky-950/40 lg:hidden"
          >
            <span className="relative block h-3.5 w-4.5">
              <span
                className={`absolute left-0 h-0.5 w-4.5 rounded-full bg-current transition-all duration-300 ease-out motion-reduce:transition-none ${
                  open ? "top-1.5 rotate-45" : "top-0 rotate-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 h-0.5 w-4.5 rounded-full bg-current transition-opacity duration-200 ease-out motion-reduce:transition-none ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 h-0.5 w-4.5 rounded-full bg-current transition-all duration-300 ease-out motion-reduce:transition-none ${
                  open ? "top-1.5 -rotate-45" : "top-3 rotate-0"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none lg:hidden ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`border-t border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900 transition-opacity duration-200 ease-out motion-reduce:transition-none ${
              open ? "opacity-100 delay-100" : "opacity-0"
            }`}
          >
            <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
              {links.map((link) => (
                <NavLink key={link.href} href={link.href} block>
                  {link.label}
                </NavLink>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-3 pt-3 pb-1.5 text-sm text-slate-600 dark:text-slate-400">
                <span>Theme</span>
                <ThemeToggle theme={theme} onChange={selectTheme} />
              </div>
              <Link
                href="/profile"
                className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <span>{session.user.name}</span>
                <span className="rounded-full bg-sky-100 dark:bg-sky-900/50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
                  {isOwner ? "Owner" : "Employee"}
                </span>
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-left text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:border-sky-200 dark:hover:border-sky-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  Log out
                </button>
              </form>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children, block }: { href: string; children: ReactNode; block?: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 transition-colors hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-slate-900 dark:hover:text-slate-100 ${
        block ? "w-full" : ""
      }`}
    >
      {children}
    </Link>
  );
}
