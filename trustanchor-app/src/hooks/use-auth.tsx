/* eslint-disable react-refresh/only-export-components */
import type { LoginResponse, UserDto } from "@/types/auth"
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
  isInitializing: boolean
  login: (email: string, password: string) => Promise<LoginResponse>
  verify2fa: (mfaToken: string, totpCode: string) => Promise<UserDto>
  logout: () => Promise<void>
  updateUserMfaStatus: (enabled: boolean) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null)
  const [isInitializing, setIsInitializing] = useState(
    () => !!localStorage.getItem("refreshToken")
  )

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
      })
      .finally(() => {
        setIsInitializing(false)
      })
  }, [])

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    const data = await authService.login(email, password)
    
    if (!data.mfaRequired && data.accessToken && data.refreshToken && data.user) {
      tokenStore.set(data.accessToken)
      localStorage.setItem("refreshToken", data.refreshToken)
      setUser(data.user)
    }
    
    return data
  }

  const verify2fa = async (mfaToken: string, totpCode: string): Promise<UserDto> => {
    const data = await authService.verifyMfa(mfaToken, totpCode)
    
    if (data.accessToken && data.refreshToken && data.user) {
      tokenStore.set(data.accessToken)
      localStorage.setItem("refreshToken", data.refreshToken)
      setUser(data.user)
      return data.user
    }
    
    throw new Error("MFA Verification failed to return session parameters.")
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

  const updateUserMfaStatus = (enabled: boolean) => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      return {
        ...currentUser,
        mfaEnabled: enabled
      };
    });
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isInitializing,
    login,
    verify2fa,
    logout,
    updateUserMfaStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
