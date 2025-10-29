import { defineStore } from 'pinia'
import {
  createItem,
  deleteItem,
  deleteItems,
  getItemById,
  getItems,
  updateItem,
} from '../api'
import type { CreateItemPayload, Item, UpdateItemPayload } from '../types/item'

type SortOrder = 'asc' | 'desc' | null

interface PaginationState {
  page: number
  pageSize: number
}

interface FilterState {
  search: string
}

interface SortState {
  field: string | null
  order: SortOrder
}

interface FetchOptions {
  page?: number
  pageSize?: number
  search?: string
  sortField?: string | null
  sortOrder?: SortOrder
}

interface ItemListState {
  items: Item[]
  total: number
  loading: boolean
  pagination: PaginationState
  filters: FilterState
  sort: SortState
  deletingMap: Record<string, boolean>
  bulkDeleting: boolean
  creating: boolean
  updatingMap: Record<string, boolean>
  detail: Item | null
  detailLoading: boolean
}

export const useItemStore = defineStore('item', {
  state: (): ItemListState => ({
    items: [],
    total: 0,
    loading: false,
    pagination: {
      page: 1,
      pageSize: 10,
    },
    filters: {
      search: '',
    },
    sort: {
      field: null,
      order: null,
    },
    deletingMap: {},
    bulkDeleting: false,
    creating: false,
    updatingMap: {},
    detail: null,
    detailLoading: false,
  }),
  getters: {
    page(state) {
      return state.pagination.page
    },
    pageSize(state) {
      return state.pagination.pageSize
    },
    searchValue(state) {
      return state.filters.search
    },
    sortField(state) {
      return state.sort.field
    },
    sortOrder(state) {
      return state.sort.order
    },
    isCreating(state) {
      return state.creating
    },
    updatingIds(state) {
      return state.updatingMap
    },
    currentDetail(state) {
      return state.detail
    },
    isDetailLoading(state) {
      return state.detailLoading
    },
  },
  actions: {
    setOptions(partial: FetchOptions) {
      if (partial.page !== undefined) {
        this.pagination.page = partial.page
      }
      if (partial.pageSize !== undefined) {
        this.pagination.pageSize = partial.pageSize
      }
      if (partial.search !== undefined) {
        this.filters.search = partial.search
      }
      if (partial.sortField !== undefined) {
        this.sort.field = partial.sortField
      }
      if (partial.sortOrder !== undefined) {
        this.sort.order = partial.sortOrder
      }
    },
    async fetchItems(partial?: FetchOptions) {
      if (partial) {
        this.setOptions(partial)
      }

      const { page, pageSize } = this.pagination
      const { search } = this.filters
      const { field, order } = this.sort

      const skip = (page - 1) * pageSize

      this.loading = true
      try {
        const { items, total } = await getItems({
          skip,
          limit: pageSize,
          search: search.trim() ? search.trim() : undefined,
          sort_field: field ?? undefined,
          sort_order: order ?? undefined,
        })
        this.items = items
        this.total = total
      } finally {
        this.loading = false
      }
    },
    async fetchItemDetail(itemId: string) {
      this.detailLoading = true
      try {
        const item = await getItemById(itemId)
        this.detail = item
        return item
      } finally {
        this.detailLoading = false
      }
    },
    clearDetail() {
      this.detail = null
    },
    async createItem(payload: CreateItemPayload) {
      this.creating = true
      try {
        const item = await createItem(payload)
        await this.fetchItems({ page: 1 })
        return item
      } finally {
        this.creating = false
      }
    },
    async updateItemById(itemId: string, payload: UpdateItemPayload) {
      this.updatingMap[itemId] = true
      try {
        const item = await updateItem(itemId, payload)
        this.items = this.items.map((existing) => (existing.id === item.id ? item : existing))
        if (this.detail && this.detail.id === item.id) {
          this.detail = item
        }
        return item
      } finally {
        delete this.updatingMap[itemId]
      }
    },
    async deleteItemById(itemId: string) {
      this.deletingMap[itemId] = true
      try {
        await deleteItem(itemId)
        if (this.detail?.id === itemId) {
          this.detail = null
        }
        const shouldLoadPrevPage =
          this.items.length <= 1 && this.pagination.page > 1
        if (shouldLoadPrevPage) {
          await this.fetchItems({ page: this.pagination.page - 1 })
        } else {
          await this.fetchItems()
        }
      } finally {
        delete this.deletingMap[itemId]
      }
    },
    async bulkDeleteByIds(itemIds: string[]) {
      if (!itemIds.length) return
      this.bulkDeleting = true
      try {
        await deleteItems(itemIds)
        const anticipatedTotal = Math.max(0, this.total - itemIds.length)
        const maxPage = Math.max(1, Math.ceil(anticipatedTotal / this.pagination.pageSize))
        const targetPage = Math.min(this.pagination.page, maxPage)
        await this.fetchItems({ page: targetPage })
      } finally {
        this.bulkDeleting = false
      }
    },
    reset() {
      this.items = []
      this.total = 0
      this.loading = false
      this.pagination = { page: 1, pageSize: 10 }
      this.filters = { search: '' }
      this.sort = { field: null, order: null }
      this.deletingMap = {}
      this.bulkDeleting = false
      this.creating = false
      this.updatingMap = {}
      this.detail = null
      this.detailLoading = false
    },
  },
})
