import { defineStore } from 'pinia'
import {
  deleteUserById,
  getUserById,
  getUsers,
  updateUserById,
} from '../api'
import type { AdminUpdateUserPayload, AdminUser } from '../types/user'

interface PaginationState {
  page: number
  pageSize: number
  search: string
}

interface AdminUsersState {
  users: AdminUser[]
  total: number
  loading: boolean
  detail: AdminUser | null
  detailLoading: boolean
  pagination: PaginationState
  updatingMap: Record<string, boolean>
  deletingMap: Record<string, boolean>
}

export const useAdminUsersStore = defineStore('adminUsers', {
  state: (): AdminUsersState => ({
    users: [],
    total: 0,
    loading: false,
    detail: null,
    detailLoading: false,
    pagination: {
      page: 1,
      pageSize: 10,
      search: '',
    },
    updatingMap: {},
    deletingMap: {},
  }),
  getters: {
    page(state) {
      return state.pagination.page
    },
    pageSize(state) {
      return state.pagination.pageSize
    },
    search(state) {
      return state.pagination.search
    },
    updatingIds(state) {
      return state.updatingMap
    },
    deletingIds(state) {
      return state.deletingMap
    },
  },
  actions: {
    setPagination(partial: Partial<PaginationState>) {
      this.pagination = {
        ...this.pagination,
        ...partial,
      }
    },
    async fetchUsers(partial?: Partial<PaginationState>) {
      if (partial) {
        this.setPagination(partial)
      }

      const { page, pageSize, search } = this.pagination
      const skip = (page - 1) * pageSize

      this.loading = true
      try {
        const { items, total } = await getUsers({ skip, limit: pageSize, search })
        this.users = items
        this.total = total
      } finally {
        this.loading = false
      }
    },
    async fetchUserDetail(userId: string) {
      this.detailLoading = true
      try {
        const user = await getUserById(userId)
        this.detail = user
        return user
      } finally {
        this.detailLoading = false
      }
    },
    async updateUser(userId: string, payload: AdminUpdateUserPayload) {
      this.updatingMap[userId] = true
      try {
        const user = await updateUserById(userId, payload)
        this.users = this.users.map((item) => (item.id === user.id ? user : item))
        if (this.detail && this.detail.id === user.id) {
          this.detail = user
        }
        return user
      } finally {
        this.updatingMap[userId] = false
      }
    },
    async deleteUser(userId: string) {
      this.deletingMap[userId] = true
      try {
        await deleteUserById(userId)
        this.users = this.users.filter((item) => item.id !== userId)
        this.total = Math.max(0, this.total - 1)
        if (this.detail && this.detail.id === userId) {
          this.detail = null
        }
      } finally {
        this.deletingMap[userId] = false
      }
    },
    clearDetail() {
      this.detail = null
    },
    reset() {
      this.users = []
      this.total = 0
      this.loading = false
      this.detail = null
      this.detailLoading = false
      this.pagination = {
        page: 1,
        pageSize: 10,
        search: '',
      }
      this.updatingMap = {}
      this.deletingMap = {}
    },
  },
})
