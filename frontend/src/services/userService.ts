import api from "./api";

export interface User {
  id: number;
  name: string;
  role: string;
}

export async function getUsers(): Promise<User[]> {
  const response = await api.get("/users");

  return response.data.data ?? [];
}