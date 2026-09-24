import { useEffect, useState } from "react";

import {
  getProducts,
  getProductInventoryDetails,
  exportProducts,
} from "../services/productService";

import { getCategories } from "../services/categoryService";

import type { Product } from "../types/product";
import type { Category } from "../types/category";

import ProductForm from "../components/products/ProductForm";
import ProductDetails from "../components/products/ProductDetails";

export default function Products() {
  /*
  |--------------------------------------------------------------------------
  | Products
  |--------------------------------------------------------------------------
  */

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  /*
  |--------------------------------------------------------------------------
  | Loading / Error
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage] = useState(20);

  /*
  |--------------------------------------------------------------------------
  | Filters
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] = useState<number | "">("");

  const [statusFilter, setStatusFilter] = useState<boolean | "">("");

  /*
  |--------------------------------------------------------------------------
  | Add / Edit
  |--------------------------------------------------------------------------
  */

  const [showForm, setShowForm] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Product Details
  |--------------------------------------------------------------------------
  */

  const [showDetails, setShowDetails] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Load Products
  |--------------------------------------------------------------------------
  */

  async function loadProducts(page: number = 1) {
    try {
      setLoading(true);
      setError(null);

      const response = await getProducts({
        page,
        search,
        category_id: categoryFilter,
        is_active: statusFilter,
        per_page: perPage,
      });

      setProducts(response.data);

      setCurrentPage(response.current_page);
      setLastPage(response.last_page);
      setTotal(response.total);
    } catch (err) {
      console.error("Load products error:", err);

      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Load Categories
  |--------------------------------------------------------------------------
  */

  async function loadCategories() {
    try {
      const response = await getCategories(1);
      setCategories(response.data);
    } catch (err) {
      console.error("Load categories error:", err);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadProducts(1);
    loadCategories();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | AJAX Search / Filters
  |--------------------------------------------------------------------------
  |
  | Wait 400ms after the user stops typing before requesting the API.
  |
  */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadProducts(1);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search, categoryFilter, statusFilter]);

  /*
  |--------------------------------------------------------------------------
  | Clear Filters
  |--------------------------------------------------------------------------
  */

  function clearFilters() {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
  }

  /*
  |--------------------------------------------------------------------------
  | Export Products
  |--------------------------------------------------------------------------
  */

  async function handleExportProducts() {
    try {
      const blob = await exportProducts({
        search,
        category_id: categoryFilter,
        is_active: statusFilter,
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `products-${new Date().toISOString().slice(0, 10)}.xlsx`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export products error:", err);

      setError("Failed to export products.");
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Add Product
  |--------------------------------------------------------------------------
  */

  function handleAddProduct() {
    setEditingProduct(null);
    setShowForm(true);
  }

  /*
  |--------------------------------------------------------------------------
  | Edit Product
  |--------------------------------------------------------------------------
  */

  function handleEditProduct(product: Product) {
    setShowDetails(false);
    setSelectedProduct(null);

    setEditingProduct(product);
    setShowForm(true);
  }

  /*
  |--------------------------------------------------------------------------
  | Close Product Form
  |--------------------------------------------------------------------------
  */

  function handleCloseForm() {
    setShowForm(false);
    setEditingProduct(null);
  }

  /*
  |--------------------------------------------------------------------------
  | Product Saved
  |--------------------------------------------------------------------------
  */

  function handleProductSuccess(product: Product) {
    handleCloseForm();

    /*
     * Reload current page instead of manually
     * modifying paginated data.
     */

    loadProducts(currentPage);
  }

  /*
  |--------------------------------------------------------------------------
  | View Product
  |--------------------------------------------------------------------------
  */

  async function handleViewProduct(product: Product) {
    try {
      const details = await getProductInventoryDetails(product.id);

      setSelectedProduct({
        ...product,
        ...details,
        category: product.category,
      });

      setShowDetails(true);
    } catch (err) {
      console.error("Load product details error:", err);

      setError("Failed to load product details.");
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Close Details
  |--------------------------------------------------------------------------
  */

  function handleCloseDetails() {
    setShowDetails(false);
    setSelectedProduct(null);
  }

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  function goToPage(page: number) {
    if (page < 1 || page > lastPage || page === currentPage) {
      return;
    }

    loadProducts(page);
  }

  /*
  |--------------------------------------------------------------------------
  | Results Range
  |--------------------------------------------------------------------------
  */

  const showingFrom = products.length > 0 ? (currentPage - 1) * perPage + 1 : 0;

  const showingTo =
    products.length > 0 ? Math.min(currentPage * perPage, total) : 0;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/* ================================================================
          HEADER
      ================================================================ */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7.5 12 3 4 7.5m16 0L12 12 4 7.5m16 0V16.5L12 21l-8-4.5V7.5M12 12v9"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Products
              </h1>

              <p className="mt-0.5 text-sm text-gray-500">
                Manage your products and inventory.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleExportProducts}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14a2 2 0 0 0 2-2v-5M3 14v5a2 2 0 0 0 2 2"
              />
            </svg>
            Export
          </button>

          <button
            type="button"
            onClick={handleAddProduct}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 5v14M5 12h14"
              />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {/* ================================================================
          FILTERS
      ================================================================ */}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row">
          {/* Search */}

          <div className="relative min-w-0 flex-1">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="11" cy="11" r="7" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m20 20-4-4"
              />
            </svg>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, SKU or barcode..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
                aria-label="Clear search"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            )}
          </div>

          {/* Category */}

          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value ? Number(event.target.value) : "",
                )
              }
              className="h-11 w-full min-w-[190px] appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 pr-10 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">All Categories</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <svg
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m6 9 6 6 6-6"
              />
            </svg>
          </div>

          {/* Status */}

          <div className="relative">
            <select
              value={
                statusFilter === "" ? "" : statusFilter ? "active" : "inactive"
              }
              onChange={(event) => {
                const value = event.target.value;

                if (value === "") {
                  setStatusFilter("");
                } else {
                  setStatusFilter(value === "active");
                }
              }}
              className="h-11 w-full min-w-[160px] appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 pr-10 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <svg
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m6 9 6 6 6-6"
              />
            </svg>
          </div>

          {/* Clear */}

          {(search || categoryFilter !== "" || statusFilter !== "") && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 6h18M9 6V4h6v2m-8 0 1 14h8l1-14"
                />
              </svg>
              Clear
            </button>
          )}
        </div>

        {(search || categoryFilter !== "" || statusFilter !== "") && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Filters are applied automatically.
          </div>
        )}
      </div>

      {/* ================================================================
          TABLE
      ================================================================ */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Loading */}

        {loading && (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <svg
                className="h-5 w-5 animate-spin text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="3"
                />

                <path
                  className="opacity-90"
                  fill="currentColor"
                  d="M21 12a9 9 0 0 0-9-9v3a6 6 0 0 1 6 6h3Z"
                />
              </svg>
            </div>

            <p className="mt-3 text-sm font-medium text-gray-600">
              Loading products...
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Please wait while we retrieve your products.
            </p>
          </div>
        )}

        {/* Error */}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4m0 4h.01M10.3 3.8 2.9 17a2 2 0 0 0 1.75 3h14.7a2 2 0 0 0 1.75-3L13.7 3.8a2 2 0 0 0-3.4 0Z"
                />
              </svg>
            </div>

            <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => loadProducts(currentPage)}
              className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content */}

        {!loading && !error && (
          <>
            {products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50/80">
                    <tr>
                      <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Product
                      </th>

                      <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        SKU
                      </th>

                      <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Barcode
                      </th>

                      <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Category
                      </th>

                      <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Unit
                      </th>

                      <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Selling Price
                      </th>

                      <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Stock
                      </th>

                      <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Min. Stock
                      </th>

                      <th className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>

                      <th className="whitespace-nowrap px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {products.map((product) => {
                      const stock = Number(
                        (
                          product as Product & {
                            stock?: number | string;
                          }
                        ).stock ?? 0,
                      );

                      return (
                        <tr
                          key={product.id}
                          className="group transition hover:bg-blue-50/30"
                        >
                          {/* Product */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-500 transition group-hover:bg-blue-100 group-hover:text-blue-600">
                                {product.name.charAt(0).toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <div className="truncate font-semibold text-gray-900">
                                  {product.name}
                                </div>

                                {product.description && (
                                  <div className="mt-0.5 max-w-xs truncate text-xs text-gray-400">
                                    {product.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* SKU */}

                          <td className="px-5 py-4">
                            <span className="font-mono text-xs font-medium text-gray-600">
                              {product.sku}
                            </span>
                          </td>

                          {/* Barcode */}

                          <td className="px-5 py-4">
                            <span className="font-mono text-xs text-gray-500">
                              {product.barcode || "-"}
                            </span>
                          </td>

                          {/* Category */}

                          <td className="px-5 py-4 text-gray-600">
                            {product.category?.name || "-"}
                          </td>

                          {/* Unit */}

                          <td className="px-5 py-4">
                            <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                              {product.unit}
                            </span>
                          </td>

                          {/* Price */}

                          <td className="px-5 py-4">
                            <span className="font-semibold text-gray-900">
                              ₱
                              {Number(product.selling_price).toLocaleString(
                                "en-PH",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </span>
                          </td>

                          {/* Stock */}

                          <td className="px-5 py-4">
                            <span
                              className={
                                stock <= Number(product.minimum_stock)
                                  ? "font-semibold text-amber-600"
                                  : "font-semibold text-gray-900"
                              }
                            >
                              {stock.toLocaleString("en-PH", {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </td>

                          {/* Minimum Stock */}

                          <td className="px-5 py-4 text-gray-600">
                            {product.minimum_stock}
                          </td>

                          {/* Status */}

                          <td className="px-5 py-4">
                            <span
                              className={
                                product.is_active
                                  ? "inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700"
                                  : "inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600"
                              }
                            >
                              <span
                                className={
                                  product.is_active
                                    ? "h-1.5 w-1.5 rounded-full bg-green-500"
                                    : "h-1.5 w-1.5 rounded-full bg-gray-400"
                                }
                              />

                              {product.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>

                          {/* Actions */}

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleViewProduct(product)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                                  />
                                  <circle cx="12" cy="12" r="2.5" />
                                </svg>
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() => handleEditProduct(product)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:border-blue-200 hover:bg-blue-100"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m14 5 5 5M4 20l3.5-.8L19.2 7.5a2.1 2.1 0 0 0-3-3L4.5 16.2 4 20Z"
                                  />
                                </svg>
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* ======================================================
                    PAGINATION
                ====================================================== */}

                <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-500">
                    Showing{" "}
                    <span className="font-semibold text-gray-700">
                      {showingFrom}–{showingTo}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-700">{total}</span>{" "}
                    products
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m15 18-6-6 6-6"
                        />
                      </svg>
                      Previous
                    </button>

                    <span className="flex h-9 items-center rounded-lg bg-gray-50 px-3 text-sm font-medium text-gray-600">
                      Page{" "}
                      <span className="mx-1 font-semibold text-gray-900">
                        {currentPage}
                      </span>{" "}
                      of {lastPage}
                    </span>

                    <button
                      type="button"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === lastPage || loading}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m9 18 6-6-6-6"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ==========================================================
                 EMPTY STATE
                 ========================================================== */

              <div className="flex flex-col items-center justify-center p-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                  <svg
                    className="h-8 w-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 7.5 12 3 4 7.5m16 0L12 12 4 7.5m16 0V16.5L12 21l-8-4.5V7.5M12 12v9"
                    />
                  </svg>
                </div>

                <h3 className="mt-5 text-base font-semibold text-gray-900">
                  No products found
                </h3>

                <p className="mt-1 max-w-sm text-sm text-gray-500">
                  {search || categoryFilter !== "" || statusFilter !== ""
                    ? "Try adjusting your filters or search terms."
                    : "Start building your product catalog by adding your first product."}
                </p>

                {search || categoryFilter !== "" || statusFilter !== "" ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 5v14M5 12h14"
                      />
                    </svg>
                    Add your first product
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ================================================================
          ADD / EDIT FORM
      ================================================================ */}

      <ProductForm
        isOpen={showForm || editingProduct !== null}
        product={editingProduct}
        onCancel={handleCloseForm}
        onSuccess={handleProductSuccess}
      />

      {/* ================================================================
          PRODUCT DETAILS
      ================================================================ */}

      <ProductDetails
        isOpen={showDetails}
        product={selectedProduct}
        onClose={handleCloseDetails}
      />
    </div>
  );
}
