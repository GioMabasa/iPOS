export interface User {
  id: number;
  name: string;
  role: string;
}

export interface UsersResponse {
  data: User[];
}

