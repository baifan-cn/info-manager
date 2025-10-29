import { request } from '.'
import type {
  CreateItemPayload,
  Item,
  ItemListQuery,
  ItemListResult,
  UpdateItemPayload,
} from '../types/item'

type RawItemListResponse =
  | Item[]
  | {
      items?: Item[]
      data?: Item[]
      results?: Item[]
      entries?: Item[]
      total?: number
      count?: number
    }

function normalizeItemListResponse(raw: RawItemListResponse): ItemListResult {
  if (Array.isArray(raw)) {
    return {
      items: raw,
      total: raw.length,
    }
  }

  const items = raw.items || raw.data || raw.results || raw.entries || []
  const total = raw.total ?? raw.count ?? items.length

  return {
    items,
    total,
  }
}

export async function getItems(params: ItemListQuery = {}): Promise<ItemListResult> {
  const response = (await request.get('/v1/items/', { params })) as RawItemListResponse
  return normalizeItemListResponse(response)
}

export function getItemById(itemId: string): Promise<Item> {
  return request.get(`/v1/items/${itemId}`) as unknown as Promise<Item>
}

export function createItem(payload: CreateItemPayload): Promise<Item> {
  return request.post('/v1/items/', payload) as unknown as Promise<Item>
}

export function updateItem(itemId: string, payload: UpdateItemPayload): Promise<Item> {
  return request.put(`/v1/items/${itemId}`, payload) as unknown as Promise<Item>
}

export function deleteItem(itemId: string): Promise<void> {
  return request.delete(`/v1/items/${itemId}`) as unknown as Promise<void>
}

export async function deleteItems(itemIds: string[]): Promise<void> {
  for (const id of itemIds) {
    await deleteItem(id)
  }
}
