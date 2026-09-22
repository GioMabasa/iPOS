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
    <div className="min-h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Customers
          </h1>

          <p className="mt-1 text-sm text-gray-500">Manage your customers.</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Add Customer
        </button>
      </div>

      {/* ================================================================
          SUCCESS MESSAGE
      ================================================================ */}

      {successMessage && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* ================================================================
          ERROR MESSAGE
      ================================================================ */}

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="font-semibold"
          >
            ×
          </button>
        </div>
      )}

      {/* ================================================================
          CONTENT
      ================================================================ */}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* ============================================================
            SEARCH + FILTER
        ============================================================ */}

        <div className="border-b border-gray-200 p-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
            {/* SEARCH */}

            <div>
              <label
                htmlFor="customer-search"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Search Customers
              </label>

              <div className="relative">
                <input
                  id="customer-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search customer, business type, phone, email..."
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* FILTER */}

            <div>
              <label
                htmlFor="customer-status"
                className="mb-2 block text-sm font-medium text-gray-700"
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
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">All</option>

                <option value="active">Active</option>

                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {(search || statusFilter !== "all") && (
            <div className="mt-3 text-xs text-gray-500">
              Searching customers
              {search && (
                <>
                  {" "}
                  for{" "}
                  <span className="font-semibold text-gray-700">
                    "{search}"
                  </span>
                </>
              )}
              {statusFilter !== "all" && (
                <>
                  {" "}
                  • Status:{" "}
                  <span className="font-semibold capitalize text-gray-700">
                    {statusFilter}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ============================================================
            TABLE
        ============================================================ */}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
                Loading customers...
              </div>
            </div>
          ) : (
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Business Type
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Phone
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-sm text-gray-500"
                    >
                      {search || statusFilter !== "all"
                        ? "No customers match your search or filter."
                        : "No customers found."}
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* CUSTOMER */}

                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900">
                          {customer.name}
                        </p>
                      </td>

                      {/* BUSINESS TYPE */}

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {customer.business_type || "—"}
                      </td>

                      {/* PHONE */}

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {customer.phone || "—"}
                      </td>

                      {/* EMAIL */}

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {customer.email || "—"}
                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-4">
                        {customer.is_active ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}

                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(customer)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(customer)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
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
          <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              {total > 0
                ? `Showing ${from}–${to} of ${total} customers`
                : "No customers"}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="px-2 text-sm text-gray-600">
                Page {currentPage} of {lastPage}
              </span>

              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === lastPage || loading}
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ================================================================
          CREATE / EDIT MODAL
      ================================================================ */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingCustomer ? "Edit Customer" : "Add Customer"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {editingCustomer
                    ? "Update customer information."
                    : "Create a new customer."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="text-xl text-gray-400 hover:text-gray-600 disabled:opacity-40"
              >
                ×
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit}>
              <div className="grid gap-5 p-5">
                {/* NAME */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Customer Name <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    disabled={saving}
                    required
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* BUSINESS TYPE */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
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
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Phone
                  </label>

                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(event) =>
                      updateForm("phone", event.target.value)
                    }
                    disabled={saving}
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      updateForm("email", event.target.value)
                    }
                    disabled={saving}
                    className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* ADDRESS */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Address
                  </label>

                  <textarea
                    value={formData.address}
                    onChange={(event) =>
                      updateForm("address", event.target.value)
                    }
                    disabled={saving}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* NOTES */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Notes
                  </label>

                  <textarea
                    value={formData.notes}
                    onChange={(event) =>
                      updateForm("notes", event.target.value)
                    }
                    disabled={saving}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* ACTIVE */}

                <div>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(event) =>
                        updateForm("is_active", event.target.checked)
                      }
                      disabled={saving}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />

                    <span>
                      <span className="block text-sm font-medium text-gray-700">
                        Active Customer
                      </span>

                      <span className="block text-xs text-gray-500">
                        Allow this customer to be used in POS transactions.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 border-t border-gray-200 p-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || !formData.name.trim()}
                  className="h-10 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              Delete Customer?
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-700">
                {deleteTarget.name}
              </span>
              ?
            </p>

            <p className="mt-2 text-xs text-red-500">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
