import { useEffect, useState } from "react";

import { getSettings, updateSettings } from "../services/settingService";
import {
  createBirSettings,
  getBirSettings,
  updateBirSettings,
} from "../services/birSettingService";

import type { Setting, UpdateSettingData } from "../types/setting";
import type { BirSetting, CreateBirSettingData } from "../types/birSetting";

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
        currency: response.data.currency ?? "PHP",
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
    value: string | boolean,
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
        currency: response.data.currency ?? "PHP",
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
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-gray-500">Loading settings...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your business, POS, BIR, and system settings.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={loadSettings}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage your business, POS, BIR, and system settings.
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Business Information */}
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Business Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Basic information about your business.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Business Name
            </label>

            <input
              type="text"
              value={formData.business_name ?? ""}
              onChange={(e) => handleChange("business_name", e.target.value)}
              placeholder="Enter business name"
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Contact Number
            </label>

            <input
              type="text"
              value={formData.contact_number ?? ""}
              onChange={(e) => handleChange("contact_number", e.target.value)}
              placeholder="Enter contact number"
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>

            <input
              type="email"
              value={formData.email ?? ""}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Enter business email"
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Business Address
            </label>

            <textarea
              rows={3}
              value={formData.business_address ?? ""}
              onChange={(e) => handleChange("business_address", e.target.value)}
              placeholder="Enter business address"
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      {/* POS Settings */}
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">POS Settings</h2>

          <p className="mt-1 text-sm text-gray-500">
            Configure basic point-of-sale preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Default Customer
            </label>

            <select
              value={formData.default_customer}
              onChange={(e) => handleChange("default_customer", e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="walk-in">Walk-in Customer</option>
            </select>

            <p className="mt-1 text-xs text-gray-500">
              Customer automatically used when no specific customer is selected.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Currency
            </label>

            <select
              value={formData.currency}
              onChange={(e) => handleChange("currency", e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="PHP">PHP (₱)</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      {/* BIR Settings */}
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">BIR Settings</h2>

          <p className="mt-1 text-sm text-gray-500">
            Configure BIR-related business and receipt information.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              TIN
            </label>

            <input
              type="text"
              value={birFormData.tin}
              onChange={(e) => handleBirChange("tin", e.target.value)}
              placeholder="Enter TIN"
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Branch Code
            </label>

            <input
              type="text"
              value={birFormData.branch_code}
              onChange={(e) => handleBirChange("branch_code", e.target.value)}
              placeholder="Enter branch code"
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Registered Name
            </label>

            <input
              type="text"
              value={birFormData.registered_name}
              onChange={(e) =>
                handleBirChange("registered_name", e.target.value)
              }
              placeholder="Enter registered name"
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Business Name
            </label>

            <input
              type="text"
              value={birFormData.business_name ?? ""}
              onChange={(e) => handleBirChange("business_name", e.target.value)}
              placeholder="Enter business name"
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Business Address
            </label>

            <textarea
              rows={3}
              value={birFormData.business_address}
              onChange={(e) =>
                handleBirChange("business_address", e.target.value)
              }
              placeholder="Enter business address"
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              VAT Registered
            </label>

            <select
              value={birFormData.vat_registered ? "yes" : "no"}
              onChange={(e) =>
                handleBirChange("vat_registered", e.target.value === "yes")
              }
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Invoice Prefix
            </label>

            <input
              type="text"
              value={birFormData.invoice_prefix}
              onChange={(e) =>
                handleBirChange("invoice_prefix", e.target.value)
              }
              placeholder="e.g. INV-"
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Permit Number
            </label>

            <input
              type="text"
              value={birFormData.permit_number ?? ""}
              onChange={(e) => handleBirChange("permit_number", e.target.value)}
              placeholder="Enter permit number"
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Permit Date
            </label>

            <input
              type="date"
              value={birFormData.permit_date ?? ""}
              onChange={(e) => handleBirChange("permit_date", e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Accreditation Number
            </label>

            <input
              type="text"
              value={birFormData.accreditation_number ?? ""}
              onChange={(e) =>
                handleBirChange("accreditation_number", e.target.value)
              }
              placeholder="Enter accreditation number"
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Accreditation Date
            </label>

            <input
              type="date"
              value={birFormData.accreditation_date ?? ""}
              onChange={(e) =>
                handleBirChange("accreditation_date", e.target.value)
              }
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleSaveBirSettings}
            disabled={savingBir}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingBir ? "Saving..." : "Save BIR Settings"}
          </button>
        </div>
      </section>

      {/* System Settings */}
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            System Settings
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Configure general system preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date Format
            </label>

            <select
              value={formData.date_format}
              onChange={(e) => handleChange("date_format", e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="Y-m-d">YYYY-MM-DD</option>

              <option value="m/d/Y">MM/DD/YYYY</option>

              <option value="d/m/Y">DD/MM/YYYY</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Timezone
            </label>

            <select
              value={formData.timezone}
              onChange={(e) => handleChange("timezone", e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="Asia/Manila">Asia/Manila (Philippine Time)</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>
    </div>
  );
}
