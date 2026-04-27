import { api } from "./axios"
import type { AxiosRequestConfig } from "axios"

export function createService(resourcePath: string) {
  const url = (path = "") => `/api/v1${resourcePath}${path}`

  return {
    get<T>(path = "", config?: AxiosRequestConfig): Promise<T> {
      return api.get<T>(url(path), config).then((r) => r.data)
    },
    post<T>(
      path = "",
      body?: unknown,
      config?: AxiosRequestConfig
    ): Promise<T> {
      return api.post<T>(url(path), body, config).then((r) => r.data)
    },
    put<T>(path = "", body?: unknown, config?: AxiosRequestConfig): Promise<T> {
      return api.put<T>(url(path), body, config).then((r) => r.data)
    },
    patch<T>(
      path = "",
      body?: unknown,
      config?: AxiosRequestConfig
    ): Promise<T> {
      return api.patch<T>(url(path), body, config).then((r) => r.data)
    },
    delete<T = void>(path = "", config?: AxiosRequestConfig): Promise<T> {
      return api.delete<T>(url(path), config).then((r) => r.data)
    },
  }
}
