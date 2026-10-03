import Link from "next/link"

export function TypingAppBanner() {
  return (
    <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 px-4 py-3">
      <div className="container flex items-center justify-center gap-2">
        <span className="text-sm text-blue-900 dark:text-blue-100">
          Check out my typing app:
        </span>
        <Link
          href="https://typeflow-cyan.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          TypeFlow ↗
        </Link>
      </div>
    </div>
  )
}
