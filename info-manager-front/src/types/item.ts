export interface Item {
  id: string
  title: string
  description?: string | null
  context?: string | null
  owner_id?: string
  created_at?: string
  updated_at?: string
}

export interface ItemListQuery {
  skip?: number
  limit?: number
  search?: string
  sort_field?: string
  sort_order?: 'asc' | 'desc'
}

export interface ItemListResult {
  items: Item[]
  total: number
}

export interface CreateItemPayload {
  title: string
  description?: string | null
  context?: string | null
}

export interface UpdateItemPayload {
  title?: string
  description?: string | null
  context?: string | null
}
