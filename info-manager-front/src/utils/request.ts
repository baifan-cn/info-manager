import axios from 'axios'
import type {
  AxiosError,
  AxiosRequestHeaders,
  InternalAxiosRequestConfig,
} from 'axios'
import { API_BASE_URL } from '../config/env'

interface ErrorWithMessage {
  message?: string
}

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

// Flag to prevent multiple simultaneous logout attempts
let isLoggingOut = false

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('access_token')
    if (token) {
      const headers = (config.headers || {}) as AxiosRequestHeaders
      headers.Authorization = `Bearer ${token}`
      config.headers = headers
    }
  }

  return config
})

request.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<ErrorWithMessage>) => {
    const status = error.response?.status
    const url = error.config?.url || ''

    // Auto logout on 401/403, except for login/logout endpoints
    const skipLogoutUrls = [
      '/v1/login/access-token',
      '/v1/login/test-token',
      '/v1/logout',
    ]
    const shouldAutoLogout =
      (status === 401 || status === 403) &&
      !skipLogoutUrls.some((skipUrl) => url.includes(skipUrl))

    if (shouldAutoLogout && !isLoggingOut) {
      isLoggingOut = true
      try {
        // Dynamic import to avoid circular dependency
        const { useAuthStore } = await import('../stores/auth')
        const { pinia } = await import('../stores')
        const authStore = useAuthStore(pinia)
        
        // Local logout only, don't call server (we're already getting 401)
        authStore.localLogout()

        // Navigate to login page
        if (typeof window !== 'undefined') {
          const router = await import('../router')
          router.default.replace({ name: 'login' })
        }
      } finally {
        // Reset flag after a delay to allow the logout to complete
        setTimeout(() => {
          isLoggingOut = false
        }, 1000)
      }
    }

    return Promise.reject(error.response?.data || { message: error.message })
  },
)

export default request
