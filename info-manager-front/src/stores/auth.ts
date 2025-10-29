import { defineStore } from 'pinia'
import {
  login as loginApi,
  type LoginRequest,
  verifyToken,
} from '../api'
import { useUserStore } from './user'
import { useAdminUsersStore } from './adminUsers'

interface AuthState {
  token: string | null
  tokenType: string | null
  loading: boolean
  refreshTimer: ReturnType<typeof setTimeout> | null
}

type BufferLike = {
  from(input: string, encoding: string): {
    toString(encoding: string): string
  }
}

type GlobalWithBuffer = typeof globalThis & {
  Buffer?: BufferLike
  atob?: (input: string) => string
}

function decodeJwtExpiration(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const globalRef = globalThis as GlobalWithBuffer
    const decodeFn =
      (typeof window !== 'undefined' && typeof window.atob === 'function'
        ? window.atob.bind(window)
        : globalRef.atob) || null
    const decoded = decodeFn
      ? decodeFn(normalized)
      : globalRef.Buffer
          ? globalRef.Buffer.from(normalized, 'base64').toString('binary')
          : ''
    if (!decoded) return null
    const parsed = JSON.parse(decoded) as { exp?: number }
    return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null
  } catch (error) {
    console.warn('Failed to decode token expiration', error)
    return null
  }
}

function persistToken(token: string | null, tokenType: string | null) {
  if (typeof window === 'undefined') return

  if (token) {
    window.localStorage.setItem('access_token', token)
  } else {
    window.localStorage.removeItem('access_token')
  }

  if (tokenType) {
    window.localStorage.setItem('token_type', tokenType)
  } else {
    window.localStorage.removeItem('token_type')
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    tokenType: null,
    loading: false,
    refreshTimer: null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },
  actions: {
    initialize() {
      if (typeof window === 'undefined') return
      const storedToken = window.localStorage.getItem('access_token')
      const storedType = window.localStorage.getItem('token_type')
      if (storedToken) {
        this.token = storedToken
        this.tokenType = storedType
        this.scheduleRefresh(storedToken)
      }
    },
    setToken(token: string | null, tokenType: string | null = 'bearer') {
      this.token = token
      this.tokenType = token ? tokenType : null
      persistToken(token, token ? tokenType ?? 'bearer' : null)

      if (token) {
        this.scheduleRefresh(token)
      } else {
        this.clearRefreshTimer()
      }
    },
    clearRefreshTimer() {
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer)
        this.refreshTimer = null
      }
    },
    scheduleRefresh(token: string) {
      this.clearRefreshTimer()
      const expirationTime = decodeJwtExpiration(token)
      if (!expirationTime) return

      const now = Date.now()
      const leadTime = 60 * 1000
      const delay = Math.max(expirationTime - now - leadTime, leadTime)

      this.refreshTimer = setTimeout(() => {
        this.refreshToken().catch(() => {
          this.logout()
        })
      }, delay)
    },
    async login(credentials: LoginRequest) {
      this.loading = true
      try {
        const response = await loginApi(credentials)
        this.setToken(response.access_token, response.token_type)
      } catch (error) {
        this.setToken(null, null)
        throw error
      } finally {
        this.loading = false
      }
    },
    logout() {
      const userStore = useUserStore()
      const adminUsersStore = useAdminUsersStore()
      userStore.clear()
      adminUsersStore.reset()
      this.setToken(null, null)
    },
    async refreshToken() {
      if (!this.token) return

      await verifyToken()
      this.scheduleRefresh(this.token)
    },
  },
})
