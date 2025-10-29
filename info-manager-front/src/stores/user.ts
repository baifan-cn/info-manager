import { defineStore } from 'pinia'
import {
  changePassword as changePasswordApi,
  deleteCurrentUser,
  getCurrentUser,
  updateCurrentUser,
} from '../api'
import type {
  ChangePasswordPayload,
  UpdateProfilePayload,
  UserProfile,
} from '../types/user'

interface UserState {
  profile: UserProfile | null
  loading: boolean
  saving: boolean
  passwordLoading: boolean
  deleteLoading: boolean
  initialized: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    profile: null,
    loading: false,
    saving: false,
    passwordLoading: false,
    deleteLoading: false,
    initialized: false,
  }),
  getters: {
    displayName: (state) =>
      state.profile?.full_name || state.profile?.username || state.profile?.email || '未命名用户',
  },
  actions: {
    async fetchProfile(force = false) {
      if (this.loading || (!force && this.initialized && this.profile)) return this.profile

      this.loading = true
      try {
        const profile = await getCurrentUser()
        this.profile = profile
        this.initialized = true
        return profile
      } finally {
        this.loading = false
      }
    },
    async updateProfile(payload: UpdateProfilePayload) {
      this.saving = true
      try {
        const profile = await updateCurrentUser(payload)
        this.profile = profile
        return profile
      } finally {
        this.saving = false
      }
    },
    async changePassword(payload: ChangePasswordPayload) {
      this.passwordLoading = true
      try {
        await changePasswordApi(payload)
      } finally {
        this.passwordLoading = false
      }
    },
    async deleteAccount() {
      this.deleteLoading = true
      try {
        await deleteCurrentUser()
        this.profile = null
        this.initialized = false
      } finally {
        this.deleteLoading = false
      }
    },
    clear() {
      this.profile = null
      this.initialized = false
    },
  },
})
