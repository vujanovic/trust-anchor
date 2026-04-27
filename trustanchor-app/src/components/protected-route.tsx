import { useAuth } from "@/hooks/use-auth"
import type { UserDto } from "@/types/auth"
import { Navigate, Outlet } from "react-router-dom"

interface Props {
  allowedRoles?: UserDto["role"][]
}

function homeRoute(role: UserDto["role"]): string {
  if (role === "ADMIN") return "/admin"
  if (role === "CA_USER") return "/ca"
  return "/user"
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const { user, isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user!.role)) {
    return <Navigate to={homeRoute(user!.role)} replace />
  }

  return <Outlet />
}
