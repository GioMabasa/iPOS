
import api from "./api";

import type {
  BirSettingResponse,
  CreateBirSettingData,
  UpdateBirSettingData,
} from "../types/birSetting";

export async function getBirSettings(): Promise<BirSettingResponse> {
  const response =
    await api.get<BirSettingResponse>(
      "/bir-settings",
    );

  return response.data;
}

export async function createBirSettings(
  data: CreateBirSettingData,
): Promise<BirSettingResponse> {
  const response =
    await api.post<BirSettingResponse>(
      "/bir-settings",
      data,
    );

  return response.data;
}

export async function updateBirSettings(
  id: number,
  data: UpdateBirSettingData,
): Promise<BirSettingResponse> {
  const response =
    await api.put<BirSettingResponse>(
      `/bir-settings/${id}`,
      data,
    );

  return response.data;
}

