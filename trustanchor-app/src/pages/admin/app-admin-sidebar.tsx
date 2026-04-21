import {
  Anchor,
  FileKey,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  History,
  Building2,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../../components/ui/sidebar.tsx"
import { Link, useLocation } from "react-router-dom"

export function AppAdminSidebar() {
  const location = useLocation()

  const menuItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Organizations", url: "/admin/organizations", icon: Building2 },
    { title: "CA Users", url: "/admin/users", icon: Users },
    { title: "Issue Certificate", url: "/admin/issue", icon: FileKey },
    { title: "All Certificates", url: "/admin/certificates", icon: ShieldCheck,},
    { title: "Revocation List", url: "/admin/revocation", icon: History },
    { title: "System Settings", url: "/admin/settings", icon: Settings },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-cyan-500/20">
            <Anchor className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-lg leading-none font-bold tracking-tight">
              Trust<span className="text-primary">Anchor</span>
            </span>
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              PKI Admin Console
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.url}
                  tooltip={item.title}>
                  <Link to={item.url}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 text-xs text-muted-foreground">
        Admin v1.0.0
      </SidebarFooter>
    </Sidebar>
  )
}
