import { useSearchParams } from "react-router-dom"
import {
  Building2,
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
import { api } from "@/lib/axios.ts"
import type { CaUserFormValues } from "@/lib/validations.ts"

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  organizationId: number
  status: string
  role: string
}

interface Organization {
  id: number
  name: string
  code: string
  email: string
  registrationDate: string
  domain: string
  location: string
}
export default function AppAdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const selectedId = searchParams.get("id")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, orgRes] = await Promise.all([
          api.get<User[]>("/api/v1/user/role?userRole=CA_USER"),
          api.get<Organization[]>("/api/v1/org"),
        ])

        setUsers(userRes.data)
        setOrganizations(orgRes.data)

        if (!selectedId && userRes.data.length > 0) {
          setSearchParams(
            { id: userRes.data[0].id.toString() },
            { replace: true }
          )
        }
      } catch (error) {
        console.error("Failed to fetch security data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [selectedId, setSearchParams])

  const handleUserSubmit = async (data: CaUserFormValues) => {
    try {
      const response = await api.post<User>("/api/v1/user/ca", data)
      const newUser = response.data
      setUsers((prev) => [...prev, newUser])
      setSearchParams({ id: newUser.id.toString() })
    } catch (error) {
      console.error("Error provisioning identity:", error)
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Revoke access for this identity?")) return
    try {
      await api.delete(`/api/v1/user/ca/${id}`)
      const filtered = users.filter((u) => u.id !== id)
      setUsers(filtered)
      if (filtered.length > 0) {
        setSearchParams({ id: filtered[0].id.toString() })
      } else {
        setSearchParams({})
      }
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase()
    return (
      u.firstName.toLowerCase().includes(term) ||
      u.lastName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    )
  })

  const selectedUser = users.find((u) => u.id.toString() === selectedId)
  const affiliatedOrg = organizations.find(
    (o) => o.id === selectedUser?.organizationId
  )

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
              placeholder="Search identities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-none border-sidebar-border bg-sidebar/50 pl-8 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="animate-pulse p-4 text-center text-xs text-muted-foreground">
              Syncing Ledger...
            </div>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setSearchParams({ id: user.id.toString() })}
                className={`group flex w-full flex-col border-b border-sidebar-border/50 p-5 text-left transition-all hover:bg-sidebar-accent/30 ${
                  selectedId === user.id.toString()
                    ? "border-l-2 border-l-primary bg-sidebar-accent/60"
                    : "border-l-2 border-l-transparent"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`font-bold tracking-tight ${selectedId === user.id.toString() ? "text-primary" : "text-sidebar-foreground"}`}
                  >
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <span className="truncate text-[11px] text-muted-foreground italic">
                  {user.email}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="relative flex flex-1 flex-col bg-sidebar">
        {selectedUser ? (
          <div className="flex h-full flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar-accent/5 px-8 py-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-tighter text-muted-foreground uppercase">
                  UID: {selectedUser.id}
                </span>
              </div>
              <div className="flex gap-2">
                {/*<Button*/}
                {/*  variant="outline"*/}
                {/*  size="sm"*/}
                {/*  className="rounded-none border-sidebar-border"*/}
                {/*>*/}
                {/*  <Key className="mr-2 size-3" /> Reset Password*/}
                {/*</Button>*/}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="rounded-none border-sidebar-border hover:bg-destructive/10 hover:text-destructive"
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
                        {affiliatedOrg?.name || "System"}
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
                      value={affiliatedOrg?.name || "N/A"}
                    />
                  </section>

                  <section className="space-y-6">
                    <h3 className="border-b border-sidebar-border pb-2 text-xs font-bold tracking-[0.2em] text-primary/80 uppercase">
                      Security & Access
                    </h3>
                    <DetailBlock
                      icon={ShieldCheck}
                      label="Account Status"
                      value={selectedUser.status}
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
              <Users className="mx-auto size-12 text-muted-foreground/20" />
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
      {/* Icon Container */}
      <div className="mt-1 text-primary">
        <Icon size={16} />
      </div>

      {/* Text Container */}
      <div className="space-y-1">
        <p className="text-[9px] leading-none font-bold tracking-widest text-muted-foreground/50 uppercase">
          {label}
        </p>
        <p className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          {value || "N/A"}
        </p>
      </div>
    </div>
  )
}