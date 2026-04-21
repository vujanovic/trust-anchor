import {
  Activity,
  AlertTriangle,
  Building2,
  Clock,
  FileKey,
  History,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Link } from "react-router-dom"

export default function AppAdminDashboard() {
  const stats = [
    {
      label: "Active Certificates",
      value: "1,284",
      icon: ShieldCheck,
      color: "text-cyan-500",
    },
    {
      label: "Pending Requests",
      value: "14",
      icon: Clock,
      color: "text-amber-500",
    },
    {
      label: "Revoked Today",
      value: "3",
      icon: AlertTriangle,
      color: "text-destructive",
    },
    {
      label: "System Health",
      value: "99.9%",
      icon: Activity,
      color: "text-emerald-500",
    },
  ]

  const serviceGroups = [
    {
      title: "Identity & Access",
      items: [
        {
          title: "Organizations",
          desc: "Manage root entities and institutional codes.",
          url: "/admin/organizations",
          icon: Building2,
        },
        {
          title: "CA Users",
          desc: "Delegate issuance rights to organization admins.",
          url: "/admin/users",
          icon: Users,
        },
      ],
    },
    {
      title: "Certificate Authority",
      items: [
        {
          title: "Issue Certificate",
          desc: "Generate Root, Intermediate, or EE certificates.",
          url: "/admin/issue",
          icon: FileKey,
        },
        {
          title: "All Certificates",
          desc: "Full registry with X.509 chain inspection.",
          url: "/admin/certificates",
          icon: ShieldCheck,
        },
        {
          title: "Revocation List",
          desc: "Manage CRL and OCSP responder status.",
          url: "/admin/revocation",
          icon: History,
        },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          title: "System Settings",
          desc: "Master Key rotation and audit log policies.",
          url: "/admin/settings",
          icon: Settings,
        },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-8 px-8 py-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          TrustAnchor Console
        </h1>
        <p className="text-muted-foreground">
          Global PKI Infrastructure Overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border-sidebar-border bg-sidebar/40"
          >
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
              <stat.icon className={`size-8 ${stat.color} opacity-80`} />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-8">
        {serviceGroups.map((group) => (
          <section key={group.title}>
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-lg font-semibold">{group.title}</h2>
              <div className="h-px flex-1 bg-sidebar-border" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <Link to={item.url} key={item.title} className="group">
                  <Card className="h-full border-sidebar-border bg-sidebar/20 transition-all hover:border-primary/50 hover:bg-sidebar/40">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <div className="rounded-md bg-sidebar-accent p-2 transition-colors group-hover:bg-primary/10">
                        <item.icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
                      </div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs leading-relaxed">
                        {item.desc}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
