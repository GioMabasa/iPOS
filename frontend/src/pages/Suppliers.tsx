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
    <div className="min-h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Suppliers
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your product suppliers.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Add Supplier
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
                htmlFor="supplier-search"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Search Suppliers
              </label>

              <div className="relative">
                <input
                  id="supplier-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search supplier, contact, phone, email..."
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
                htmlFor="supplier-status"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Status
              </label>

              <select
                id="supplier-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as SupplierStatusFilter)
                }
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">All</option>

                <option value="active">Active</option>

                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* SEARCH STATUS */}

          {(search || statusFilter !== "all") && (
            <div className="mt-3 text-xs text-gray-500">
              Searching server-side
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
                Loading suppliers...
              </div>
            </div>
          ) : (
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Supplier
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Contact Person
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
                {suppliers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-sm text-gray-500"
                    >
                      {search || statusFilter !== "all"
                        ? "No suppliers match your search or filter."
                        : "No suppliers found."}
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* SUPPLIER */}

                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {supplier.name}
                          </p>

                          {supplier.tax_number && (
                            <p className="mt-1 text-xs text-gray-500">
                              Tax No: {supplier.tax_number}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* CONTACT */}

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {supplier.contact_person || "—"}
                      </td>

                      {/* PHONE */}

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {supplier.phone || "—"}
                      </td>

                      {/* EMAIL */}

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {supplier.email || "—"}
                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-4">
                        {supplier.is_active ? (
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
                            onClick={() => openEditModal(supplier)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(supplier)}
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
                ? `Showing ${from}–${to} of ${total} suppliers`
                : "No suppliers"}
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
                  {editingSupplier ? "Edit Supplier" : "Add Supplier"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {editingSupplier
                    ? "Update supplier information."
                    : "Create a new supplier."}
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
                    Supplier Name <span className="text-red-500">*</span>
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

                {/* CONTACT PERSON */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Contact Person
                  </label>

                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(event) =>
                      updateForm("contact_person", event.target.value)
                    }
                    disabled={saving}
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

                {/* TAX NUMBER */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tax Number
                  </label>

                  <input
                    type="text"
                    value={formData.tax_number}
                    onChange={(event) =>
                      updateForm("tax_number", event.target.value)
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
                        Active Supplier
                      </span>

                      <span className="block text-xs text-gray-500">
                        Allow this supplier to be used in purchases.
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              Delete Supplier?
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
                {deleting ? "Deleting..." : "Delete Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
