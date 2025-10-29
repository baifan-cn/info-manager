import { request } from '.'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface SignupRequest {
  email: string
  username: string
  password: string
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
}

export function login(data: LoginRequest) {
  const form = new URLSearchParams()
  form.append('username', data.username)
  form.append('password', data.password)
  form.append('grant_type', 'password')

  return request.post<LoginResponse, LoginResponse, URLSearchParams>(
    '/v1/login/access-token',
    form,
  )
}

export function signup(data: SignupRequest) {
  return request.post<void, void, SignupRequest>('/v1/users/signup', data)
}

export function requestPasswordRecovery(email: string) {
  const safeEmail = encodeURIComponent(email)
  return request.post<void, void>(`/v1/password-recovery/${safeEmail}`)
}

export function resetPassword(data: ResetPasswordRequest) {
  return request.post<void, void, ResetPasswordRequest>('/v1/reset-password/', data)
}

export function verifyToken() {
  return request.post<void, void>('/v1/login/test-token')
}
