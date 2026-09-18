export interface BirSetting {
  id: number;

  tin: string;
  branch_code: string;
  registered_name: string;
  business_name: string | null;
  business_address: string;

  vat_registered: boolean;

  invoice_prefix: string;
  invoice_current: number;

  permit_number: string | null;
  permit_date: string | null;

  accreditation_number: string | null;
  accreditation_date: string | null;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export interface BirSettingResponse {
  data: BirSetting | null;
}

export interface CreateBirSettingData {
  tin: string;
  branch_code: string;
  registered_name: string;
  business_name: string | null;
  business_address: string;

  vat_registered: boolean;

  invoice_prefix: string;

  permit_number: string | null;
  permit_date: string | null;

  accreditation_number: string | null;
  accreditation_date: string | null;
}

export interface UpdateBirSettingData {
  tin: string;
  branch_code: string;
  registered_name: string;
  business_name: string | null;
  business_address: string;

  vat_registered: boolean;

  invoice_prefix: string;

  permit_number: string | null;
  permit_date: string | null;

  accreditation_number: string | null;
  accreditation_date: string | null;
}

