import { useEffect, useRef, useState } from "react";

import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../services/categoryService";

import type { Category, CategoryFormData } from "../types/category";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const emptyForm: CategoryFormData = {
  name: "",
  description: "",
};

/*
|--------------------------------------------------------------------------
| Icons
|--------------------------------------------------------------------------
*/

function CategoriesIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5v-13Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7h8M8 11h8M8 15h5"
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

export default function Categories() {
  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  const [categories, setCategories] = useState<Category[]>([]);

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
  | Search
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState("");

  const isFirstSearchEffect = useRef(true);

  /*
  |--------------------------------------------------------------------------
  | Modal
  |--------------------------------------------------------------------------
  */

  const [showModal, setShowModal] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState<CategoryFormData>({
    ...emptyForm,
  });

  /*
  |--------------------------------------------------------------------------
  | Delete Confirmation
  |--------------------------------------------------------------------------
  */

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Load Categories
  |--------------------------------------------------------------------------
  */

  async function loadCategories(page: number = 1) {
    try {
      setLoading(true);
      setError("");

      const response = await getCategories(page, search);

      setCategories(response.data);

      setCurrentPage(response.pagination.current_page);
      setLastPage(response.pagination.last_page);

      setTotal(response.pagination.total);

      setFrom(response.pagination.from);
      setTo(response.pagination.to);
    } catch (err) {
      console.error("Load categories error:", err);

      setError("Failed to load categories.");
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
    loadCategories(1);
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
    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      loadCategories(1);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  /*
  |--------------------------------------------------------------------------
  | Open Create Modal
  |--------------------------------------------------------------------------
  */

  function openCreateModal() {
    setEditingCategory(null);

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

  function openEditModal(category: Category) {
    setEditingCategory(category);

    setFormData({
      name: category.name,
      description: category.description ?? "",
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
    setEditingCategory(null);

    setFormData({
      ...emptyForm,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Form Change
  |--------------------------------------------------------------------------
  */

  function updateForm(field: keyof CategoryFormData, value: string) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /*
  |--------------------------------------------------------------------------
  | Save Category
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!formData.name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload: CategoryFormData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      const isEditing = editingCategory !== null;

      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);

        setSuccessMessage("Category updated successfully.");
      } else {
        await createCategory(payload);

        setSuccessMessage("Category created successfully.");
      }

      closeModal();

      /*
      |--------------------------------------------------------------------------
      | Reload current page
      |--------------------------------------------------------------------------
      */

      if (isEditing) {
        await loadCategories(currentPage);
      } else {
        await loadCategories(1);
      }

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: unknown) {
      console.error("Save category error:", err);

      const response = (
        err as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }
      )?.response;

      setError(response?.data?.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Category
  |--------------------------------------------------------------------------
  */

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteCategory(deleteTarget.id);

      setDeleteTarget(null);

      setSuccessMessage("Category deleted successfully.");

      /*
      |--------------------------------------------------------------------------
      | If deleting the last item on the current page,
      | move to the previous page.
      |--------------------------------------------------------------------------
      */

      let pageToLoad = currentPage;

      if (categories.length === 1 && currentPage > 1) {
        pageToLoad = currentPage - 1;
      }

      await loadCategories(pageToLoad);

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: unknown) {
      console.error("Delete category error:", err);

      const response = (
        err as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }
      )?.response;

      setError(response?.data?.message || "Failed to delete category.");
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

    loadCategories(page);
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
            <CategoriesIcon className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Categories Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage product categories.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add Category
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
            SEARCH
        ============================================================ */}

        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="max-w-xl">
            <label
              htmlFor="category-search"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Search Categories
            </label>

            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon className="h-4 w-4" />
              </div>

              <input
                id="category-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search category..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {search && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span>Searching for</span>

                <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700">
                  "{search}"
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================
            TABLE HEADER
        ============================================================ */}

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <CategoriesIcon className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Category List
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Manage your product categories.
              </p>
            </div>
          </div>

          {total > 0 && (
            <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 sm:inline-flex">
              {total} categories
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

                <span>Loading categories...</span>
              </div>
            </div>
          ) : (
            <table className="w-full min-w-[700px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Category
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                          <CategoriesIcon className="h-6 w-6" />
                        </div>

                        <p className="text-sm font-semibold text-slate-800">
                          {search
                            ? "No categories match your search."
                            : "No categories found."}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {search
                            ? "Try adjusting your search."
                            : "Add your first category to get started."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr
                      key={category.id}
                      className="group transition hover:bg-slate-50/70"
                    >
                      {/* CATEGORY */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold uppercase text-indigo-600">
                            {category.name.charAt(0)}
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">
                              {category.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* DESCRIPTION */}

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {category.description || (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(category)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <EditIcon className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(category)}
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
                  categories
                </>
              ) : (
                "No categories"
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
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  {editingCategory ? (
                    <EditIcon className="h-5 w-5" />
                  ) : (
                    <PlusIcon className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingCategory ? "Edit Category" : "Add Category"}
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {editingCategory
                      ? "Update category information."
                      : "Create a new product category."}
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
                  {/* CATEGORY INFORMATION */}

                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-slate-900">
                        Category Information
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Enter the basic information for this product category.
                      </p>
                    </div>

                    <div className="space-y-5">
                      {/* CATEGORY NAME */}

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Category Name <span className="text-red-500">*</span>
                        </label>

                        <input
                          type="text"
                          value={formData.name}
                          onChange={(event) =>
                            updateForm("name", event.target.value)
                          }
                          disabled={saving}
                          required
                          placeholder="e.g. Beverages"
                          className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                        />
                      </div>

                      {/* DESCRIPTION */}

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Description
                        </label>

                        <textarea
                          value={formData.description}
                          onChange={(event) =>
                            updateForm("description", event.target.value)
                          }
                          disabled={saving}
                          rows={4}
                          placeholder="Optional category description..."
                          className="w-full resize-none rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
                        />
                      </div>
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
                    : editingCategory
                      ? "Update Category"
                      : "Create Category"}
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
                    Delete Category?
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
                {deleting ? "Deleting..." : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
