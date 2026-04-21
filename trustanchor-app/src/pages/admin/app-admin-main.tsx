import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar.tsx"
import { AppAdminSidebar } from "@/pages/admin/app-admin-sidebar.tsx"


export function AppAdminMain() {
  return (
    <SidebarProvider>
      <AppAdminSidebar />
      <main>
        <SidebarTrigger />
      </main>
    </SidebarProvider>
  )
}