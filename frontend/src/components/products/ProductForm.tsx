import { useEffect, useState, type FormEvent } from "react";

import type { Product } from "../../types/product";
import type { Category } from "../../types/category";

import { createProduct, updateProduct } from "../../services/productService";
import { getCategories } from "../../services/categoryService";
import { useAuth } from "../../context/AuthContext";

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
  const { user } = useAuth();

  const isEdit = Boolean(product);
  const isCashier = user?.role === "cashier";

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

  useEffect(() => {
    if (!isOpen) return;

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

  useEffect(() => {
    if (!isOpen) return;

    if (product) {
      setCategoryId(product.category_id ? String(product.category_id) : "");
      setName(product.name);
      setSku(product.sku);
      setBarcode(product.barcode ?? "");
      setDescription(product.description ?? "");
      setUnit(product.unit);
      setSellingPrice(product.selling_price);

      // Display minimum stock without unnecessary trailing zeros.
      setMinimumStock(
        Number(product.minimum_stock).toLocaleString("en-PH", {
          maximumFractionDigits: 3,
          useGrouping: false,
        }),
      );

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

      // Cashier-created products must always start as inactive.
      setIsActive(!isCashier);
    }

    setError(null);
  }, [product, isOpen, isCashier]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (product) {
        // Cashier can edit an inactive product,
        // but cannot change its active/inactive status.
        const payload = {
          category_id: categoryId ? Number(categoryId) : null,
          name: name.trim(),
          sku: sku.trim(),
          barcode: barcode.trim() || null,
          description: description.trim() || null,
          unit,
          selling_price: sellingPrice,
          minimum_stock: minimumStock,
          ...(isCashier ? {} : { is_active: isActive }),
        };

        const updatedProduct = await updateProduct(product.id, payload);
        onSuccess(updatedProduct);
        return;
      }

      const payload = {
        category_id: categoryId ? Number(categoryId) : null,
        name: name.trim(),
        sku: sku.trim(),
        barcode: barcode.trim() || null,
        description: description.trim() || null,
        unit,
        selling_price: sellingPrice,
        minimum_stock: minimumStock,

        // Cashier-created products are always inactive.
        is_active: isCashier ? false : isActive,
      };

      const newProduct = await createProduct(payload);
      onSuccess(newProduct);
    } catch (err: any) {
      console.error("Product save error:", err);
      console.error("Response:", err?.response?.data);

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

  function handleClose() {
    if (loading) return;
    onCancel();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b border-indigo-100 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 px-6 py-5 text-white">
          <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-20 h-44 w-44 rounded-full bg-white/10" />

          <div className="relative flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-xl font-bold shadow-lg backdrop-blur-sm">
                {isEdit ? "✎" : "+"}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">
                    {isEdit ? "Edit Product" : "Add Product"}
                  </h2>

                  {isEdit && (
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-white/20">
                      Editing
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-blue-50">
                  {isEdit
                    ? "Update product information and inventory settings."
                    : "Add a new product to your inventory catalog."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              aria-label="Close"
              className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-2xl leading-none text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-y-auto">
            <div className="space-y-7 bg-slate-50/70 p-6">
              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4 shadow-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-sm font-bold text-red-600">
                    !
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-red-700">
                      Unable to save product
                    </p>

                    <p className="mt-0.5 text-sm leading-5 text-red-600">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <section>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <svg
                      className="h-5 w-5"
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
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                      Basic Information
                    </h3>

                    <p className="mt-0.5 text-sm text-slate-500">
                      Enter the basic information for this product.
                    </p>
                  </div>
                </div>

                <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div>
                    <label
                      htmlFor="product_name"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
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
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="Product name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="product_category"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Category
                    </label>

                    <select
                      id="product_category"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      disabled={categoriesLoading}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
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

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="product_sku"
                        className="mb-1.5 block text-sm font-semibold text-slate-700"
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
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                        placeholder="SKU-0001"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="product_barcode"
                        className="mb-1.5 block text-sm font-semibold text-slate-700"
                      >
                        Barcode
                      </label>

                      <input
                        id="product_barcode"
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 shadow-sm outline-none transition placeholder:font-sans placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="product_description"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Description
                    </label>

                    <textarea
                      id="product_description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="Add a short description of this product..."
                    />
                  </div>
                </div>
              </section>

              {/* Pricing & Inventory */}
              <section>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
                    ₱
                  </div>

                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                      Pricing & Inventory
                    </h3>

                    <p className="mt-0.5 text-sm text-slate-500">
                      Set the selling price, unit, and stock threshold.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="product_unit"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Unit
                    </label>

                    <select
                      id="product_unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    >
                      {units.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="selling_price"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Selling Price
                      <span className="ml-1 text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-indigo-500">
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
                        className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-9 pr-4 text-sm font-medium text-slate-900 shadow-sm outline-none transition hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="minimum_stock"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
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
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="0"
                    />

                    <div className="mt-2 flex items-start gap-2 rounded-xl bg-cyan-50 px-3.5 py-2.5 text-xs text-cyan-700">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path strokeLinecap="round" d="M12 10v6m0-9h.01" />
                      </svg>

                      <span>
                        Used to identify products that are running low on stock.
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Product Status */}
              {isCashier ? (
                <section>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v4m0 4h.01M10.3 3.8 2.9 17a2 2 0 0 0 1.75 3h14.7a2 2 0 0 0 1.75-3L13.7 3.8a2 2 0 0 0-3.4 0Z"
                        />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                        Product Status
                      </h3>

                      <p className="mt-0.5 text-sm text-slate-500">
                        Product status is managed by Admin or Manager.
                      </p>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-sm">
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-200/30" />

                    <div className="relative flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-amber-200">
                          <span className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_0_5px_rgba(245,158,11,0.12)]" />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            Inactive Product
                          </p>

                          <p className="mt-0.5 max-w-lg text-xs leading-5 text-slate-600">
                            {isEdit
                              ? "This product remains inactive until approved by Admin or Manager."
                              : "Products created by Cashiers are saved as inactive and require Admin or Manager activation."}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm">
                        Inactive
                      </span>
                    </div>
                  </div>
                </section>
              ) : (
                <section>
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        isActive
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 3v18M3 12h18"
                        />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                        Product Status
                      </h3>

                      <p className="mt-0.5 text-sm text-slate-500">
                        Control whether this product is available for use.
                      </p>
                    </div>
                  </div>

                  <label
                    htmlFor="is_active"
                    className={`relative flex cursor-pointer items-center justify-between overflow-hidden rounded-2xl border p-5 shadow-sm transition ${
                      isActive
                        ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50"
                        : "border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ${
                          isActive
                            ? "ring-1 ring-emerald-200"
                            : "ring-1 ring-slate-200"
                        }`}
                      >
                        <span
                          className={`h-3 w-3 rounded-full ${
                            isActive
                              ? "bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]"
                              : "bg-slate-400"
                          }`}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {isActive ? "Active Product" : "Inactive Product"}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {isActive
                            ? "This product is currently active and available for use."
                            : "This product is currently inactive."}
                        </p>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        id="is_active"
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="peer sr-only"
                      />

                      <div
                        className={`h-7 w-12 rounded-full transition ${
                          isActive ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />

                      <div
                        className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-md transition ${
                          isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </label>
                </section>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4">
            <p className="hidden text-xs text-slate-400 sm:block">
              {isEdit
                ? "Review the changes before updating."
                : "Required fields are marked with *."}
            </p>

            <div className="ml-auto flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-w-[145px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-blue-700 hover:shadow-lg hover:shadow-indigo-500/25 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-30"
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="3"
                      />

                      <path
                        className="opacity-90"
                        fill="currentColor"
                        d="M21 12a9 9 0 0 1-9-9v3a6 6 0 0 0 6 6h3Z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
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
                        d="M5 12.5 9.5 17 19 7.5"
                      />
                    </svg>

                    {isEdit ? "Update Product" : "Save Product"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
