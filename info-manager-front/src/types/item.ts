export const ITEM_TAG_VALUES = ['DEFAULT', 'ECONOMIST', 'WSJ'] as const

export type ItemTag = (typeof ITEM_TAG_VALUES)[number]

export const ITEM_TAG_LABEL_MAP: Record<ItemTag, string> = {
  DEFAULT: '默认',
  ECONOMIST: '经济学人',
  WSJ: '华尔街日报',
}

export interface Item {
  id: string
  title: string
  description?: string | null
  context?: string | null
  tag: ItemTag
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
  tag: ItemTag
}

export interface UpdateItemPayload {
  title?: string
  description?: string | null
  context?: string | null
  tag?: ItemTag
}
