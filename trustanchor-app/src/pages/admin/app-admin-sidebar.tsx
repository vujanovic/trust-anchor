import { Sidebar } from "lucide-react"
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "../../components/ui/sidebar.tsx"

export function AppAdminSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <h1>TrustAnchor</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
