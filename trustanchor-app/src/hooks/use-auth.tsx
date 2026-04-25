/* eslint-disable react-refresh/only-export-components */
import type { UserDto } from "@/types/auth"
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import * as authService from "@/lib/auth-service"
import { tokenStore } from "@/lib/token-store"

interface AuthContextType {
  user: UserDto | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<UserDto>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null)

  useEffect(() => {
    const refreshToken = localStorage.getItem("refreshToken")
    if (!refreshToken) return

    authService
      .refresh(refreshToken)
      .then((data) => {
        tokenStore.set(data.accessToken)
        localStorage.setItem("refreshToken", data.refreshToken)
        setUser(data.user)
      })
      .catch(() => {
        tokenStore.clear()
        localStorage.removeItem("refreshToken")
        setUser(null)
      })
  }, [])

  const login = async (email: string, password: string): Promise<UserDto> => {
    const data = await authService.login(email, password)
    tokenStore.set(data.accessToken)
    localStorage.setItem("refreshToken", data.refreshToken)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken")
    if (refreshToken) {
      await authService.logout(refreshToken).catch(() => {})
    }
    tokenStore.clear()
    localStorage.removeItem("refreshToken")
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
