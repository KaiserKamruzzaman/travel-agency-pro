import Link from "next/link";
import type { ReactNode } from "react";

export function Pagination({
  basePath,
  searchParams,
  page,
  pageCount,
  total,
  pageSize,
  resultCount,
}: {
  basePath: string;
  searchParams: Record<string, string | undefined>;
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  resultCount: number;
}) {
  function hrefForPage(p: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = (page - 1) * pageSize + resultCount;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-slate-500">{total === 0 ? "No results" : `Showing ${start}–${end} of ${total}`}</p>
      {pageCount > 1 && (
        <div className="flex items-center gap-2">
          <PageLink href={hrefForPage(page - 1)} disabled={page <= 1}>
            ← Prev
          </PageLink>
          <span className="px-1 text-slate-500">
            Page {page} of {pageCount}
          </span>
          <PageLink href={hrefForPage(page + 1)} disabled={page >= pageCount}>
            Next →
          </PageLink>
        </div>
      )}
    </div>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: ReactNode }) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-lg border border-slate-100 px-3 py-1.5 font-medium text-slate-300">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-slate-900"
    >
      {children}
    </Link>
  );
}
