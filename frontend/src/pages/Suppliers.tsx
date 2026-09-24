import { useEffect, useState } from "react";

import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "../services/supplierService";

import type {
  Supplier,
  SupplierFormData,
  SupplierRequest,
  SupplierStatusFilter,
} from "../types/supplier";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const emptyForm: SupplierFormData = {
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  tax_number: "",
  notes: "",
  is_active: true,
};

const PER_PAGE = 20;

/*
|--------------------------------------------------------------------------
| Icons
|--------------------------------------------------------------------------
*/

function SuppliersIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      />
      <circle cx="9" cy="7" r="4" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      />
    </svg>
  );
}

function PlusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m20 20-4-4" />
    </svg>
  );
}

function CloseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function EditIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
      />
    </svg>
  );
}

function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 6l-1 14H6L5 6"
      />
      <path strokeLinecap="round" d="M10 11v5M14 11v5" />
    </svg>
  );
}

function CheckCircleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8 12 2.5 2.5L16 9"
      />
    </svg>
  );
}

function AlertCircleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 8v4" />
      <path strokeLinecap="round" d="M12 16h.01" />
    </svg>
  );
}

function ChevronLeftIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
    </svg>
  );
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function Suppliers() {
  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState<number | null>(null);
  const [to, setTo] = useState<number | null>(null);

  /*
  |--------------------------------------------------------------------------
  | UI State
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Search / Filter
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupplierStatusFilter>("all");

  /*
  |--------------------------------------------------------------------------
  | Modal
  |--------------------------------------------------------------------------
  */

  const [showModal, setShowModal] = useState(false);

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState<SupplierFormData>({
    ...emptyForm,
  });

  /*
  |--------------------------------------------------------------------------
  | Delete Confirmation
  |--------------------------------------------------------------------------
  */

  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Load Suppliers
  |--------------------------------------------------------------------------
  */

  async function loadSuppliers(page: number = 1) {
    try {
      setLoading(true);
      setError("");

      const response = await getSuppliers({
        page,
        per_page: PER_PAGE,
        search,
        status: statusFilter,
      });

      setSuppliers(response.data);

      setCurrentPage(response.current_page);
      setLastPage(response.last_page);

      setTotal(response.total);

      setFrom(response.from);
      setTo(response.to);
    } catch (err) {
      console.error("Load suppliers error:", err);

      setError("Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadSuppliers(1);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | AJAX Search
  |--------------------------------------------------------------------------
  |
  | Wait 400ms after the user stops typing before requesting the API.
  |
  */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSuppliers(1);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search, statusFilter]);

  /*
  |--------------------------------------------------------------------------
  | Open Create Modal
  |--------------------------------------------------------------------------
  */

  function openCreateModal() {
    setEditingSupplier(null);

    setFormData({
      ...emptyForm,
    });

    setError("");

    setShowModal(true);
  }

  /*
  |--------------------------------------------------------------------------
  | Open Edit Modal
  |--------------------------------------------------------------------------
  */

  function openEditModal(supplier: Supplier) {
    setEditingSupplier(supplier);

    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
      tax_number: supplier.tax_number ?? "",
      notes: supplier.notes ?? "",
      is_active: supplier.is_active,
    });

    setError("");

    setShowModal(true);
  }

  /*
  |--------------------------------------------------------------------------
  | Close Modal
  |--------------------------------------------------------------------------
  */

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingSupplier(null);

    setFormData({
      ...emptyForm,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Form Change
  |--------------------------------------------------------------------------
  */

  function updateForm(field: keyof SupplierFormData, value: string | boolean) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /*
  |--------------------------------------------------------------------------
  | Save Supplier
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!formData.name.trim()) {
      setError("Supplier name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload: SupplierRequest = {
        name: formData.name.trim(),

        contact_person: formData.contact_person.trim() || null,

        phone: formData.phone.trim() || null,

        email: formData.email.trim() || null,

        address: formData.address.trim() || null,

        tax_number: formData.tax_number.trim() || null,

        notes: formData.notes.trim() || null,

        is_active: formData.is_active,
      };

      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, payload);

        setSuccessMessage("Supplier updated successfully.");
      } else {
        await createSupplier(payload);

        setSuccessMessage("Supplier created successfully.");
      }

      closeModal();

      /*
      |--------------------------------------------------------------------------
      | Reload current result
      |--------------------------------------------------------------------------
      */

      await loadSuppliers(editingSupplier ? currentPage : 1);

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: unknown) {
      console.error("Save supplier error:", err);

      const response = (
        err as {
          response?: {
            data?: {
              message?: string;
              errors?: Record<string, string[]>;
            };
          };
        }
      )?.response;

      const validationErrors = response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0]?.[0];

        setError(
          firstError || response?.data?.message || "Failed to save supplier.",
        );
      } else {
        setError(response?.data?.message || "Failed to save supplier.");
      }
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Supplier
  |--------------------------------------------------------------------------
  */

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteSupplier(deleteTarget.id);

      setDeleteTarget(null);

      setSuccessMessage("Supplier deleted successfully.");

      /*
      |--------------------------------------------------------------------------
      | Reload current page
      |--------------------------------------------------------------------------
      */

      let pageToLoad = currentPage;

      if (suppliers.length === 1 && currentPage > 1) {
        pageToLoad = currentPage - 1;
      }

      await loadSuppliers(pageToLoad);

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: unknown) {
      console.error("Delete supplier error:", err);

      const response = (
        err as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }
      )?.response;

      setError(response?.data?.message || "Failed to delete supplier.");
    } finally {
      setDeleting(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  function goToPage(page: number) {
    if (page < 1 || page > lastPage || page === currentPage || loading) {
      return;
    }

    loadSuppliers(page);
  }

  /*
  |--------------------------------------------------------------------------
  | Clear Search
  |--------------------------------------------------------------------------
  */

  function clearSearch() {
    setSearch("");
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <SuppliersIcon className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Suppliers
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your product suppliers.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add Supplier
        </button>
      </div>

      {/* ================================================================
          SUCCESS MESSAGE
      ================================================================ */}

      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          <CheckCircleIcon className="h-5 w-5 shrink-0" />

          <span>{successMessage}</span>
        </div>
      )}

      {/* ================================================================
          ERROR MESSAGE
      ================================================================ */}

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircleIcon className="h-5 w-5 shrink-0" />

            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 text-red-400 transition hover:bg-red-100 hover:text-red-600"
            aria-label="Dismiss error"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ================================================================
          CONTENT
      ================================================================ */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* ============================================================
            SEARCH + FILTER
        ============================================================ */}

        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_190px]">
            {/* SEARCH */}

            <div>
              <label
                htmlFor="supplier-search"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Search Suppliers
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <SearchIcon className="h-4 w-4" />
                </div>

                <input
                  id="supplier-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search supplier, contact, phone, email..."
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />

                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* FILTER */}

            <div>
              <label
                htmlFor="supplier-status"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Status
              </label>

              <select
                id="supplier-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as SupplierStatusFilter)
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="all">All</option>

                <option value="active">Active</option>

                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* SEARCH STATUS */}

          {(search || statusFilter !== "all") && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Searching server-side</span>

              {search && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                  "{search}"
                </span>
              )}

              {statusFilter !== "all" && (
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-medium capitalize text-indigo-700">
                  {statusFilter}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ============================================================
            TABLE HEADER
        ============================================================ */}

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <SuppliersIcon className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Supplier List
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Manage supplier records and contact information.
              </p>
            </div>
          </div>

          {total > 0 && (
            <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 sm:inline-flex">
              {total} suppliers
            </span>
          )}
        </div>

        {/* ============================================================
            TABLE
        ============================================================ */}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

                <span>Loading suppliers...</span>
              </div>
            </div>
          ) : (
            <table className="w-full min-w-[950px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Supplier
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Contact Person
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phone
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                          <SuppliersIcon className="h-6 w-6" />
                        </div>

                        <p className="text-sm font-semibold text-slate-800">
                          {search || statusFilter !== "all"
                            ? "No suppliers match your search or filter."
                            : "No suppliers found."}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {search || statusFilter !== "all"
                            ? "Try adjusting your search or filter."
                            : "Add your first supplier to get started."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="group transition hover:bg-slate-50/70"
                    >
                      {/* SUPPLIER */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold uppercase text-indigo-600">
                            {supplier.name.charAt(0)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {supplier.name}
                            </p>

                            {supplier.tax_number && (
                              <p className="mt-1 text-xs text-slate-500">
                                Tax No: {supplier.tax_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* CONTACT */}

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {supplier.contact_person || (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* PHONE */}

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {supplier.phone || (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* EMAIL */}

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {supplier.email || (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        {supplier.is_active ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}

                      {/* ACTIONS */}

                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(supplier)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <EditIcon className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(supplier)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-100 bg-white px-3 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ============================================================
            PAGINATION
        ============================================================ */}

        {!loading && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-slate-500">
              {total > 0 ? (
                <>
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {from}–{to}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">{total}</span>{" "}
                  suppliers
                </>
              ) : (
                "No suppliers"
              )}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <span className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
                Page {currentPage} of {lastPage}
              </span>

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === lastPage || loading}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================
          CREATE / EDIT MODAL
      ================================================================ */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  {editingSupplier ? (
                    <EditIcon className="h-5 w-5" />
                  ) : (
                    <PlusIcon className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingSupplier ? "Edit Supplier" : "Add Supplier"}
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {editingSupplier
                      ? "Update supplier information."
                      : "Create a new supplier."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Close modal"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-6 p-5 sm:p-6">
                  {/* SUPPLIER INFORMATION */}

                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-slate-900">
                        Supplier Information
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Basic information and primary contact details.
                      </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      {/* NAME */}

                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Supplier Name <span className="text-red-500">*</span>
                        </label>

                        <input
                          type="text"
                          value={formData.name}
                          onChange={(event) =>
                            updateForm("name", event.target.value)
                          }
                          disabled={saving}
                          required
                          className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                        />
                      </div>

                      {/* CONTACT PERSON */}

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Contact Person
                        </label>

                        <input
                          type="text"
                          value={formData.contact_person}
                          onChange={(event) =>
                            updateForm("contact_person", event.target.value)
                          }
                          disabled={saving}
                          className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                        />
                      </div>

                      {/* PHONE */}

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Phone
                        </label>

                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(event) =>
                            updateForm("phone", event.target.value)
                          }
                          disabled={saving}
                          className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                        />
                      </div>

                      {/* EMAIL */}

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Email
                        </label>

                        <input
                          type="email"
                          value={formData.email}
                          onChange={(event) =>
                            updateForm("email", event.target.value)
                          }
                          disabled={saving}
                          className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                        />
                      </div>

                      {/* TAX NUMBER */}

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Tax Number
                        </label>

                        <input
                          type="text"
                          value={formData.tax_number}
                          onChange={(event) =>
                            updateForm("tax_number", event.target.value)
                          }
                          disabled={saving}
                          className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ADDRESS + NOTES */}

                  <div className="border-t border-slate-200 pt-6">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-slate-900">
                        Additional Information
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Address, notes, and supplier status.
                      </p>
                    </div>

                    <div className="space-y-5">
                      {/* ADDRESS */}

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Address
                        </label>

                        <textarea
                          value={formData.address}
                          onChange={(event) =>
                            updateForm("address", event.target.value)
                          }
                          disabled={saving}
                          rows={3}
                          className="w-full resize-none rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                        />
                      </div>

                      {/* NOTES */}

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Notes
                        </label>

                        <textarea
                          value={formData.notes}
                          onChange={(event) =>
                            updateForm("notes", event.target.value)
                          }
                          disabled={saving}
                          rows={3}
                          className="w-full resize-none rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                        />
                      </div>

                      {/* ACTIVE */}

                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(event) =>
                            updateForm("is_active", event.target.checked)
                          }
                          disabled={saving}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />

                        <span>
                          <span className="block text-sm font-semibold text-slate-800">
                            Active Supplier
                          </span>

                          <span className="mt-0.5 block text-xs text-slate-500">
                            Allow this supplier to be used in purchases.
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || !formData.name.trim()}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingSupplier
                      ? "Update Supplier"
                      : "Create Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================
          DELETE CONFIRMATION
      ================================================================ */}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <TrashIcon className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Delete Supplier?
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-slate-700">
                      {deleteTarget.name}
                    </span>
                    ?
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-xs font-medium text-red-600">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="h-10 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
