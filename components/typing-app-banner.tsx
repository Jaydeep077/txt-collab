import Link from "next/link"

export function TypingAppBanner() {
  return (
    <div className="border-b border-slate-200/80 bg-gradient-to-r from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="container mx-auto max-w-7xl px-4 py-2.5">
        <div className="flex items-center justify-center">
          <Link
            href="https://typeflow-cyan.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-sky-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
          >
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
            <span>Try my typing app</span>
            <span className="font-semibold text-sky-600 dark:text-sky-400">TypeFlow</span>
            <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              ↗
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
