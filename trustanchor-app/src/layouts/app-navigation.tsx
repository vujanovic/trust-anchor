import { Anchor, Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

export default function AppNavigation() {
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  return (
    <div className="overflow-x-hidden overflow-y-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-cyan-600 p-1.5 shadow-lg shadow-cyan-500/20">
            <Anchor className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
            Trust
            <span className="text-cyan-600 dark:text-cyan-400">Anchor</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {darkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
          <div className="hidden gap-4 md:flex">
            <button className="px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400">
              Log In
            </button>
            <button className="rounded-md bg-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700">
              Get Started
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
