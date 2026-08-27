import api from './api';

import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  LogoutResponse,
} from '../types/auth';

export async function login(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    '/login',
    credentials,
  );

  return response.data;
}

export async function getCurrentUser(): Promise<MeResponse> {
  const response = await api.get<MeResponse>('/me');

  return response.data;
}

export async function logout(): Promise<LogoutResponse> {
  const response = await api.post<LogoutResponse>('/logout');

  return response.data;
}