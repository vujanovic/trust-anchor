import axios from "axios"
import { tokenStore } from "./token-store"

export const api = axios.create({
  baseURL: "http://localhost:8080",
})

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers["Authorization"] = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem("refreshToken")

      if (!refreshToken) {
        isRefreshing = false
        processQueue(error, null)
        window.location.href = "/login"
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(
          "http://localhost:8080/api/v1/auth/refresh",
          { refreshToken }
        )
        tokenStore.set(data.accessToken)
        localStorage.setItem("refreshToken", data.refreshToken)
        originalRequest.headers["Authorization"] = `Bearer ${data.accessToken}`
        processQueue(null, data.accessToken)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        tokenStore.clear()
        localStorage.removeItem("refreshToken")
        window.location.href = "/login"
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
