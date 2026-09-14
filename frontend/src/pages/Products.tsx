import { useEffect, useState } from "react";

import { getProducts } from "../services/productService";
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

  function handleViewProduct(product: Product) {
    setSelectedProduct(product);
    setShowDetails(true);
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
  | Pagination Numbers
  |--------------------------------------------------------------------------
  */

  function getPageNumbers() {
    const pages: number[] = [];

    const start = Math.max(1, currentPage - 2);

    const end = Math.min(lastPage, currentPage + 2);

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your products and inventory.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddProduct}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Product
        </button>
      </div>

      {/* ================================================================
          FILTERS
      ================================================================ */}

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Search */}

          <div className="flex flex-1">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, SKU or barcode..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="ml-[-35px] mr-2 text-xl text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Category */}

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value ? Number(event.target.value) : "",
              )
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Status */}

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
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Status</option>

            <option value="active">Active</option>

            <option value="inactive">Inactive</option>
          </select>

          {/* Clear */}

          {(search || categoryFilter !== "" || statusFilter !== "") && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ================================================================
          TABLE
      ================================================================ */}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {/* Loading */}

        {loading && (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-500">Loading products...</p>
          </div>
        )}

        {/* Error */}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-3 p-10">
            <p className="text-sm text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => loadProducts(currentPage)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Product</th>

                      <th className="px-6 py-4 font-semibold">SKU</th>

                      <th className="px-6 py-4 font-semibold">Barcode</th>

                      <th className="px-6 py-4 font-semibold">Category</th>

                      <th className="px-6 py-4 font-semibold">Unit</th>

                      <th className="px-6 py-4 font-semibold">Selling Price</th>

                      <th className="px-6 py-4 font-semibold">Min. Stock</th>

                      <th className="px-6 py-4 font-semibold">Status</th>

                      <th className="px-6 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        {/* Product */}

                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {product.name}
                          </div>

                          {product.description && (
                            <div className="mt-1 max-w-xs truncate text-xs text-gray-500">
                              {product.description}
                            </div>
                          )}
                        </td>

                        {/* SKU */}

                        <td className="px-6 py-4 text-gray-600">
                          {product.sku}
                        </td>

                        {/* Barcode */}

                        <td className="px-6 py-4 text-gray-600">
                          {product.barcode || "-"}
                        </td>

                        {/* Category */}

                        <td className="px-6 py-4 text-gray-600">
                          {product.category?.name || "-"}
                        </td>

                        {/* Unit */}

                        <td className="px-6 py-4">{product.unit}</td>

                        {/* Price */}

                        <td className="px-6 py-4 font-medium text-gray-900">
                          ₱
                          {Number(product.selling_price).toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </td>

                        {/* Minimum Stock */}

                        <td className="px-6 py-4">{product.minimum_stock}</td>

                        {/* Status */}

                        <td className="px-6 py-4">
                          <span
                            className={
                              product.is_active
                                ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                                : "rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                            }
                          >
                            {product.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Actions */}

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewProduct(product)}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEditProduct(product)}
                              className="rounded-lg border border-blue-300 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* ======================================================
                    PAGINATION
                ====================================================== */}

                <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-500">
                    {total > 0
                      ? `Showing ${showingFrom}–${showingTo} of ${total} products`
                      : "No products"}
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
                      className="h-9 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ==========================================================
                 EMPTY STATE
                 ========================================================== */

              <div className="p-12 text-center">
                <p className="text-sm text-gray-500">No products found.</p>

                {search || categoryFilter !== "" || statusFilter !== "" ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
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
