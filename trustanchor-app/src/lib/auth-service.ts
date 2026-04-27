import type { LoginResponse } from "@/types/auth"
import { api } from "./axios"

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>("/api/v1/auth/login", { email, password })
  return data
}

export const logout = async (refreshToken: string): Promise<void> => {
  await api.post("/api/v1/auth/logout", { refreshToken })
}

export const refresh = async (refreshToken: string): Promise<LoginResponse> => {
  const { data } = await api.post("/api/v1/auth/refresh", { refreshToken })
  return data
}
