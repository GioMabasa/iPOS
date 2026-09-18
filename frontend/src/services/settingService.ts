import api from "./api";

import type {
  SettingResponse,
  UpdateSettingData,
} from "../types/setting";

export async function getSettings(): Promise<SettingResponse> {
  const response =
    await api.get<SettingResponse>("/settings");

  return response.data;
}

export async function updateSettings(
  data: UpdateSettingData,
): Promise<SettingResponse> {
  const response =
    await api.put<SettingResponse>(
      "/settings",
      data,
    );

  return response.data;
}

