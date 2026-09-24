import { useEffect, useState } from "react";

import { getSettings, updateSettings } from "../services/settingService";
import {
  createBirSettings,
  getBirSettings,
  updateBirSettings,
} from "../services/birSettingService";

import type { Setting, UpdateSettingData } from "../types/setting";
import type { BirSetting, CreateBirSettingData } from "../types/birSetting";

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.5 1.5-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.12v-.4a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.5-1.5.06-.06A1.7 1.7 0 0 0 9.14 15a1.7 1.7 0 0 0-1.56-1.03H7.2v-2.12h.38a1.7 1.7 0 0 0 1.56-1.03 1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.5-1.5.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V5.8h2.12v.42a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.5 1.5-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.4v2.12h-.4A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M16 9h3a1 1 0 0 1 1 1v11" />
      <path d="M8 7h2M12 7h1M8 11h2M12 11h1M8 15h2M12 15h1" />
      <path d="M2 21h20M9 21v-3h4v3" />
    </svg>
  );
}

function ShoppingCartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L21 8H6" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M5 3h11l3 3v15H5V3Z" />
      <path d="M8 3v6h8V3M8 21v-7h8v7" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 3 2.8 19a1.5 1.5 0 0 0 1.3 2.2h15.8a1.5 1.5 0 0 0 1.3-2.2L12 3Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState<Setting | null>(null);
  const [birSetting, setBirSetting] = useState<BirSetting | null>(null);

  const [formData, setFormData] = useState<UpdateSettingData>({
    business_name: "",
    business_address: "",
    contact_number: "",
    email: "",
    tin: "",
    default_customer: "walk-in",
    currency: "PHP",
    date_format: "Y-m-d",
    timezone: "Asia/Manila",
  });

  const [birFormData, setBirFormData] = useState<CreateBirSettingData>({
    tin: "",
    branch_code: "",
    registered_name: "",
    business_name: "",
    business_address: "",
    vat_registered: false,
    tax_type: "non_vat",
    vat_rate: 12,
    invoice_prefix: "",
    permit_number: "",
    permit_date: "",
    accreditation_number: "",
    accreditation_date: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBir, setSavingBir] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings();
    loadBirSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const response = await getSettings();

      setSettings(response.data);

      setFormData({
        business_name: response.data.business_name ?? "",
        business_address: response.data.business_address ?? "",
        contact_number: response.data.contact_number ?? "",
        email: response.data.email ?? "",
        tin: response.data.tin ?? "",
        default_customer: response.data.default_customer ?? "walk-in",
        currency: "PHP",
        date_format: response.data.date_format ?? "Y-m-d",
        timezone: response.data.timezone ?? "Asia/Manila",
      });
    } catch (err) {
      console.error("Failed to load settings:", err);

      setError("Failed to load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function loadBirSettings() {
    try {
      const response = await getBirSettings();

      setBirSetting(response.data);

      if (response.data) {
        setBirFormData({
          tin: response.data.tin ?? "",
          branch_code: response.data.branch_code ?? "",
          registered_name: response.data.registered_name ?? "",
          business_name: response.data.business_name ?? "",
          business_address: response.data.business_address ?? "",
          vat_registered: response.data.vat_registered ?? false,
          tax_type: response.data.tax_type ?? "non_vat",
          vat_rate: response.data.vat_rate ?? 12,
          invoice_prefix: response.data.invoice_prefix ?? "",
          permit_number: response.data.permit_number ?? "",
          permit_date: response.data.permit_date ?? "",
          accreditation_number: response.data.accreditation_number ?? "",
          accreditation_date: response.data.accreditation_date ?? "",
        });
      }
    } catch (err) {
      console.error("Failed to load BIR settings:", err);

      setError("Failed to load BIR settings. Please try again.");
    }
  }

  function handleChange(field: keyof UpdateSettingData, value: string) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setMessage("");
    setError("");
  }

  function handleBirChange(
    field: keyof CreateBirSettingData,
    value: string | boolean | number,
  ) {
    setBirFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setMessage("");
    setError("");
  }

  async function handleSave() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await updateSettings(formData);

      setSettings(response.data);

      setFormData({
        business_name: response.data.business_name ?? "",
        business_address: response.data.business_address ?? "",
        contact_number: response.data.contact_number ?? "",
        email: response.data.email ?? "",
        tin: response.data.tin ?? "",
        default_customer: response.data.default_customer ?? "walk-in",
        currency: "PHP",
        date_format: response.data.date_format ?? "Y-m-d",
        timezone: response.data.timezone ?? "Asia/Manila",
      });

      setMessage("Settings updated successfully.");
    } catch (err) {
      console.error("Failed to update settings:", err);

      setError("Failed to update settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBirSettings() {
    try {
      setSavingBir(true);
      setMessage("");
      setError("");

      let response;

      if (birSetting) {
        response = await updateBirSettings(birSetting.id, birFormData);
      } else {
        response = await createBirSettings(birFormData);
      }

      setBirSetting(response.data);

      if (response.data) {
        setBirFormData({
          tin: response.data.tin ?? "",
          branch_code: response.data.branch_code ?? "",
          registered_name: response.data.registered_name ?? "",
          business_name: response.data.business_name ?? "",
          business_address: response.data.business_address ?? "",
          vat_registered: response.data.vat_registered ?? false,
          tax_type: response.data.tax_type ?? "non_vat",
          vat_rate: response.data.vat_rate ?? 12,
          invoice_prefix: response.data.invoice_prefix ?? "",
          permit_number: response.data.permit_number ?? "",
          permit_date: response.data.permit_date ?? "",
          accreditation_number: response.data.accreditation_number ?? "",
          accreditation_date: response.data.accreditation_date ?? "",
        });
      }

      setMessage(
        birSetting
          ? "BIR settings updated successfully."
          : "BIR settings saved successfully.",
      );
    } catch (err) {
      console.error("Failed to save BIR settings:", err);

      setError("Failed to save BIR settings. Please try again.");
    } finally {
      setSavingBir(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
          <p className="text-sm font-medium text-slate-500">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <SettingsIcon />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Settings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your business, POS, BIR, and system settings.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={loadSettings}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <SettingsIcon />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Settings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your business, POS, BIR, and system settings.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {message && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm font-medium text-emerald-700">
            <CheckCircleIcon />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-700">
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Business Information */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <BuildingIcon />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Business Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Basic information about your business.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Business Name
              </label>

              <input
                type="text"
                value={formData.business_name ?? ""}
                onChange={(e) => handleChange("business_name", e.target.value)}
                placeholder="Enter business name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contact Number
              </label>

              <input
                type="text"
                value={formData.contact_number ?? ""}
                onChange={(e) => handleChange("contact_number", e.target.value)}
                placeholder="Enter contact number"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </label>

              <input
                type="email"
                value={formData.email ?? ""}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter business email"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div className="md:col-span-3">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Business Address
              </label>

              <textarea
                rows={3}
                value={formData.business_address ?? ""}
                onChange={(e) =>
                  handleChange("business_address", e.target.value)
                }
                placeholder="Enter business address"
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SaveIcon />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </section>

      {/* POS Settings */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <ShoppingCartIcon />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">POS Settings</h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure basic point-of-sale preferences.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Default Customer
              </label>

              <input
                type="text"
                value={formData.default_customer}
                onChange={(e) =>
                  handleChange("default_customer", e.target.value)
                }
                placeholder="e.g. Walk-in Customer"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />

              <p className="mt-2 text-xs text-slate-400">
                Customer automatically used when no specific customer is
                selected.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Currency
              </label>

              <input
                type="text"
                value="PHP (₱)"
                readOnly
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600 outline-none"
              />

              <p className="mt-2 text-xs text-slate-400">
                iPOS uses Philippine Peso (PHP) as its only currency.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SaveIcon />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </section>

      {/* BIR Settings */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <ReceiptIcon />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">BIR Settings</h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure BIR-related business and receipt information.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                TIN
              </label>

              <input
                type="text"
                value={birFormData.tin}
                onChange={(e) => handleBirChange("tin", e.target.value)}
                placeholder="Enter TIN"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Branch Code
              </label>

              <input
                type="text"
                value={birFormData.branch_code}
                onChange={(e) => handleBirChange("branch_code", e.target.value)}
                placeholder="Enter branch code"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Registered Name
              </label>

              <input
                type="text"
                value={birFormData.registered_name}
                onChange={(e) =>
                  handleBirChange("registered_name", e.target.value)
                }
                placeholder="Enter registered name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Business Name
              </label>

              <input
                type="text"
                value={birFormData.business_name ?? ""}
                onChange={(e) =>
                  handleBirChange("business_name", e.target.value)
                }
                placeholder="Enter business name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Business Address
              </label>

              <textarea
                rows={3}
                value={birFormData.business_address}
                onChange={(e) =>
                  handleBirChange("business_address", e.target.value)
                }
                placeholder="Enter business address"
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                VAT Registered
              </label>

              <select
                value={birFormData.vat_registered ? "yes" : "no"}
                onChange={(e) =>
                  handleBirChange("vat_registered", e.target.value === "yes")
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tax Type
              </label>

              <select
                value={birFormData.tax_type}
                onChange={(e) => handleBirChange("tax_type", e.target.value)}
                disabled={!birFormData.vat_registered}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="vat_inclusive">VAT Inclusive</option>
                <option value="vat_exclusive">VAT Exclusive</option>
                <option value="non_vat">Non-VAT</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                VAT Rate (%)
              </label>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={birFormData.vat_rate}
                  onChange={(e) =>
                    handleBirChange("vat_rate", Number(e.target.value))
                  }
                  disabled={!birFormData.vat_registered}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Invoice Prefix
              </label>

              <input
                type="text"
                value={birFormData.invoice_prefix}
                onChange={(e) =>
                  handleBirChange("invoice_prefix", e.target.value)
                }
                placeholder="e.g. INV-"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Permit Number
              </label>

              <input
                type="text"
                value={birFormData.permit_number ?? ""}
                onChange={(e) =>
                  handleBirChange("permit_number", e.target.value)
                }
                placeholder="Enter permit number"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Permit Date
              </label>

              <input
                type="date"
                value={birFormData.permit_date ?? ""}
                onChange={(e) => handleBirChange("permit_date", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Accreditation Number
              </label>

              <input
                type="text"
                value={birFormData.accreditation_number ?? ""}
                onChange={(e) =>
                  handleBirChange("accreditation_number", e.target.value)
                }
                placeholder="Enter accreditation number"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Accreditation Date
              </label>

              <input
                type="date"
                value={birFormData.accreditation_date ?? ""}
                onChange={(e) =>
                  handleBirChange("accreditation_date", e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={handleSaveBirSettings}
              disabled={savingBir}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SaveIcon />
              {savingBir ? "Saving..." : "Save BIR Settings"}
            </button>
          </div>
        </div>
      </section>

      {/* System Settings */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <MonitorIcon />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              System Settings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure general system preferences.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date Format
              </label>

              <select
                value={formData.date_format}
                onChange={(e) => handleChange("date_format", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              >
                <option value="Y-m-d">YYYY-MM-DD</option>
                <option value="m/d/Y">MM/DD/YYYY</option>
                <option value="d/m/Y">DD/MM/YYYY</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Timezone
              </label>

              <select
                value={formData.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              >
                <option value="Asia/Manila">
                  Asia/Manila (Philippine Time)
                </option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SaveIcon />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
