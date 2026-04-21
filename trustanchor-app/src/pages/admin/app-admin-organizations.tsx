import { useSearchParams } from "react-router-dom"
import {
  Building2,
  Calendar,
  Edit2,
  Globe,
  type LucideIcon,
  Mail,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

const organizations = [
  {
    id: "1",
    name: "SIIT Security Lab",
    code: "SIIT",
    email: "contact@siit.rs",
    created: "2024-03-10",
    website: "siit.rs",
    location: "Novi Sad, Serbia",
  },
  {
    id: "2",
    name: "FTN Novi Sad",
    code: "FTN",
    email: "admin@ftn.uns.ac.rs",
    created: "2024-01-15",
    website: "uns.ac.rs",
    location: "Novi Sad, Serbia",
  },
  {
    id: "3",
    name: "TrustAnchor Root",
    code: "TAR",
    email: "root@trustanchor.com",
    created: "2023-12-01",
    website: "trustanchor.com",
    location: "Belgrade, Serbia",
  },
]

export default function AdminOrganizationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get("id")
  const selectedOrg = organizations.find((o) => o.id === selectedId)

  return (
    <div className="relative flex h-[calc(100vh-64px)] w-full overflow-hidden bg-sidebar">
      <div className="flex w-80 flex-col border-r border-sidebar-border bg-sidebar-accent/5">
        <div className="space-y-4 border-b border-sidebar-border p-4">
          <h2 className="text-sm font-bold tracking-widest uppercase">
            Entities
          </h2>
          <div className="relative">
            <Search className="absolute top-2.5 left-2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="h-9 rounded-none border-sidebar-border bg-sidebar/50 pl-8 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => setSearchParams({ id: org.id })}
              className={`group flex w-full flex-col border-b border-sidebar-border/50 p-5 text-left transition-all hover:bg-sidebar-accent/30 ${
                selectedId === org.id
                  ? "border-l-2 border-l-primary bg-sidebar-accent/60"
                  : "border-l-2 border-l-transparent"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={`font-bold tracking-tight ${selectedId === org.id ? "text-primary" : ""}`}
                >
                  {org.name}
                </span>
              </div>
              <span className="truncate text-[11px] text-muted-foreground italic">
                {org.email}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex flex-1 flex-col bg-sidebar">
        {selectedOrg ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar-accent/5 px-8 py-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-tighter text-muted-foreground uppercase">
                  ID: {selectedOrg.id}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none border-sidebar-border transition-colors hover:bg-sidebar-accent"
                >
                  <Edit2 className="mr-2 size-3" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none border-sidebar-border transition-colors hover:bg-destructive/20 hover:text-destructive"
                >
                  <Trash2 className="mr-2 size-3" /> Delete
                </Button>
              </div>
            </div>

            <div className="flex-1 p-12">
              <div className="max-w-4xl">
                <div className="mb-12 flex items-start gap-6">
                  <div className="flex size-20 items-center justify-center bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <Building2 className="size-10" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase">
                      {selectedOrg.name}
                    </h1>
                    <div className="mt-2 flex items-center gap-4">
                      <p className="font-mono text-lg tracking-widest text-primary">
                        {selectedOrg.code}
                      </p>
                      <Separator
                        orientation="vertical"
                        className="h-4 bg-sidebar-border"
                      />
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="size-3.5" /> {selectedOrg.location}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2">
                  <section className="space-y-6">
                    <h3 className="border-b border-sidebar-border pb-2 text-xs font-bold tracking-[0.2em] text-primary/80 uppercase">
                      Administrative Info
                    </h3>
                    <DetailBlock
                      icon={Mail}
                      label="Communication Email"
                      value={selectedOrg.email}
                    />
                    <DetailBlock
                      icon={Globe}
                      label="Official Domain"
                      value={selectedOrg.website}
                    />
                  </section>

                  <section className="space-y-6">
                    <h3 className="border-b border-sidebar-border pb-2 text-xs font-bold tracking-[0.2em] text-primary/80 uppercase">
                      PKI Compliance
                    </h3>
                    <DetailBlock
                      icon={Calendar}
                      label="Registration Date"
                      value={selectedOrg.created}
                    />
                    <DetailBlock
                      icon={ShieldCheck}
                      label="Certificate Status"
                      value="Authorized Intermediate CA"
                    />
                  </section>
                </div>

                <div className="mt-16 border-l-2 border-primary bg-sidebar-accent/20 p-6">
                  <h4 className="mb-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    Legal Disclaimer
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    This entity is recognized by TrustAnchor Root Authority. All
                    certificates issued by this organization must comply with
                    the CPS (Certification Practice Statement) Version 2.4.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-accent/20">
                <Building2 className="size-8 text-muted-foreground/30" />
              </div>
              <p className="text-[10px] tracking-widest text-muted-foreground uppercase">
                Select entity to inspect
              </p>
            </div>
          </div>
        )}

        {/* LARGE FLOATING ACTION BUTTON (Lower Right) */}
        <Button
          size="lg"
          className="group fixed right-10 bottom-10 size-16 rounded-none bg-primary text-primary-foreground shadow-2xl shadow-primary/40 transition-transform hover:scale-105"
        >
          <Plus className="size-8 transition-transform group-hover:rotate-90" />
        </Button>
      </div>
    </div>
  )
}

function DetailBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 text-primary">
        <Icon size={16} />
      </div>
      <div className="space-y-1">
        <p className="text-[9px] leading-none font-bold tracking-widest text-muted-foreground/50 uppercase">
          {label}
        </p>
        <p className="text-sm font-semibold tracking-tight">{value}</p>
      </div>
    </div>
  )
}
