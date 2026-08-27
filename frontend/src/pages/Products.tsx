import { useEffect, useState } from "react";

import { getProducts } from "../services/productService";
import type { Product } from "../types/product";

import ProductForm from "../components/products/ProductForm";
import ProductDetails from "../components/products/ProductDetails";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Product
  const [showForm, setShowForm] = useState(false);

  // Edit Product
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Details
  const [showDetails, setShowDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Load Products
  |--------------------------------------------------------------------------
  */

  async function loadProducts() {
    try {
      setLoading(true);
      setError(null);

      const data = await getProducts();

      setProducts(data);
    } catch (err) {
      console.error("Load products error:", err);

      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

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
    setShowForm(false);
    setEditingProduct(product);
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
    setProducts((current) => {
      const exists = current.some((item) => item.id === product.id);

      // Update existing product
      if (exists) {
        return current.map((item) => (item.id === product.id ? product : item));
      }

      // Add new product
      return [product, ...current];
    });

    handleCloseForm();
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
  | Close Product Details
  |--------------------------------------------------------------------------
  */

  function handleCloseDetails() {
    setShowDetails(false);
    setSelectedProduct(null);
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">
      {/* ================================================================
          PAGE HEADER
      ================================================================ */}

      <div className="flex items-center justify-between">
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
          PRODUCTS TABLE
      ================================================================ */}

      <div className="rounded-xl bg-white shadow-sm">
        {/* Loading */}

        {loading && (
          <div className="p-6 text-sm text-gray-500">Loading products...</div>
        )}

        {/* Error */}

        {error && (
          <div className="flex items-center justify-between p-6">
            <span className="text-sm text-red-600">{error}</span>

            <button
              type="button"
              onClick={loadProducts}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}

        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                {/* ======================================================
                    HEADER
                ====================================================== */}

                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Product</th>

                    <th className="px-6 py-4 font-semibold">SKU</th>

                    <th className="px-6 py-4 font-semibold">Barcode</th>

                    <th className="px-6 py-4 font-semibold">Category</th>

                    <th className="px-6 py-4 font-semibold">Unit</th>

                    <th className="px-6 py-4 font-semibold">Selling Price</th>

                    <th className="px-6 py-4 font-semibold">Minimum Stock</th>

                    <th className="px-6 py-4 font-semibold">Status</th>

                    <th className="px-6 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                {/* ======================================================
                    BODY
                ====================================================== */}

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

                      <td className="px-6 py-4 text-gray-600">{product.sku}</td>

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

                      {/* Selling Price */}

                      <td className="px-6 py-4 font-medium text-gray-900">
                        ₱{Number(product.selling_price).toFixed(2)}
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
                          {/* View */}

                          <button
                            type="button"
                            onClick={() => handleViewProduct(product)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            View
                          </button>

                          {/* Edit */}

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
            </div>

            {/* Empty State */}

            {products.length === 0 && (
              <div className="p-10 text-center">
                <p className="text-sm text-gray-500">No products found.</p>

                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Add your first product
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ================================================================
          ADD / EDIT PRODUCT FORM
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
