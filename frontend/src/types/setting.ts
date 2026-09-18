export interface Setting {
  id: number;

  business_name: string | null;
  business_address: string | null;
  contact_number: string | null;
  email: string | null;
  tin: string | null;

  default_customer: string;
  currency: string;

  date_format: string;
  timezone: string;

  created_at: string;
  updated_at: string;
}

export interface SettingResponse {
  data: Setting;
}

export interface UpdateSettingData {
  business_name: string | null;
  business_address: string | null;
  contact_number: string | null;
  email: string | null;
  tin: string | null;

  default_customer: string;
  currency: string;

  date_format: string;
  timezone: string;
}

