import { createService } from "./base-service"
import type { LoginResponse } from "@/types/auth"

const service = createService("/auth")

export const login = (email: string, password: string) =>
  service.post<LoginResponse>("/login", { email, password })

export const logout = (refreshToken: string) =>
  service.post<void>("/logout", { refreshToken })

export const refresh = (refreshToken: string) =>
  service.post<LoginResponse>("/refresh", { refreshToken })

export const verifyMfa = (mfaToken: string, totpCode: string) =>
  service.post<LoginResponse>("/verify-2fa", { mfaToken, totpCode })
