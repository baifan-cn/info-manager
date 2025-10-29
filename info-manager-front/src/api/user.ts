import { request } from '.'
import type {
  AdminUpdateUserPayload,
  AdminUser,
  ChangePasswordPayload,
  UpdateProfilePayload,
  UserListQuery,
  UserListResult,
  UserProfile,
} from '../types/user'

type RawUserListResponse =
  | AdminUser[]
  | {
      items?: AdminUser[]
      data?: AdminUser[]
      results?: AdminUser[]
      users?: AdminUser[]
      total?: number
      count?: number
    }

function normalizeUserListResponse(raw: RawUserListResponse): UserListResult {
  if (Array.isArray(raw)) {
    return {
      items: raw,
      total: raw.length,
    }
  }

  const items = raw.items || raw.data || raw.results || raw.users || []
  const total = raw.total ?? raw.count ?? items.length

  return {
    items,
    total,
  }
}

export function getCurrentUser(): Promise<UserProfile> {
  return request.get<UserProfile>('/v1/users/me') as unknown as Promise<UserProfile>
}

export function updateCurrentUser(data: UpdateProfilePayload): Promise<UserProfile> {
  return request.patch<UserProfile>('/v1/users/me', data) as unknown as Promise<UserProfile>
}

export function changePassword(data: ChangePasswordPayload): Promise<void> {
  return request.patch('/v1/users/me/password', data) as unknown as Promise<void>
}

export function deleteCurrentUser(): Promise<void> {
  return request.delete('/v1/users/me') as unknown as Promise<void>
}

export async function getUsers(params: UserListQuery = {}): Promise<UserListResult> {
  const response = (await request.get('/v1/users/', { params })) as RawUserListResponse
  return normalizeUserListResponse(response)
}

export function getUserById(userId: string): Promise<AdminUser> {
  return request.get(`/v1/users/${userId}`) as unknown as Promise<AdminUser>
}

export function updateUserById(
  userId: string,
  data: AdminUpdateUserPayload,
): Promise<AdminUser> {
  return request.patch(`/v1/users/${userId}`, data) as unknown as Promise<AdminUser>
}

export function deleteUserById(userId: string): Promise<void> {
  return request.delete(`/v1/users/${userId}`) as unknown as Promise<void>
}
