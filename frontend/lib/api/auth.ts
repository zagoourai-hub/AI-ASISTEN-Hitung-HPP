import { apiClient } from "@/lib/api/client"
import type { AuthSessionResponse } from "@/lib/types/api"

export interface RegisterPayload {
  email: string
  password: string
  business_name: string
  business_type: string
  timezone?: string
  default_target_margin?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface PasswordResetRequestPayload {
  email: string
}

export interface PasswordResetConfirmPayload {
  token: string
  new_password: string
}

export function register(payload: RegisterPayload) {
  return apiClient<AuthSessionResponse>("/auth/register", {
    method: "POST",
    body: payload,
  })
}

export function login(payload: LoginPayload) {
  return apiClient<AuthSessionResponse>("/auth/login", {
    method: "POST",
    body: payload,
  })
}

export function getCurrentSession(signal?: AbortSignal) {
  return apiClient<AuthSessionResponse>("/auth/me", { method: "GET", signal })
}

export function logout() {
  return apiClient<void>("/auth/logout", { method: "POST" })
}

export function requestPasswordReset(payload: PasswordResetRequestPayload) {
  return apiClient<{ message: string }>("/auth/password-reset/request", {
    method: "POST",
    body: payload,
  })
}

export function confirmPasswordReset(payload: PasswordResetConfirmPayload) {
  return apiClient<{ message: string }>("/auth/password-reset/confirm", {
    method: "POST",
    body: payload,
  })
}
