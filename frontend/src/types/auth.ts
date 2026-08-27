export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface MeResponse {
  data: User;
}

export interface LogoutResponse {
  message: string;
}