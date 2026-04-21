import React from "react"
import {
  Activity,
  Anchor,
  FileCheck,
  Key,
  Lock,
  Shield,
  Users,
} from "lucide-react"

export default function AppHomePage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {/* Hero Section */}
      <header className="relative overflow-hidden border-b border-slate-200 px-6 py-24 dark:border-slate-800">
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold tracking-widest text-cyan-600 uppercase dark:text-cyan-400">
              <Shield className="h-3.5 w-3.5" /> SECURE PKI INFRASTRUCTURE
            </div>
            <h1 className="mb-6 text-5xl leading-[1.1] font-extrabold tracking-tight text-slate-900 md:text-7xl dark:text-white">
              The Anchor of <br />
              <span className="bg-linear-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent dark:from-cyan-400 dark:to-blue-400">
                Digital Certainty.
              </span>
            </h1>
            <p className="mb-10 max-w-xl text-lg leading-relaxed text-slate-600 md:text-xl dark:text-slate-400">
              Manage the entire X.509 lifecycle with zero-knowledge identity
              verification and distributed Certificate Authorities.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="rounded-md bg-slate-900 px-8 py-4 font-bold text-white shadow-xl shadow-slate-200 transition-all hover:opacity-90 dark:bg-white dark:text-slate-900 dark:shadow-none">
                Issue Certificate
              </button>
              <button className="rounded-md border border-slate-200 bg-transparent px-8 py-4 font-bold transition-all hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900">
                Check Revocation List
              </button>
            </div>
          </div>
          <div className="pointer-events-none absolute top-1/2 right-0 flex h-full w-1/3 -translate-y-1/2 items-center justify-center opacity-[0.3] dark:opacity-[0.7]">
            <Anchor
              size={600}
              strokeWidth={1}
              className="rotate-12 transform text-slate-900 dark:text-cyan-400"
            />
          </div>
        </div>

        {/* Abstract Background Grid (shadcn style) */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] [background-size:16px_16px] dark:bg-slate-950 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]"></div>
      </header>

      {/* Role Cards Section */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Administrators",
              icon: <Lock />,
              desc: "Full Root CA management, Master Key rotation, and global visibility.",
              roles: ["Root Issuance", "User Mgmt", "System Logs"],
            },
            {
              title: "CA Users",
              icon: <Users />,
              desc: "Organization-level Intermediate CA control and certificate issuance.",
              roles: ["Dept Issuance", "Local Revocation", "Org Analytics"],
            },
            {
              title: "Standard Users",
              icon: <Key />,
              desc: "Zero-knowledge registration and self-service certificate requests.",
              roles: ["CSR Upload", "Keystore DL", "2FA Login"],
            },
          ].map((card, i) => (
            <div
              key={i}
              className="group rounded-xl border border-slate-200 bg-white p-8 transition-all hover:border-cyan-500 dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:text-cyan-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:text-cyan-400">
                {React.cloneElement(card.icon, { size: 24 })}
              </div>
              <h3 className="mb-3 text-xl font-bold dark:text-white">
                {card.title}
              </h3>
              <p className="mb-6 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {card.desc}
              </p>
              <div className="flex flex-wrap gap-2">
                {card.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-500"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* System Status / Trust Bar */}
      <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8 px-6 py-12">
          <div className="flex items-center gap-3">
            <FileCheck className="h-5 w-5 text-cyan-600" />
            <span className="text-sm font-semibold text-slate-600 italic dark:text-slate-400">
              X.509 Compliance Guaranteed
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-cyan-600" />
            <span className="text-sm font-semibold text-slate-600 italic dark:text-slate-400">
              Real-time CRL/OCSP Active
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-cyan-600" />
            <span className="text-sm font-semibold text-slate-600 italic dark:text-slate-400">
              AES-256 Master Encryption
            </span>
          </div>
        </div>
      </section>

      <footer className="px-6 py-12 text-center">
        <p className="text-sm text-slate-400 dark:text-slate-600">
          Built for SIIT 2026. Security-first PKI architecture.
        </p>
      </footer>
    </div>
  )
}
