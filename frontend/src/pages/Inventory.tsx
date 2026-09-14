import { useEffect, useMemo, useState } from "react";

import type {
  InventoryProduct,
  InventorySummary,
  InventoryTransaction,
  InventoryHistoryTransaction,
} from "../types/inventory";

import {
  adjustInventory,
  getInventory,
  getProductTransactions,
  getInventoryHistory,
} from "../services/inventoryService";

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);

  const [inventorySummary, setInventorySummary] = useState<InventorySummary>({
    total_products: 0,
    total_stock: 0,
    low_stock: 0,
    out_of_stock: 0,
    bad_orders: 0,
    adjustments: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<
    "all" | "in_stock" | "low_stock" | "out_of_stock"
  >("all");

  const PER_PAGE = 20;

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState<number | null>(null);
  const [to, setTo] = useState<number | null>(null);

  const [selectedProduct, setSelectedProduct] =
    useState<InventoryProduct | null>(null);

  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState("");

  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionLastPage, setTransactionLastPage] = useState(1);
  const [transactionTotal, setTransactionTotal] = useState(0);

  /*
  |--------------------------------------------------------------------------
  | Inventory History Modal
  |--------------------------------------------------------------------------
  */

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyType, setHistoryType] = useState<
    "bad_order" | "adjustment" | null
  >(null);
  const [historyTransactions, setHistoryTransactions] = useState<
    InventoryHistoryTransaction[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLastPage, setHistoryLastPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  /*
  |--------------------------------------------------------------------------
  | Adjustment Modal
  |--------------------------------------------------------------------------
  */

  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustmentProduct, setAdjustmentProduct] =
    useState<InventoryProduct | null>(null);
  const [adjustmentProductSearch, setAdjustmentProductSearch] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<
    "adjustment" | "bad_order"
  >("bad_order");
  const [adjustmentDirection, setAdjustmentDirection] = useState<
    "increase" | "decrease"
  >("increase");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState("");

  const loadInventory = async (page: number = 1) => {
    try {
      setLoading(true);
      setError("");

      const response = await getInventory({
        page,
        per_page: PER_PAGE,
        search,
        stock_filter: stockFilter,
      });

      setInventory(response.data);
      setInventorySummary(response.summary);

      setCurrentPage(Number(response.current_page));
      setLastPage(Number(response.last_page));
      setTotal(Number(response.total));
      setFrom(response.from === null ? null : Number(response.from));
      setTo(response.to === null ? null : Number(response.to));

      return response;
    } catch (err) {
      console.error(err);
      setError("Unable to load inventory.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory(1);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadInventory(1);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search, stockFilter]);

  function goToPage(page: number) {
    if (page < 1 || page > lastPage || page === currentPage || loading) {
      return;
    }

    loadInventory(page);
  }

  const loadTransactions = async (productId: number, page: number = 1) => {
    try {
      setTransactionsLoading(true);
      setTransactionsError("");

      const response = await getProductTransactions(productId, page);

      setTransactions(response.data.data ?? []);
      setTransactionPage(response.data.current_page ?? 1);
      setTransactionLastPage(response.data.last_page ?? 1);
      setTransactionTotal(response.data.total ?? 0);
    } catch (err) {
      console.error(err);
      setTransactionsError("Unable to load inventory transactions.");
    } finally {
      setTransactionsLoading(false);
    }
  };

  const openProductDetails = async (product: InventoryProduct) => {
    setSelectedProduct(product);
    setTransactions([]);
    setTransactionPage(1);
    setTransactionLastPage(1);
    setTransactionTotal(0);

    await loadTransactions(product.product_id, 1);
  };

  const closeProductDetails = () => {
    if (transactionsLoading) {
      return;
    }

    setSelectedProduct(null);
    setTransactions([]);
    setTransactionsError("");
    setTransactionPage(1);
    setTransactionLastPage(1);
    setTransactionTotal(0);
  };

  /*
  |--------------------------------------------------------------------------
  | Inventory History
  |--------------------------------------------------------------------------
  */

  const loadHistory = async (
    type: "bad_order" | "adjustment",
    page: number = 1,
  ) => {
    try {
      setHistoryLoading(true);
      setHistoryError("");

      const response = await getInventoryHistory(type, page);

      setHistoryTransactions(response.data.data ?? []);
      setHistoryPage(response.data.current_page ?? 1);
      setHistoryLastPage(response.data.last_page ?? 1);
      setHistoryTotal(response.data.total ?? 0);
    } catch (err) {
      console.error(err);
      setHistoryError("Unable to load inventory history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistory = async (type: "bad_order" | "adjustment") => {
    setHistoryType(type);
    setHistoryTransactions([]);
    setHistoryPage(1);
    setHistoryLastPage(1);
    setHistoryTotal(0);
    setHistoryError("");
    setHistoryModalOpen(true);

    await loadHistory(type, 1);
  };

  const closeHistory = () => {
    if (historyLoading) {
      return;
    }

    setHistoryModalOpen(false);
    setHistoryType(null);
    setHistoryTransactions([]);
    setHistoryError("");
    setHistoryPage(1);
    setHistoryLastPage(1);
    setHistoryTotal(0);
  };

  /*
  |--------------------------------------------------------------------------
  | Open Adjustment Modal
  |--------------------------------------------------------------------------
  */

  const openAdjustmentModal = (product?: InventoryProduct) => {
    setAdjustmentProduct(product ?? null);
    setAdjustmentProductSearch("");
    setAdjustmentType("bad_order");
    setAdjustmentDirection("increase");
    setAdjustmentQuantity("");
    setAdjustmentNotes("");
    setAdjustmentError("");
    setAdjustmentModalOpen(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Close Adjustment Modal
  |--------------------------------------------------------------------------
  */

  const closeAdjustmentModal = () => {
    if (adjustmentLoading) {
      return;
    }

    setAdjustmentModalOpen(false);
    setAdjustmentProduct(null);
    setAdjustmentProductSearch("");
    setAdjustmentQuantity("");
    setAdjustmentNotes("");
    setAdjustmentError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Adjustment Product Search
  |--------------------------------------------------------------------------
  */

  const adjustmentProductResults = useMemo(() => {
    const searchValue = adjustmentProductSearch.trim().toLowerCase();

    if (!searchValue) {
      return inventory;
    }

    return inventory.filter((product) => {
      return (
        product.name.toLowerCase().includes(searchValue) ||
        product.sku.toLowerCase().includes(searchValue) ||
        (product.barcode ?? "").toLowerCase().includes(searchValue)
      );
    });
  }, [inventory, adjustmentProductSearch]);

  /*
  |--------------------------------------------------------------------------
  | Select Adjustment Product
  |--------------------------------------------------------------------------
  */

  const selectAdjustmentProduct = (product: InventoryProduct) => {
    setAdjustmentProduct(product);
    setAdjustmentProductSearch("");
    setAdjustmentError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Save Adjustment
  |--------------------------------------------------------------------------
  */

  const handleAdjustmentSubmit = async () => {
    setAdjustmentError("");

    if (!adjustmentProduct) {
      setAdjustmentError("Please select a product.");
      return;
    }

    const quantity = Number(adjustmentQuantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setAdjustmentError("Quantity must be greater than 0.");
      return;
    }

    /*
     * Bad Order always removes stock.
     */

    if (
      adjustmentType === "bad_order" &&
      quantity > Number(adjustmentProduct.stock)
    ) {
      setAdjustmentError(
        `Insufficient stock. Available stock: ${formatQuantity(
          adjustmentProduct.stock,
        )}.`,
      );
      return;
    }

    /*
     * Adjustment decrease removes stock.
     */

    if (
      adjustmentType === "adjustment" &&
      adjustmentDirection === "decrease" &&
      quantity > Number(adjustmentProduct.stock)
    ) {
      setAdjustmentError(
        `Insufficient stock. Available stock: ${formatQuantity(
          adjustmentProduct.stock,
        )}.`,
      );
      return;
    }

    try {
      setAdjustmentLoading(true);

      const finalQuantity =
        adjustmentType === "adjustment" && adjustmentDirection === "decrease"
          ? -quantity
          : quantity;

      await adjustInventory({
        product_id: adjustmentProduct.product_id,
        type: adjustmentType,
        quantity: finalQuantity,
        notes: adjustmentNotes.trim() || undefined,
      });

      const updatedInventory = await loadInventory(currentPage);

      /*
       * If the product details modal is open for the same product,
       * refresh its stock and transaction history.
       */

      if (
        updatedInventory &&
        selectedProduct?.product_id === adjustmentProduct.product_id
      ) {
        const refreshedProduct = updatedInventory.data.find(
          (product) => product.product_id === adjustmentProduct.product_id,
        );

        if (refreshedProduct) {
          setSelectedProduct(refreshedProduct);

          await loadTransactions(refreshedProduct.product_id, transactionPage);
        }
      }

      closeAdjustmentModal();
    } catch (err: any) {
      console.error(err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.quantity?.[0] ||
        err?.response?.data?.errors?.product_id?.[0] ||
        "Unable to adjust inventory.";

      setAdjustmentError(message);
    } finally {
      setAdjustmentLoading(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    return `₱${Number(value).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatQuantity = (value: number | string) => {
    return Number(value).toLocaleString("en-PH", {
      maximumFractionDigits: 3,
    });
  };

  const formatDate = (value: string) => {
    return new Date(value).toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStockStatus = (product: InventoryProduct) => {
    const stock = Number(product.stock);

    if (stock <= 0) {
      return {
        label: "Out of Stock",
        className: "bg-red-100 text-red-700",
      };
    }

    if (product.is_low_stock) {
      return {
        label: "Low Stock",
        className: "bg-yellow-100 text-yellow-700",
      };
    }

    return {
      label: "In Stock",
      className: "bg-green-100 text-green-700",
    };
  };

  const getTransactionLabel = (type: InventoryTransaction["type"]) => {
    switch (type) {
      case "purchase":
        return "Purchase";

      case "sale":
        return "Sale";

      case "refund":
        return "Refund";

      case "bad_order":
        return "Bad Order";

      case "adjustment":
        return "Adjustment";

      default:
        return type;
    }
  };

  const getTransactionClass = (type: InventoryTransaction["type"]) => {
    switch (type) {
      case "purchase":
        return "bg-green-100 text-green-700";

      case "sale":
        return "bg-blue-100 text-blue-700";

      case "refund":
        return "bg-yellow-100 text-yellow-700";

      case "bad_order":
        return "bg-red-100 text-red-700";

      case "adjustment":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTransactionQuantityClass = (type: InventoryTransaction["type"]) => {
    switch (type) {
      case "purchase":
      case "refund":
      case "adjustment":
        return "text-green-600";

      case "sale":
      case "bad_order":
        return "text-red-600";

      default:
        return "text-gray-800";
    }
  };

  const formatReference = (transaction: InventoryTransaction) => {
    if (!transaction.reference_type && !transaction.reference_id) {
      return "—";
    }

    if (transaction.reference_type && transaction.reference_id) {
      return `${transaction.reference_type} #${transaction.reference_id}`;
    }

    return transaction.reference_type ?? `#${transaction.reference_id}`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>

          <p className="text-sm text-gray-500">
            Monitor current stock levels and inventory status.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openAdjustmentModal()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Adjust Stock
          </button>

          <button
            type="button"
            onClick={() => loadInventory(currentPage)}
            disabled={loading}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Products</p>

          <p className="mt-2 text-2xl font-bold text-gray-800">
            {inventorySummary.total_products.toLocaleString("en-PH")}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Stock</p>

          <p className="mt-2 text-2xl font-bold text-gray-800">
            {formatQuantity(inventorySummary.total_stock)}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Low Stock</p>

          <p className="mt-2 text-2xl font-bold text-yellow-600">
            {inventorySummary.low_stock.toLocaleString("en-PH")}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Out of Stock</p>

          <p className="mt-2 text-2xl font-bold text-red-600">
            {inventorySummary.out_of_stock.toLocaleString("en-PH")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => openHistory("bad_order")}
          className="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:bg-red-50 hover:shadow-md"
        >
          <p className="text-sm text-gray-500">Bad Orders</p>

          <p className="mt-2 text-2xl font-bold text-red-600">
            {formatQuantity(inventorySummary.bad_orders)}
          </p>
        </button>

        <button
          type="button"
          onClick={() => openHistory("adjustment")}
          className="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:bg-gray-50 hover:shadow-md"
        >
          <p className="text-sm text-gray-500">Adjustments</p>

          <p className="mt-2 text-2xl font-bold text-gray-600">
            {inventorySummary.adjustments.toLocaleString("en-PH")}
          </p>
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product, SKU or barcode..."
          className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500 md:w-96"
        />

        <select
          value={stockFilter}
          onChange={(e) =>
            setStockFilter(
              e.target.value as
                | "all"
                | "in_stock"
                | "low_stock"
                | "out_of_stock",
            )
          }
          className="rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">All Stock</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>

        {(search || stockFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStockFilter("all");
            }}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear Filters
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        {loading ? (
          <div className="p-6 text-center text-gray-500">
            Loading inventory...
          </div>
        ) : inventory.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No inventory items found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Product
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    SKU
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Barcode
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-gray-600">
                    Unit
                  </th>

                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Stock
                  </th>

                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Minimum
                  </th>

                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Cost
                  </th>

                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Stock Value
                  </th>

                  <th className="px-4 py-3 text-right font-semibold text-gray-600">
                    Selling Price
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-gray-600">
                    Status
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {inventory.map((product) => {
                  const stockStatus = getStockStatus(product);

                  return (
                    <tr
                      key={product.product_id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">
                          {product.name}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {product.sku || "—"}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {product.barcode || "—"}
                      </td>

                      <td className="px-4 py-3 text-center text-gray-600">
                        {product.unit}
                      </td>

                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        {formatQuantity(product.stock)}
                      </td>

                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatQuantity(product.minimum_stock)}
                      </td>

                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatCurrency(product.cost)}
                      </td>

                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        {formatCurrency(product.stock_value)}
                      </td>

                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        {formatCurrency(product.selling_price)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${stockStatus.className}`}
                        >
                          {stockStatus.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openProductDetails(product)}
                            className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => openAdjustmentModal(product)}
                            className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              {total > 0
                ? `Showing ${from}–${to} of ${total} products`
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
                className="h-9 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inventory History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {historyType === "bad_order"
                    ? "Bad Order History"
                    : "Adjustment History"}
                </h2>

                <p className="text-sm text-gray-500">
                  {historyType === "bad_order"
                    ? "Inventory transactions recorded as bad orders."
                    : "Inventory transactions recorded as manual adjustments."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeHistory}
                disabled={historyLoading}
                className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {historyError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {historyError}
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border">
                {historyLoading ? (
                  <div className="p-6 text-center text-gray-500">
                    Loading history...
                  </div>
                ) : historyTransactions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No inventory history found.
                  </div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">
                          Date
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-gray-600">
                          Product
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-gray-600">
                          SKU
                        </th>

                        <th className="px-4 py-3 text-center font-semibold text-gray-600">
                          Type
                        </th>

                        <th className="px-4 py-3 text-right font-semibold text-gray-600">
                          Qty
                        </th>

                        <th className="px-4 py-3 text-right font-semibold text-gray-600">
                          Unit Cost
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-gray-600">
                          Reference
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-gray-600">
                          Notes
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {historyTransactions.map((transaction) => {
                        const quantity = Number(transaction.quantity);

                        const quantityClass =
                          historyType === "bad_order"
                            ? "text-red-600"
                            : quantity < 0
                              ? "text-red-600"
                              : "text-green-600";

                        const quantityPrefix =
                          historyType === "bad_order"
                            ? "-"
                            : quantity > 0
                              ? "+"
                              : quantity < 0
                                ? "-"
                                : "";

                        return (
                          <tr
                            key={transaction.id}
                            className="border-b last:border-b-0"
                          >
                            <td className="px-4 py-3 text-gray-600">
                              {formatDate(transaction.created_at)}
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-800">
                                {transaction.product?.name || "—"}
                              </div>
                            </td>

                            <td className="px-4 py-3 text-gray-600">
                              {transaction.product?.sku || "—"}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getTransactionClass(
                                  transaction.type,
                                )}`}
                              >
                                {getTransactionLabel(transaction.type)}
                              </span>
                            </td>

                            <td
                              className={`px-4 py-3 text-right font-medium ${quantityClass}`}
                            >
                              {quantityPrefix}
                              {formatQuantity(Math.abs(quantity))}
                            </td>

                            <td className="px-4 py-3 text-right text-gray-600">
                              {transaction.unit_cost == null
                                ? "—"
                                : formatCurrency(transaction.unit_cost)}
                            </td>

                            <td className="px-4 py-3 text-gray-600">
                              {formatReference(transaction)}
                            </td>

                            <td className="px-4 py-3 text-gray-600">
                              {transaction.notes || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* History Pagination */}
              {!historyLoading && historyLastPage > 1 && (
                <div className="flex items-center justify-between border-t px-1 py-3">
                  <div className="text-sm text-gray-500">
                    {historyTotal} transaction
                    {historyTotal !== 1 ? "s" : ""}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={historyPage <= 1}
                      onClick={() => {
                        if (!historyType) {
                          return;
                        }

                        const nextPage = historyPage - 1;

                        setHistoryPage(nextPage);

                        loadHistory(historyType, nextPage);
                      }}
                      className="rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
                    >
                      Previous
                    </button>

                    <span className="text-sm text-gray-600">
                      Page {historyPage} of {historyLastPage}
                    </span>

                    <button
                      type="button"
                      disabled={historyPage >= historyLastPage}
                      onClick={() => {
                        if (!historyType) {
                          return;
                        }

                        const nextPage = historyPage + 1;

                        setHistoryPage(nextPage);

                        loadHistory(historyType, nextPage);
                      }}
                      className="rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t px-6 py-4">
              <button
                type="button"
                onClick={closeHistory}
                disabled={historyLoading}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Details / Transaction History Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Inventory Details
                </h2>

                <p className="text-sm text-gray-500">{selectedProduct.name}</p>
              </div>

              <button
                type="button"
                onClick={closeProductDetails}
                className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Product Information */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500">Product</p>

                  <p className="font-medium text-gray-800">
                    {selectedProduct.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">SKU</p>

                  <p className="font-medium text-gray-800">
                    {selectedProduct.sku || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Current Stock</p>

                  <p className="font-medium text-gray-800">
                    {formatQuantity(selectedProduct.stock)}{" "}
                    {selectedProduct.unit}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Status</p>

                  <span
                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      getStockStatus(selectedProduct).className
                    }`}
                  >
                    {getStockStatus(selectedProduct).label}
                  </span>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">
                      Transaction History
                    </h3>

                    <p className="text-xs text-gray-500">
                      Inventory movements for this product.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      loadTransactions(
                        selectedProduct.product_id,
                        transactionPage,
                      )
                    }
                    disabled={transactionsLoading}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {transactionsLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {transactionsError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {transactionsError}
                  </div>
                )}

                <div className="overflow-x-auto rounded-lg border">
                  {transactionsLoading ? (
                    <div className="p-6 text-center text-gray-500">
                      Loading transactions...
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No inventory transactions found.
                    </div>
                  ) : (
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">
                            Date
                          </th>

                          <th className="px-4 py-3 text-center font-semibold text-gray-600">
                            Type
                          </th>

                          <th className="px-4 py-3 text-right font-semibold text-gray-600">
                            Qty
                          </th>

                          <th className="px-4 py-3 text-right font-semibold text-gray-600">
                            Unit Cost
                          </th>

                          <th className="px-4 py-3 text-left font-semibold text-gray-600">
                            Reference
                          </th>

                          <th className="px-4 py-3 text-left font-semibold text-gray-600">
                            Notes
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {transactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="border-b last:border-b-0"
                          >
                            <td className="px-4 py-3 text-gray-600">
                              {formatDate(transaction.created_at)}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getTransactionClass(
                                  transaction.type,
                                )}`}
                              >
                                {getTransactionLabel(transaction.type)}
                              </span>
                            </td>

                            <td
                              className={`px-4 py-3 text-right font-medium ${getTransactionQuantityClass(
                                transaction.type,
                              )}`}
                            >
                              {["purchase", "refund"].includes(transaction.type)
                                ? "+"
                                : ["sale", "bad_order"].includes(
                                      transaction.type,
                                    )
                                  ? "-"
                                  : ""}
                              {formatQuantity(
                                Math.abs(Number(transaction.quantity)),
                              )}
                            </td>

                            <td className="px-4 py-3 text-right text-gray-600">
                              {transaction.unit_cost == null
                                ? "—"
                                : formatCurrency(transaction.unit_cost)}
                            </td>

                            <td className="px-4 py-3 text-gray-600">
                              {formatReference(transaction)}
                            </td>

                            <td className="px-4 py-3 text-gray-600">
                              {transaction.notes || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Transaction Pagination */}
                {!transactionsLoading && transactionLastPage > 1 && (
                  <div className="flex items-center justify-between border-t px-1 py-3">
                    <div className="text-sm text-gray-500">
                      {transactionTotal} transaction
                      {transactionTotal !== 1 ? "s" : ""}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={transactionPage <= 1}
                        onClick={() => {
                          const nextPage = transactionPage - 1;

                          setTransactionPage(nextPage);

                          loadTransactions(
                            selectedProduct.product_id,
                            nextPage,
                          );
                        }}
                        className="rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50"
                      >
                        Previous
                      </button>

                      <span className="text-sm text-gray-600">
                        Page {transactionPage} of {transactionLastPage}
                      </span>

                      <button
                        type="button"
                        disabled={transactionPage >= transactionLastPage}
                        onClick={() => {
                          const nextPage = transactionPage + 1;

                          setTransactionPage(nextPage);

                          loadTransactions(
                            selectedProduct.product_id,
                            nextPage,
                          );
                        }}
                        className="rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t px-6 py-4">
              <button
                type="button"
                onClick={closeProductDetails}
                disabled={transactionsLoading}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Inventory Modal */}
      {adjustmentModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Adjust Inventory
                </h2>

                <p className="text-sm text-gray-500">
                  Record a bad order or manual stock adjustment.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAdjustmentModal}
                disabled={adjustmentLoading}
                className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              {adjustmentError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {adjustmentError}
                </div>
              )}

              {/* Product */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Product
                </label>

                {adjustmentProduct ? (
                  <div>
                    <div className="rounded-lg border bg-gray-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-gray-800">
                            {adjustmentProduct.name}
                          </div>

                          <div className="mt-1 text-xs text-gray-500">
                            SKU: {adjustmentProduct.sku || "—"}
                          </div>

                          <div className="mt-1 text-xs text-gray-500">
                            Barcode: {adjustmentProduct.barcode || "—"}
                          </div>

                          <div className="mt-1 text-xs text-gray-500">
                            Current Stock:{" "}
                            <span className="font-medium text-gray-700">
                              {formatQuantity(adjustmentProduct.stock)}{" "}
                              {adjustmentProduct.unit}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setAdjustmentProduct(null);
                            setAdjustmentProductSearch("");
                            setAdjustmentError("");
                          }}
                          disabled={adjustmentLoading}
                          className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={adjustmentProductSearch}
                      onChange={(e) => {
                        setAdjustmentProductSearch(e.target.value);
                        setAdjustmentError("");
                      }}
                      disabled={adjustmentLoading}
                      autoFocus
                      placeholder="Search product, SKU or barcode..."
                      className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                    />

                    {adjustmentProductSearch.trim() && (
                      <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border bg-white shadow-lg">
                        {adjustmentProductResults.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            No products found.
                          </div>
                        ) : (
                          adjustmentProductResults.map((product) => (
                            <button
                              key={product.product_id}
                              type="button"
                              onClick={() => selectAdjustmentProduct(product)}
                              className="block w-full border-b px-4 py-3 text-left last:border-b-0 hover:bg-gray-50"
                            >
                              <div className="font-medium text-gray-800">
                                {product.name}
                              </div>

                              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                <span>SKU: {product.sku || "—"}</span>

                                <span>Barcode: {product.barcode || "—"}</span>

                                <span>
                                  Stock: {formatQuantity(product.stock)}{" "}
                                  {product.unit}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!adjustmentProduct && !adjustmentProductSearch.trim() && (
                  <p className="mt-1 text-xs text-gray-500">
                    Search by product name, SKU, or barcode.
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Type
                </label>

                <select
                  value={adjustmentType}
                  onChange={(e) =>
                    setAdjustmentType(
                      e.target.value as "adjustment" | "bad_order",
                    )
                  }
                  disabled={adjustmentLoading}
                  className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="bad_order">Bad Order</option>
                  <option value="adjustment">Adjustment</option>
                </select>

                <p className="mt-1 text-xs text-gray-500">
                  {adjustmentType === "bad_order"
                    ? "Bad Order will deduct the quantity from current stock."
                    : "Adjustment can increase or decrease stock."}
                </p>
              </div>

              {/* Direction */}
              {adjustmentType === "adjustment" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Direction
                  </label>

                  <select
                    value={adjustmentDirection}
                    onChange={(e) =>
                      setAdjustmentDirection(
                        e.target.value as "increase" | "decrease",
                      )
                    }
                    disabled={adjustmentLoading}
                    className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="increase">Increase</option>
                    <option value="decrease">Decrease</option>
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Quantity
                </label>

                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                  disabled={adjustmentLoading}
                  placeholder="Enter quantity"
                  className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                />

                {adjustmentProduct && (
                  <p className="mt-1 text-xs text-gray-500">
                    Current Stock: {formatQuantity(adjustmentProduct.stock)}{" "}
                    {adjustmentProduct.unit}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Reason / Notes
                </label>

                <textarea
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  disabled={adjustmentLoading}
                  rows={4}
                  maxLength={1000}
                  placeholder="Enter reason or notes..."
                  className="w-full resize-none rounded-lg border px-4 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <button
                type="button"
                onClick={closeAdjustmentModal}
                disabled={adjustmentLoading}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAdjustmentSubmit}
                disabled={adjustmentLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adjustmentLoading ? "Saving..." : "Save Adjustment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
