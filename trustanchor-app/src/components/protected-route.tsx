import { useAuth } from "@/hooks/use-auth"
import type { UserDto } from "@/types/auth"
import { Navigate, Outlet } from "react-router-dom"

interface Props {
  allowedRoles?: UserDto["role"][]
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user!.role)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
