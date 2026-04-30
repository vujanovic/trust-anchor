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
import { useEffect, useState } from "react"
import AppOrganizationDialog from "@/pages/admin/dialog/app-organization-dialog.tsx"
import type { OrganizationFormValues } from "@/lib/validations"
import { api } from "@/lib/axios.ts"

interface Organization {
  id: number
  name: string
  code: string
  email: string
  registrationDate: string
  domain: string
  location: string
}

export default function AdminOrganizationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const selectedId = searchParams.get("id")

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await api.get<Organization[]>("/api/v1/org")
        const data = response.data
        setOrganizations(data)
        if (!selectedId && data.length > 0) {
          setSearchParams({ id: data[0].id.toString() }, { replace: true })
        }
      } catch (error) {
        console.error("Error fetching organizations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganizations()
  }, [selectedId, setSearchParams])

  const handleCreateOrg = async (data: OrganizationFormValues) => {
    try {
      const formattedPayload = {
        ...data,
        registrationDate: new Date(data.registrationDate).toISOString(),
      }

      const response = await api.post<Organization>(
        "/api/v1/org",
        formattedPayload
      )

      const newOrg = response.data

      setOrganizations((prev) => [...prev, newOrg])
      setSearchParams({ id: newOrg.id.toString() })
    } catch (error) {
      console.error("Error creating organization:", error)
    }
  }

  const handleDeleteOrg = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this entity?")) return;

    try {
      await api.delete(`/api/v1/org/${id}`);

      const filteredOrgs = organizations.filter((org) => org.id !== id);
      setOrganizations(filteredOrgs);

      if (filteredOrgs.length > 0) {
        setSearchParams({ id: filteredOrgs[0].id.toString() });
      } else {
        setSearchParams({});
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
    }
  };

  const selectedOrg = organizations.find((o) => o.id.toString() === selectedId)

  return (
    <div className="relative flex h-[calc(100vh-64px)] w-full overflow-hidden bg-sidebar">
      <AppOrganizationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleCreateOrg}
      />
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

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Loading entities...
            </div>
          ) : (
            organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => setSearchParams({ id: org.id.toString() })}
                className={`group flex w-full flex-col border-b border-sidebar-border/50 p-5 text-left transition-all hover:bg-sidebar-accent/30 ${
                  selectedId === org.id.toString()
                    ? "border-l-2 border-l-primary bg-sidebar-accent/60"
                    : "border-l-2 border-l-transparent"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`font-bold tracking-tight ${selectedId === org.id.toString() ? "text-primary" : ""}`}
                  >
                    {org.name}
                  </span>
                </div>
                <span className="truncate text-[11px] text-muted-foreground italic">
                  {org.email}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
      <div className="relative flex flex-1 flex-col bg-sidebar">
        {selectedOrg ? (
          <div className="flex h-full flex-col overflow-y-auto">
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
                  onClick={() => handleDeleteOrg(selectedOrg.id)}
                  className="rounded-none border-sidebar-border transition-colors hover:bg-destructive/20 hover:text-destructive"
                >
                  <Trash2 className="mr-2 size-3" /> Delete
                </Button>
              </div>
            </div>

            <div className="flex-1 p-12">
              <div className="w-full">
                <div className="mb-12 flex items-start gap-6">
                  <div className="flex size-20 shrink-0 items-center justify-center bg-primary text-primary-foreground shadow-lg shadow-primary/20">
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
                      value={selectedOrg.domain}
                    />
                  </section>

                  <section className="space-y-6">
                    <h3 className="border-b border-sidebar-border pb-2 text-xs font-bold tracking-[0.2em] text-primary/80 uppercase">
                      PKI Compliance
                    </h3>
                    <DetailBlock
                      icon={Calendar}
                      label="Registration Date"
                      value={selectedOrg.registrationDate}
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
          <div className="flex h-full w-full flex-1 items-center justify-center px-64">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-sidebar-border bg-sidebar-accent/20">
                <Building2 className="size-8 text-muted-foreground/30" />
              </div>
              <p className="text-[10px] tracking-widest text-muted-foreground uppercase">
                {isLoading
                  ? "Connecting to backend..."
                  : "Select entity to inspect"}
              </p>
            </div>
          </div>
        )}
        <Button
          onClick={() => setIsDialogOpen(true)}
          size="lg"
          className="group fixed right-10 bottom-10 size-16 rounded-4xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40 transition-transform hover:scale-105"
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
