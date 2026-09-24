import { useEffect, useState } from "react";

import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "../services/customerService";

import type {
  Customer,
  CustomerFormData,
  CustomerRequest,
} from "../types/customer";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const emptyForm: CustomerFormData = {
  name: "",
  business_type: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  is_active: true,
};

const PER_PAGE = 20;

/*
|--------------------------------------------------------------------------
| Icons
|--------------------------------------------------------------------------
*/

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 15H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

function XCircleIcon() {
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
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function Customers() {
  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  const [customers, setCustomers] = useState<Customer[]>([]);

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
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

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
  | Modal
  |--------------------------------------------------------------------------
  */

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<CustomerFormData>({
    ...emptyForm,
  });

  /*
  |--------------------------------------------------------------------------
  | Delete Confirmation
  |--------------------------------------------------------------------------
  */

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Load Customers
  |--------------------------------------------------------------------------
  */

  async function loadCustomers(page: number = 1) {
    try {
      setLoading(true);
      setError("");

      const allCustomers = await getCustomers();

      let filteredCustomers = allCustomers;

      /*
      |--------------------------------------------------------------------------
      | Search
      |--------------------------------------------------------------------------
      */

      const searchTerm = search.trim().toLowerCase();

      if (searchTerm) {
        filteredCustomers = filteredCustomers.filter((customer) => {
          return (
            customer.name.toLowerCase().includes(searchTerm) ||
            (customer.business_type ?? "").toLowerCase().includes(searchTerm) ||
            (customer.phone ?? "").toLowerCase().includes(searchTerm) ||
            (customer.email ?? "").toLowerCase().includes(searchTerm)
          );
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Status Filter
      |--------------------------------------------------------------------------
      */

      if (statusFilter !== "all") {
        filteredCustomers = filteredCustomers.filter((customer) =>
          statusFilter === "active" ? customer.is_active : !customer.is_active,
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Pagination
      |--------------------------------------------------------------------------
      */

      const totalItems = filteredCustomers.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / PER_PAGE));

      const safePage = Math.min(Math.max(page, 1), totalPages);

      const startIndex = (safePage - 1) * PER_PAGE;
      const endIndex = startIndex + PER_PAGE;

      const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

      setCustomers(paginatedCustomers);

      setCurrentPage(safePage);
      setLastPage(totalPages);
      setTotal(totalItems);

      setFrom(totalItems > 0 ? startIndex + 1 : null);
      setTo(Math.min(endIndex, totalItems));
    } catch (err) {
      console.error("Load customers error:", err);

      setError("Failed to load customers.");
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
    loadCustomers(1);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | AJAX-style Search / Filter
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadCustomers(1);
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
    setEditingCustomer(null);

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

  function openEditModal(customer: Customer) {
    setEditingCustomer(customer);

    setFormData({
      name: customer.name,
      business_type: customer.business_type ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      address: customer.address ?? "",
      notes: customer.notes ?? "",
      is_active: customer.is_active,
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
    setEditingCustomer(null);

    setFormData({
      ...emptyForm,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Form Change
  |--------------------------------------------------------------------------
  */

  function updateForm(field: keyof CustomerFormData, value: string | boolean) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /*
  |--------------------------------------------------------------------------
  | Save Customer
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!formData.name.trim()) {
      setError("Customer name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload: CustomerRequest = {
        name: formData.name.trim(),

        business_type: formData.business_type.trim() || null,

        phone: formData.phone.trim() || null,

        email: formData.email.trim() || null,

        address: formData.address.trim() || null,

        notes: formData.notes.trim() || null,

        is_active: formData.is_active,
      };

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, payload);

        setSuccessMessage("Customer updated successfully.");
      } else {
        await createCustomer(payload);

        setSuccessMessage("Customer created successfully.");
      }

      closeModal();

      await loadCustomers(editingCustomer ? currentPage : 1);

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: unknown) {
      console.error("Save customer error:", err);

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
          firstError || response?.data?.message || "Failed to save customer.",
        );
      } else {
        setError(response?.data?.message || "Failed to save customer.");
      }
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Customer
  |--------------------------------------------------------------------------
  */

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteCustomer(deleteTarget.id);

      setDeleteTarget(null);

      setSuccessMessage("Customer deleted successfully.");

      let pageToLoad = currentPage;

      if (customers.length === 1 && currentPage > 1) {
        pageToLoad = currentPage - 1;
      }

      await loadCustomers(pageToLoad);

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: unknown) {
      console.error("Delete customer error:", err);

      const response = (
        err as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }
      )?.response;

      setError(response?.data?.message || "Failed to delete customer.");
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

    loadCustomers(page);
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
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <UsersIcon />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Customers Management
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Manage customer information and account status.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <PlusIcon />
          Add Customer
        </button>
      </div>

      {/* ================================================================
          SUCCESS MESSAGE
      ================================================================ */}

      {successMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600">
            <CheckCircleIcon />
          </div>

          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* ================================================================
          ERROR MESSAGE
      ================================================================ */}

      {error && !showModal && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-red-600">
              <XCircleIcon />
            </div>

            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 text-red-400 transition hover:bg-red-100 hover:text-red-600"
            aria-label="Dismiss error"
          >
            <CloseIcon />
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

        <div className="border-b border-slate-200 px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            {/* SEARCH */}

            <div className="min-w-0 flex-1">
              <label
                htmlFor="customer-search"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Search Customers
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <SearchIcon />
                </div>

                <input
                  id="customer-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, business type, phone, or email..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />

                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            </div>

            {/* FILTER */}

            <div className="w-full lg:w-48">
              <label
                htmlFor="customer-status"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Status
              </label>

              <select
                id="customer-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "all" | "active" | "inactive",
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
              >
                <option value="all">All Customers</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {(search || statusFilter !== "all") && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Active filters:</span>

              {search && (
                <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700">
                  Search: "{search}"
                </span>
              )}

              {statusFilter !== "all" && (
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 font-medium capitalize text-slate-700">
                  Status: {statusFilter}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ============================================================
            TABLE HEADER
        ============================================================ */}

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Customer List
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              {total > 0
                ? `${total.toLocaleString()} customer${total === 1 ? "" : "s"}`
                : "No customers available"}
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <UsersIcon />
          </div>
        </div>

        {/* ============================================================
            TABLE
        ============================================================ */}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

                <span>Loading customers...</span>
              </div>
            </div>
          ) : (
            <table className="w-full min-w-[950px]">
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Customer
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Business Type
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Phone
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Email
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <UsersIcon />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-slate-700">
                          {search || statusFilter !== "all"
                            ? "No customers found"
                            : "No customers yet"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {search || statusFilter !== "all"
                            ? "Try adjusting your search or filter."
                            : "Add your first customer to get started."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="group transition hover:bg-slate-50/70"
                    >
                      {/* CUSTOMER */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">
                              {customer.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              Customer #{customer.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* BUSINESS TYPE */}

                      <td className="px-5 py-4">
                        {customer.business_type ? (
                          <span className="text-sm text-slate-600">
                            {customer.business_type}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>

                      {/* PHONE */}

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {customer.phone || (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* EMAIL */}

                      <td className="px-5 py-4">
                        {customer.email ? (
                          <span className="text-sm text-slate-600">
                            {customer.email}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        {customer.is_active ? (
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

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(customer)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <EditIcon />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(customer)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-100 bg-white px-3 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                          >
                            <TrashIcon />
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
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {total > 0
                ? `Showing ${from}–${to} of ${total} customers`
                : "No customers"}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeftIcon />
                Previous
              </button>

              <div className="flex h-9 items-center rounded-xl bg-slate-50 px-3 text-xs font-medium text-slate-600">
                Page {currentPage} of {lastPage}
              </div>

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === lastPage || loading}
                className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRightIcon />
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
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  {editingCustomer ? <EditIcon /> : <PlusIcon />}
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingCustomer ? "Edit Customer" : "Add Customer"}
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-400">
                    {editingCustomer
                      ? "Update customer information."
                      : "Create a new customer."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
                aria-label="Close modal"
              >
                <CloseIcon />
              </button>
            </div>

            {/* FORM ERROR */}

            {error && (
              <div className="mx-5 mt-5 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
                <div className="flex items-center gap-2">
                  <XCircleIcon />
                  <span>{error}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="text-red-400 hover:text-red-600"
                  aria-label="Dismiss error"
                >
                  <CloseIcon />
                </button>
              </div>
            )}

            {/* FORM */}

            <form onSubmit={handleSubmit}>
              <div className="space-y-6 p-5 sm:p-6">
                {/* CUSTOMER INFORMATION */}

                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Customer Information
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Enter the customer's basic information.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    {/* NAME */}

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Customer Name <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="text"
                        value={formData.name}
                        onChange={(event) =>
                          updateForm("name", event.target.value)
                        }
                        disabled={saving}
                        required
                        placeholder="Enter customer name"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>

                    {/* BUSINESS TYPE */}

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Business Type
                      </label>

                      <input
                        type="text"
                        value={formData.business_type}
                        onChange={(event) =>
                          updateForm("business_type", event.target.value)
                        }
                        disabled={saving}
                        placeholder="e.g. Retail, Pharmacy, Grocery"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>

                    {/* PHONE */}

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Phone
                      </label>

                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(event) =>
                          updateForm("phone", event.target.value)
                        }
                        disabled={saving}
                        placeholder="Enter phone number"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>

                    {/* EMAIL */}

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Email
                      </label>

                      <input
                        type="email"
                        value={formData.email}
                        onChange={(event) =>
                          updateForm("email", event.target.value)
                        }
                        disabled={saving}
                        placeholder="customer@example.com"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>

                    {/* ADDRESS */}

                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Address
                      </label>

                      <textarea
                        value={formData.address}
                        onChange={(event) =>
                          updateForm("address", event.target.value)
                        }
                        disabled={saving}
                        rows={2}
                        placeholder="Enter customer address"
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      />
                    </div>
                  </div>
                </div>

                {/* NOTES */}

                <div className="border-t border-slate-100 pt-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Additional Information
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Add optional notes about this customer.
                    </p>
                  </div>

                  <textarea
                    value={formData.notes}
                    onChange={(event) =>
                      updateForm("notes", event.target.value)
                    }
                    disabled={saving}
                    rows={3}
                    placeholder="Optional notes..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                {/* ACTIVE STATUS */}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(event) =>
                        updateForm("is_active", event.target.checked)
                      }
                      disabled={saving}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-slate-700">
                        Active Customer
                      </span>

                      <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                        Allow this customer to be used in POS transactions.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {/* FOOTER */}

              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || !formData.name.trim()}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingCustomer
                      ? "Update Customer"
                      : "Create Customer"}
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
            {/* HEADER */}

            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <TrashIcon />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Delete Customer?
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* CONTENT */}

            <div className="p-5">
              <p className="text-sm leading-6 text-slate-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-900">
                  {deleteTarget.name}
                </span>
                ?
              </p>

              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-xs leading-5 text-red-600">
                  Deleting this customer will remove the customer record from
                  the system.
                </p>
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <TrashIcon />
                {deleting ? "Deleting..." : "Delete Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
