import {
  Anchor,
  ArrowRight,
  Building2,
  Lock,
  Mail,
  Shield,
  User,
} from "lucide-react"

export default function AppRegistration() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <main className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] dark:bg-slate-950 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]"></div>
        <div className="relative z-10 w-full max-w-112.5">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">
              <Shield className="h-3 w-3" /> Identity Enrollment
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight dark:text-white">
              Create Account
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Register to start managing your X.509 certificates.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none">
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Nikola"
                      className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm transition-all focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Tesla"
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="tesla@trustanchor.com"
                    className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm transition-all focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Affiliated Organization
                </label>
                <div className="relative">
                  <Building2 className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                  <select className="w-full appearance-none rounded-md border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm transition-all focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950">
                    <option value="">Select an organization...</option>
                    <option value="siit">SIIT Security Lab</option>
                    <option value="ftn">FTN Novi Sad</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Master Password
                </label>
                <div className="relative">
                  <Lock className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm transition-all focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Repeat Password
                </label>
                <div className="relative">
                  <Lock className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm transition-all focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>
              <button className="group relative mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 py-3 font-bold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                Register Identity
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
            <div className="mt-8 text-center text-xs">
              <p className="text-slate-500 dark:text-slate-400">
                Already have an identity?{" "}
                <a
                  href="/login"
                  className="font-bold text-cyan-600 hover:underline dark:text-cyan-400"
                >
                  Secure Login
                </a>
              </p>
            </div>
          </div>
          <p className="mt-8 text-center text-[10px] leading-relaxed text-slate-400 dark:text-slate-600">
            By registering, you agree to our{" "}
            <span className="underline">
              CPS (Certification Practice Statement)
            </span>{" "}
            <br />
            and Zero-Knowledge Data Policy.
          </p>
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 opacity-[0.05] dark:opacity-[0.1]">
          <Anchor
            size={600}
            strokeWidth={1}
            className="text-slate-900 dark:text-cyan-400"
          />
        </div>
      </main>
    </div>
  )
}
