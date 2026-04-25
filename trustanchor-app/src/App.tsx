import { Navigate, Route, Routes } from "react-router-dom"
import { ProtectedRoute } from "@/components/protected-route"
import AppHomePage from "@/pages/unauthenticated/app-home-page.tsx"
import AppAdminMain from "@/pages/admin/app-admin-main.tsx"
import AppAdminUsers from "@/pages/admin/app-admin-users.tsx"
import AppAdminIssue from "@/pages/admin/app-admin-issue.tsx"
import AppAdminCertificates from "./pages/admin/app-admin-certificates"
import AppAdminRevocation from "@/pages/admin/app-admin-revocation.tsx"
import AppAdminSettings from "@/pages/admin/app-admin-settings.tsx"
import AppAdminDashboard from "@/pages/admin/app-admin-dashboard.tsx"
import AppAdminOrganizations from "@/pages/admin/app-admin-organizations.tsx"
import AppUserMain from "@/pages/user/app-user-main"
import AppRegistration from "@/pages/unauthenticated/app-registration.tsx"
import AppLogin from "@/pages/unauthenticated/app-login.tsx"

export function App() {
  return (
    <Routes>
      <Route path="/" element={<AppHomePage />} />
      <Route path="register" element={<AppRegistration />} />
      <Route path="login" element={<AppLogin />} />

      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route path="admin" element={<AppAdminMain />}>
          <Route index element={<AppAdminDashboard />} />
          <Route path="users" element={<AppAdminUsers />} />
          <Route path="issue" element={<AppAdminIssue />} />
          <Route path="certificates" element={<AppAdminCertificates />} />
          <Route path="revocation" element={<AppAdminRevocation />} />
          <Route path="settings" element={<AppAdminSettings />} />
          <Route path="organizations" element={<AppAdminOrganizations />} />
        </Route>
      </Route>

      <Route
        element={<ProtectedRoute allowedRoles={["USER", "CA_USER", "ADMIN"]} />}
      >
        <Route path="user" element={<AppUserMain />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
