export interface UserProfile {
  id: string
  email: string
  full_name?: string | null
  username?: string | null
  is_active?: boolean
  is_superuser?: boolean
}

export interface AdminUser extends UserProfile {
  created_at?: string
  updated_at?: string
  last_login?: string | null
}

export interface UpdateProfilePayload {
  full_name?: string | null
  email?: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
}

export interface UserListQuery {
  skip?: number
  limit?: number
  search?: string
}

export interface UserListResult {
  items: AdminUser[]
  total: number
}

export interface AdminUpdateUserPayload {
  full_name?: string | null
  email?: string
  is_active?: boolean
  is_superuser?: boolean
}
