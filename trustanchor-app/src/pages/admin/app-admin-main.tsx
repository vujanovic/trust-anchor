import { SidebarProvider } from "@/components/ui/sidebar.tsx"
import { AppAdminSidebar } from "@/pages/admin/app-admin-sidebar.tsx"
import { Outlet } from "react-router-dom"
import { TooltipProvider } from "@/components/ui/tooltip.tsx"

export default function AppAdminMain() {
  return (
    <SidebarProvider>
      <TooltipProvider>
        <AppAdminSidebar />
        <main>
          <Outlet />
        </main>
      </TooltipProvider>
    </SidebarProvider>
  )
}
