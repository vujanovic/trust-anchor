import { useSearchParams } from "react-router-dom"
import {
  Building2,
  Key,
  Lock,
  type LucideIcon,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCircle,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react"
import AppUserDialog from "@/pages/admin/dialog/app-user-dialog.tsx"

const adminUsers = [
  {
    id: "1",
    firstName: "Nikola",
    lastName: "Tesla",
    email: "tesla@siit.rs",
    orgName: "SIIT Security Lab",
    role: "CA Administrator",
    status: "Active",
  },
  {
    id: "2",
    firstName: "Mihajlo",
    lastName: "Pupin",
    email: "pupin@ftn.uns.ac.rs",
    orgName: "FTN Novi Sad",
    role: "Operator",
    status: "Active",
  },
]

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

export default function AppAdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const selectedId = searchParams.get("id")

  useEffect(() => {
    if (!selectedId && adminUsers.length > 0) {
      setSearchParams({ id: adminUsers[0].id }, { replace: true })
    }
  }, [selectedId, setSearchParams])

  const selectedUser = adminUsers.find((u) => u.id === selectedId)

  const handleUserSubmit = async () => {}

  return (
    <div className="relative flex h-[calc(100vh-64px)] w-full overflow-hidden bg-sidebar">
      <AppUserDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleUserSubmit}
        organizations={organizations}
      />
      <div className="flex w-80 flex-col border-r border-sidebar-border bg-sidebar-accent/5">
        <div className="space-y-4 border-b border-sidebar-border p-4">
          <h2 className="text-sm font-bold tracking-widest text-sidebar-foreground uppercase">
            Admin Users
          </h2>
          <div className="relative">
            <Search className="absolute top-2.5 left-2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="h-9 rounded-none border-sidebar-border bg-sidebar/50 pl-8 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1">
          {adminUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => setSearchParams({ id: user.id })}
              className={`group flex w-full flex-col border-b border-sidebar-border/50 p-5 text-left transition-all hover:bg-sidebar-accent/30 ${
                selectedId === user.id
                  ? "border-l-2 border-l-primary bg-sidebar-accent/60"
                  : "border-l-2 border-l-transparent"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={`font-bold tracking-tight ${selectedId === user.id ? "text-primary" : "text-sidebar-foreground"}`}
                >
                  {user.firstName} {user.lastName}
                </span>
              </div>
              <span className="truncate text-[11px] text-muted-foreground italic">
                {user.email}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="relative flex flex-1 flex-col bg-sidebar">
        {selectedUser ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar-accent/5 px-8 py-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-tighter text-muted-foreground uppercase">
                  UID: {selectedUser.id}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none border-sidebar-border"
                >
                  <Key className="mr-2 size-3" /> Reset Password
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none border-sidebar-border hover:text-destructive"
                >
                  <Trash2 className="mr-2 size-3" /> Delete
                </Button>
              </div>
            </div>

            <div className="flex-1 p-12">
              <div className="w-full">
                <div className="mb-12 flex items-start gap-6">
                  <div className="flex size-20 items-center justify-center bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <UserCircle className="size-12" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black tracking-tighter text-sidebar-foreground uppercase">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h1>
                    <div className="mt-2 flex items-center gap-4">
                      <p className="font-mono text-sm tracking-widest text-primary">
                        {selectedUser.role}
                      </p>
                      <Separator
                        orientation="vertical"
                        className="h-4 bg-sidebar-border"
                      />
                      <p className="flex items-center gap-1.5 text-sm tracking-tight text-muted-foreground uppercase">
                        <Building2 className="size-3.5" />{" "}
                        {selectedUser.orgName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2">
                  <section className="space-y-6">
                    <h3 className="border-b border-sidebar-border pb-2 text-xs font-bold tracking-[0.2em] text-primary/80 uppercase">
                      Identity Details
                    </h3>
                    <DetailBlock
                      icon={Mail}
                      label="Email Address"
                      value={selectedUser.email}
                    />
                    <DetailBlock
                      icon={Building2}
                      label="Affiliated Organization"
                      value={selectedUser.orgName}
                    />
                  </section>

                  <section className="space-y-6">
                    <h3 className="border-b border-sidebar-border pb-2 text-xs font-bold tracking-[0.2em] text-primary/80 uppercase">
                      Security & Access
                    </h3>
                    <DetailBlock
                      icon={ShieldCheck}
                      label="Account Role"
                      value={selectedUser.role}
                    />
                    <DetailBlock
                      icon={Lock}
                      label="Authentication"
                      value="Password + MFA"
                    />
                  </section>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex size-20 items-center justify-center border border-sidebar-border bg-sidebar-accent/10">
                <Users className="size-8 text-muted-foreground/20" />
              </div>
              <p className="text-[10px] tracking-widest text-muted-foreground uppercase">
                Select user to manage
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
