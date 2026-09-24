import { useEffect, useState, type FormEvent } from "react";

import type { Product } from "../../types/product";
import type { Category } from "../../types/category";

import { createProduct, updateProduct } from "../../services/productService";

import { getCategories } from "../../services/categoryService";

interface ProductFormProps {
  isOpen: boolean;
  product?: Product | null;
  onSuccess: (product: Product) => void;
  onCancel: () => void;
}

const units = [
  "pcs",
  "box",
  "pack",
  "bottle",
  "can",
  "bag",
  "kg",
  "g",
  "liter",
  "ml",
  "meter",
  "set",
  "dozen",
];

export default function ProductForm({
  isOpen,
  product,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const isEdit = Boolean(product);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [categoryId, setCategoryId] = useState("");

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [sellingPrice, setSellingPrice] = useState("");
  const [minimumStock, setMinimumStock] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Load Categories
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    async function loadCategories() {
      try {
        setCategoriesLoading(true);
        setError(null);

        const response = await getCategories();

        setCategories(response.data);
      } catch (err) {
        console.error("Load categories error:", err);

        setError("Failed to load categories.");
      } finally {
        setCategoriesLoading(false);
      }
    }

    loadCategories();
  }, [isOpen]);

  /*
  |--------------------------------------------------------------------------
  | Load Product Data
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (product) {
      setCategoryId(product.category_id ? String(product.category_id) : "");

      setName(product.name);
      setSku(product.sku);
      setBarcode(product.barcode ?? "");
      setDescription(product.description ?? "");
      setUnit(product.unit);
      setSellingPrice(product.selling_price);
      setMinimumStock(product.minimum_stock);
      setIsActive(product.is_active);
    } else {
      setCategoryId("");
      setName("");
      setSku("");
      setBarcode("");
      setDescription("");
      setUnit("pcs");
      setSellingPrice("");
      setMinimumStock("0");
      setIsActive(true);
    }

    setError(null);
  }, [product, isOpen]);

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setLoading(true);

    try {
      const payload = {
        category_id: categoryId ? Number(categoryId) : null,

        name: name.trim(),
        sku: sku.trim(),
        barcode: barcode.trim() || null,
        description: description.trim() || null,
        unit,
        selling_price: sellingPrice,
        minimum_stock: minimumStock,
        is_active: isActive,
      };

      /*
      |--------------------------------------------------------------------------
      | Edit
      |--------------------------------------------------------------------------
      */

      if (product) {
        const updatedProduct = await updateProduct(product.id, payload);

        onSuccess(updatedProduct);

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Create
      |--------------------------------------------------------------------------
      */

      const newProduct = await createProduct(payload);

      onSuccess(newProduct);
    } catch (err: any) {
      console.error("Product save error:", err);

      console.error("Response:", err?.response?.data);

      /*
      |--------------------------------------------------------------------------
      | Laravel Validation Errors
      |--------------------------------------------------------------------------
      */

      const validationErrors = err?.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0] as
          | string[]
          | undefined;

        if (firstError?.length) {
          setError(firstError[0]);
          return;
        }
      }

      setError(err?.response?.data?.message ?? "Failed to save product.");
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Close Form
  |--------------------------------------------------------------------------
  */

  function handleClose() {
    if (loading) {
      return;
    }

    onCancel();
  }

  /*
  |--------------------------------------------------------------------------
  | Don't Render
  |--------------------------------------------------------------------------
  */

  if (!isOpen) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        {/* ================================================================
            HEADER
        ================================================================ */}

        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-sm font-bold text-white">
              {isEdit ? "✎" : "+"}
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEdit ? "Edit Product" : "Add Product"}
              </h2>

              <p className="mt-0.5 text-sm text-gray-500">
                {isEdit
                  ? "Update product information."
                  : "Add a new product to your inventory."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close"
            className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-2xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* ================================================================
            FORM
        ================================================================ */}

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-y-auto">
            <div className="space-y-7 p-6">
              {/* Error */}

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                    !
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-red-700">
                      Unable to save product
                    </p>

                    <p className="mt-0.5 text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* ==========================================================
                  BASIC INFORMATION
              ========================================================== */}

              <section>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
                    Basic Information
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Enter the basic information for this product.
                  </p>
                </div>

                <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5">
                  {/* Product Name */}

                  <div>
                    <label
                      htmlFor="product_name"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Product Name
                      <span className="ml-1 text-red-500">*</span>
                    </label>

                    <input
                      id="product_name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoFocus
                      className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                      placeholder="Product name"
                    />
                  </div>

                  {/* Category */}

                  <div>
                    <label
                      htmlFor="product_category"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Category
                    </label>

                    <select
                      id="product_category"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      disabled={categoriesLoading}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">
                        {categoriesLoading
                          ? "Loading categories..."
                          : "Select category"}
                      </option>

                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SKU + Barcode */}

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* SKU */}

                    <div>
                      <label
                        htmlFor="product_sku"
                        className="mb-1.5 block text-sm font-medium text-gray-700"
                      >
                        SKU
                        <span className="ml-1 text-red-500">*</span>
                      </label>

                      <input
                        id="product_sku"
                        type="text"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                        placeholder="SKU-0001"
                      />
                    </div>

                    {/* Barcode */}

                    <div>
                      <label
                        htmlFor="product_barcode"
                        className="mb-1.5 block text-sm font-medium text-gray-700"
                      >
                        Barcode
                      </label>

                      <input
                        id="product_barcode"
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 font-mono text-sm text-gray-900 outline-none transition placeholder:font-sans placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  {/* Description */}

                  <div>
                    <label
                      htmlFor="product_description"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>

                    <textarea
                      id="product_description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                      placeholder="Add a short description of this product..."
                    />
                  </div>
                </div>
              </section>

              {/* ==========================================================
                  PRICING & INVENTORY
              ========================================================== */}

              <section>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
                    Pricing & Inventory
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Set the selling price, unit, and stock threshold.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 rounded-xl border border-gray-200 bg-white p-5 md:grid-cols-2">
                  {/* Unit */}

                  <div>
                    <label
                      htmlFor="product_unit"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Unit
                    </label>

                    <select
                      id="product_unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                    >
                      {units.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selling Price */}

                  <div>
                    <label
                      htmlFor="selling_price"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Selling Price
                      <span className="ml-1 text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                        ₱
                      </span>

                      <input
                        id="selling_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-8 pr-3.5 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Minimum Stock */}

                  <div className="md:col-span-2">
                    <label
                      htmlFor="minimum_stock"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Minimum Stock
                    </label>

                    <input
                      id="minimum_stock"
                      type="number"
                      step="0.001"
                      min="0"
                      value={minimumStock}
                      onFocus={(event) => event.currentTarget.select()}
                      onChange={(e) => setMinimumStock(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                      placeholder="0"
                    />

                    <p className="mt-1.5 text-xs text-gray-500">
                      Used to identify products that are running low on stock.
                    </p>
                  </div>
                </div>
              </section>

              {/* ==========================================================
                  PRODUCT STATUS
              ========================================================== */}

              <section>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
                    Product Status
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Control whether this product is available for use.
                  </p>
                </div>

                <label
                  htmlFor="is_active"
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                    isActive
                      ? "border-green-200 bg-green-50/60"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isActive ? "bg-green-100" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isActive ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Active Product
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        {isActive
                          ? "This product is currently active."
                          : "This product is currently inactive."}
                      </p>
                    </div>
                  </div>

                  <input
                    id="is_active"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                </label>
              </section>
            </div>
          </div>

          {/* ==============================================================
              ACTIONS
          ============================================================== */}

          <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-gray-50/80 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : isEdit
                  ? "Update Product"
                  : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
