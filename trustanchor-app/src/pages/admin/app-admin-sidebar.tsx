import {
  Anchor,
  Building2,
  FileKey,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
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
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"

export function AppAdminSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  const menuItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Organizations", url: "/admin/organizations", icon: Building2 },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "Issue Certificate", url: "/admin/issue", icon: FileKey },
    {
      title: "All Certificates",
      url: "/admin/certificates",
      icon: ShieldCheck,
    },
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
                  tooltip={item.title}
                >
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
      <SidebarFooter className="border-t border-sidebar-border/50 p-3">
        <div className="mb-2 px-2 py-1">
          <p className="text-sm leading-none font-semibold text-foreground">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
            >
              <LogOut className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
