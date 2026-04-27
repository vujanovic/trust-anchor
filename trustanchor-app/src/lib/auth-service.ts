import { createService } from "./base-service"
import type { LoginResponse } from "@/types/auth"

const svc = createService("/auth")

export const login = (email: string, password: string) =>
  svc.post<LoginResponse>("/login", { email, password })

export const logout = (refreshToken: string) =>
  svc.post<void>("/logout", { refreshToken })

export const refresh = (refreshToken: string) =>
  svc.post<LoginResponse>("/refresh", { refreshToken })
