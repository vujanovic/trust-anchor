import { Navigate, Route, Routes } from "react-router-dom"
import AppHomePage from "@/pages/unauthenticated/app-home-page.tsx"
import { AppAdminMain } from "@/pages/admin/app-admin-main.tsx"

export function App() {
  return (
    <Routes>
      <Route path="/" element={<AppHomePage />} />
      <Route path="/admin" element={<AppAdminMain />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
