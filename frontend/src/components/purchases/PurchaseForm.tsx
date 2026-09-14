import { useEffect, useMemo, useState } from "react";

import { getSuppliers } from "../../services/supplierService";
import { getProducts } from "../../services/productService";
import { createPurchase } from "../../services/purchaseService";

import type { Supplier } from "../../types/supplier";
import type { Product } from "../../types/product";
import type { Purchase, PurchaseFormData } from "../../types/purchase";

interface PurchaseFormProps {
  isOpen: boolean;
  onCancel: () => void;
  onSuccess: (purchase: Purchase) => void;
}

interface PurchaseLine {
  product_id: number;
  product: Product;
  quantity: number;
  unit_cost: number;
}

const PER_PAGE = 10;

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function PurchaseForm({
  isOpen,
  onCancel,
  onSuccess,
}: PurchaseFormProps) {
  /*
  |--------------------------------------------------------------------------
  | Suppliers
  |--------------------------------------------------------------------------
  */

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Products
  |--------------------------------------------------------------------------
  */

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [productLastPage, setProductLastPage] = useState(1);

  /*
  |--------------------------------------------------------------------------
  | Purchase Form
  |--------------------------------------------------------------------------
  */

  const [supplierId, setSupplierId] = useState<number | "">("");
  const [purchaseDate, setPurchaseDate] = useState(getToday());
  const [referenceNumber, setReferenceNumber] = useState("");
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Purchase Items
  |--------------------------------------------------------------------------
  */

  const [items, setItems] = useState<PurchaseLine[]>([]);

  /*
  |--------------------------------------------------------------------------
  | UI State
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Load Suppliers
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    async function loadSuppliers() {
      try {
        setSuppliersLoading(true);
        setError(null);

        const response = await getSuppliers({
          page: 1,
          per_page: 100,
        });

        setSuppliers(response.data.filter((supplier) => supplier.is_active));
      } catch (err) {
        console.error("Load suppliers error:", err);

        setError("Failed to load suppliers.");
      } finally {
        setSuppliersLoading(false);
      }
    }

    loadSuppliers();
  }, [isOpen]);
  /*
  |--------------------------------------------------------------------------
  | Load Products
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    async function loadProducts() {
      try {
        setProductsLoading(true);
        setError(null);

        const response = await getProducts({
          page: productPage,
          search: productSearch,
          is_active: true,
          per_page: PER_PAGE,
        });

        setProducts(response.data);
        setProductLastPage(response.last_page);
      } catch (err) {
        console.error("Load products error:", err);

        setError("Failed to load products.");
      } finally {
        setProductsLoading(false);
      }
    }

    loadProducts();
  }, [isOpen, productPage, productSearch]);

  /*
  |--------------------------------------------------------------------------
  | Reset Form
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSupplierId("");
    setPurchaseDate(getToday());
    setReferenceNumber("");
    setDiscount(0);
    setTax(0);
    setNotes("");
    setItems([]);
    setProductSearch("");
    setProductPage(1);
    setError(null);
  }, [isOpen]);

  /*
  |--------------------------------------------------------------------------
  | Totals
  |--------------------------------------------------------------------------
  */

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) => total + item.quantity * item.unit_cost,
      0,
    );
  }, [items]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - Number(discount || 0) + Number(tax || 0));
  }, [subtotal, discount, tax]);

  /*
  |--------------------------------------------------------------------------
  | Add Product
  |--------------------------------------------------------------------------
  */

  function addProduct(product: Product) {
    setItems((current) => {
      const existing = current.find((item) => item.product_id === product.id);

      if (existing) {
        return current.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      const supplier = suppliers.find((item) => item.id === supplierId);

      const preferredSupplier = product.suppliers?.find(
        (item) => item.pivot?.is_preferred,
      );

      const supplierForProduct =
        supplier && product.suppliers?.find((item) => item.id === supplier.id);

      const defaultCost = Number(
        supplierForProduct?.pivot?.cost_price ??
          preferredSupplier?.pivot?.cost_price ??
          0,
      );

      return [
        ...current,
        {
          product_id: product.id,
          product,
          quantity: 1,
          unit_cost: defaultCost,
        },
      ];
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Remove Product
  |--------------------------------------------------------------------------
  */

  function removeItem(productId: number) {
    setItems((current) =>
      current.filter((item) => item.product_id !== productId),
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Update Quantity
  |--------------------------------------------------------------------------
  */

  function updateQuantity(productId: number, value: string) {
    const quantity = Number(value);

    setItems((current) =>
      current.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity: quantity > 0 ? quantity : 0,
            }
          : item,
      ),
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Update Unit Cost
  |--------------------------------------------------------------------------
  */

  function updateUnitCost(productId: number, value: string) {
    const unitCost = Number(value);

    setItems((current) =>
      current.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              unit_cost: unitCost >= 0 ? unitCost : 0,
            }
          : item,
      ),
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (supplierId === "") {
      setError("Please select a supplier.");
      return;
    }

    if (items.length === 0) {
      setError("Please add at least one product.");
      return;
    }

    const invalidItem = items.some(
      (item) => item.quantity <= 0 || item.unit_cost < 0,
    );

    if (invalidItem) {
      setError("Please make sure all quantities and unit costs are valid.");
      return;
    }

    const data: PurchaseFormData = {
      supplier_id: supplierId,
      purchase_date: purchaseDate,
      reference_number: referenceNumber.trim(),
      discount: Number(discount || 0),
      tax: Number(tax || 0),
      notes: notes.trim(),
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
      })),
    };

    try {
      setLoading(true);

      const purchase = await createPurchase(data);

      onSuccess(purchase);
    } catch (err: any) {
      console.error("Create purchase error:", err);

      const message =
        err?.response?.data?.message || "Failed to receive purchase.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Product Search
  |--------------------------------------------------------------------------
  */

  function handleProductSearch(event: React.ChangeEvent<HTMLInputElement>) {
    setProductSearch(event.target.value);
    setProductPage(1);
  }

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  function goToProductPage(page: number) {
    if (page < 1 || page > productLastPage || page === productPage) {
      return;
    }

    setProductPage(page);
  }

  if (!isOpen) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-6xl rounded-xl bg-white shadow-xl">
          {/* ==========================================================
              HEADER
          ========================================================== */}

          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Receive Purchase
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Record a supplier purchase and receive stock.
              </p>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          {/* ==========================================================
              FORM
          ========================================================== */}

          <form onSubmit={handleSubmit}>
            <div className="max-h-[75vh] overflow-y-auto p-6">
              {/* Error */}

              {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* ======================================================
                  PURCHASE INFORMATION
              ====================================================== */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Supplier */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Supplier
                  </label>

                  <select
                    value={supplierId}
                    onChange={(event) =>
                      setSupplierId(
                        event.target.value ? Number(event.target.value) : "",
                      )
                    }
                    disabled={loading || suppliersLoading}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">
                      {suppliersLoading
                        ? "Loading suppliers..."
                        : "Select supplier"}
                    </option>

                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Purchase Date */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Purchase Date
                  </label>

                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(event) => setPurchaseDate(event.target.value)}
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Reference */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Reference Number
                  </label>

                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(event) => setReferenceNumber(event.target.value)}
                    placeholder="Optional"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* ======================================================
                  PRODUCT SELECTOR
              ====================================================== */}

              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Add Products
                  </h3>

                  <span className="text-xs text-gray-500">
                    {products.length} products
                  </span>
                </div>

                {/* Search */}

                <input
                  type="search"
                  value={productSearch}
                  onChange={handleProductSearch}
                  placeholder="Search product by name, SKU or barcode..."
                  disabled={loading}
                  className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />

                {/* Products */}

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  {productsLoading ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      Loading products...
                    </div>
                  ) : products.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      No products found.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {products.map((product) => {
                        const alreadyAdded = items.some(
                          (item) => item.product_id === product.id,
                        );

                        return (
                          <div
                            key={product.id}
                            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {product.name}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                SKU: {product.sku}
                                {" • "}
                                {product.unit}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => addProduct(product)}
                              disabled={loading}
                              className="rounded-lg border border-indigo-300 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                            >
                              {alreadyAdded ? "+ Add More" : "+ Add"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Product Pagination */}

                  {productLastPage > 1 && (
                    <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => goToProductPage(productPage - 1)}
                        disabled={productPage === 1 || productsLoading}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Previous
                      </button>

                      <span className="text-sm text-gray-600">
                        Page {productPage} of {productLastPage}
                      </span>

                      <button
                        type="button"
                        onClick={() => goToProductPage(productPage + 1)}
                        disabled={
                          productPage === productLastPage || productsLoading
                        }
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ======================================================
                  PURCHASE ITEMS
              ====================================================== */}

              <div className="mt-8">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Purchase Items
                </h3>

                {items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                    No products added yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Product</th>

                          <th className="px-4 py-3 font-semibold">Quantity</th>

                          <th className="px-4 py-3 font-semibold">Unit Cost</th>

                          <th className="px-4 py-3 text-right font-semibold">
                            Total
                          </th>

                          <th className="px-4 py-3" />
                        </tr>
                      </thead>

                      <tbody className="divide-y">
                        {items.map((item) => {
                          const lineTotal = item.quantity * item.unit_cost;

                          return (
                            <tr key={item.product_id}>
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900">
                                  {item.product.name}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  {item.product.sku}
                                </p>
                              </td>

                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0.001"
                                  step="0.001"
                                  value={item.quantity}
                                  onChange={(event) =>
                                    updateQuantity(
                                      item.product_id,
                                      event.target.value,
                                    )
                                  }
                                  disabled={loading}
                                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                              </td>

                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unit_cost}
                                  onChange={(event) =>
                                    updateUnitCost(
                                      item.product_id,
                                      event.target.value,
                                    )
                                  }
                                  disabled={loading}
                                  className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                              </td>

                              <td className="px-4 py-3 text-right font-medium text-gray-900">
                                {formatCurrency(lineTotal)}
                              </td>

                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.product_id)}
                                  disabled={loading}
                                  className="text-sm font-medium text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ======================================================
                  SUMMARY
              ====================================================== */}

              <div className="mt-8 flex justify-end">
                <div className="w-full max-w-sm space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>

                    <span className="font-medium text-gray-900">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-600">
                      Discount
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={(event) =>
                        setDiscount(Number(event.target.value))
                      }
                      disabled={loading}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-600">
                      Tax
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tax}
                      onChange={(event) => setTax(Number(event.target.value))}
                      disabled={loading}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-base font-semibold text-gray-900">
                      Grand Total
                    </span>

                    <span className="text-xl font-bold text-indigo-600">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ======================================================
                  NOTES
              ====================================================== */}

              <div className="mt-8">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Optional notes..."
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* ========================================================
                FOOTER
            ======================================================== */}

            <div className="flex items-center justify-end gap-3 border-t bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || items.length === 0 || supplierId === ""}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Receiving..." : "Receive Purchase"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
