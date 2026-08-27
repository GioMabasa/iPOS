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

        const data = await getCategories();

        setCategories(data);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* ================================================================
            HEADER
        ================================================================ */}

        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? "Edit Product" : "Add Product"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {isEdit
                ? "Update product information."
                : "Add a new product to your inventory."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-xl text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* ================================================================
            FORM
        ================================================================ */}

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Error */}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* ============================================================
              PRODUCT NAME
          ============================================================ */}

          <div>
            <label
              htmlFor="product_name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Product Name
            </label>

            <input
              id="product_name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Product name"
            />
          </div>

          {/* ============================================================
              CATEGORY
          ============================================================ */}

          <div>
            <label
              htmlFor="product_category"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Category
            </label>

            <select
              id="product_category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={categoriesLoading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
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

          {/* ============================================================
              SKU + BARCODE
          ============================================================ */}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* SKU */}

            <div>
              <label
                htmlFor="product_sku"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                SKU
              </label>

              <input
                id="product_sku"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="SKU-0001"
              />
            </div>

            {/* Barcode */}

            <div>
              <label
                htmlFor="product_barcode"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Barcode
              </label>

              <input
                id="product_barcode"
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* ============================================================
              DESCRIPTION
          ============================================================ */}

          <div>
            <label
              htmlFor="product_description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Description
            </label>

            <textarea
              id="product_description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Product description"
            />
          </div>

          {/* ============================================================
              UNIT
          ============================================================ */}

          <div>
            <label
              htmlFor="product_unit"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Unit
            </label>

            <select
              id="product_unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {units.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* ============================================================
              SELLING PRICE
          ============================================================ */}

          <div>
            <label
              htmlFor="selling_price"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Selling Price
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
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
                className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* ============================================================
              MINIMUM STOCK
          ============================================================ */}

          <div>
            <label
              htmlFor="minimum_stock"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Minimum Stock
            </label>

            <input
              id="minimum_stock"
              type="number"
              step="0.001"
              min="0"
              value={minimumStock}
              onChange={(e) => setMinimumStock(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="0"
            />

            <p className="mt-1 text-xs text-gray-500">
              Used to identify products that are running low on stock.
            </p>
          </div>

          {/* ============================================================
              ACTIVE PRODUCT
          ============================================================ */}

          <div className="flex items-center gap-3">
            <input
              id="is_active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />

            <label
              htmlFor="is_active"
              className="text-sm font-medium text-gray-700"
            >
              Active Product
            </label>
          </div>

          {/* ============================================================
              ACTIONS
          ============================================================ */}

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
