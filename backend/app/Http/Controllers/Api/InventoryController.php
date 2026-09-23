<?php

namespace App\Http\Controllers\Api;

use App\Exports\InventoryExport;
use App\Http\Controllers\Controller;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\SaleItemCost;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class InventoryController extends Controller
{
    public function index(
        Request $request,
        InventoryService $inventoryService
    ): JsonResponse {
        $validated = $request->validate([
            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
            'search' => [
                'nullable',
                'string',
                'max:255',
            ],
            'stock_filter' => [
                'nullable',
                'in:all,in_stock,low_stock,out_of_stock',
            ],
            'product_status' => [
                'nullable',
                'in:all,active,inactive',
            ],
            'supplier_id' => [
                'nullable',
                'integer',
                'exists:suppliers,id',
            ],
        ]);

        $page = $validated['page'] ?? 1;
        $perPage = $validated['per_page'] ?? 20;
        $search = trim($validated['search'] ?? '');
        $stockFilter = $validated['stock_filter'] ?? 'all';
        $productStatus = $validated['product_status'] ?? 'all';
        $supplierId = $validated['supplier_id'] ?? null;

        /*
        |--------------------------------------------------------------------------
        | Get Products
        |--------------------------------------------------------------------------
        |
        | Search, supplier, and product status are database-level filters.
        | This prevents unnecessary products from being loaded.
        |
        */

        $productQuery = Product::query()
            ->with('suppliers')
            ->orderBy('name');

        if ($search !== '') {
            $productQuery->where(function ($query) use ($search) {
                $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($productStatus === 'active') {
            $productQuery->where('is_active', true);
        } elseif ($productStatus === 'inactive') {
            $productQuery->where('is_active', false);
        }

        if ($supplierId !== null) {
            $productQuery->whereHas('suppliers', function ($query) use ($supplierId) {
                $query->where('suppliers.id', $supplierId);
            });
        }

        $products = $productQuery->get();

        if ($products->isEmpty()) {
            $badOrders = InventoryTransaction::query()
                ->where('type', 'bad_order')
                ->sum('quantity');

            $adjustments = InventoryTransaction::query()
                ->where('type', 'adjustment')
                ->count();

            return response()->json([
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $perPage,
                'total' => 0,
                'from' => null,
                'to' => null,
                'summary' => [
                    'total_products' => 0,
                    'total_stock' => 0,
                    'low_stock' => 0,
                    'out_of_stock' => 0,
                    'bad_orders' => (float) $badOrders,
                    'adjustments' => $adjustments,
                ],
            ]);
        }

        $productIds = $products
            ->pluck('id')
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Get Current Stock In One Query
        |--------------------------------------------------------------------------
        |
        | Instead of calling InventoryService::getCurrentStock() once per
        | product, calculate stock for all products with one grouped query.
        |
        */

        $stockByProduct = InventoryTransaction::query()
            ->whereIn('product_id', $productIds)
            ->select('product_id')
            ->selectRaw("
                COALESCE(SUM(
                    CASE
                        WHEN type IN ('purchase', 'refund') THEN quantity
                        WHEN type IN ('sale', 'bad_order') THEN -quantity
                        WHEN type = 'adjustment' THEN quantity
                        ELSE 0
                    END
                ), 0) AS stock
            ")
            ->groupBy('product_id')
            ->pluck('stock', 'product_id')
            ->map(fn($stock) => (float) $stock);

        /*
        |--------------------------------------------------------------------------
        | Get Purchase Transactions In Bulk
        |--------------------------------------------------------------------------
        |
        | These are the FIFO inventory layers used to calculate current cost
        | and stock value.
        |
        */

        $purchaseTransactions = InventoryTransaction::query()
            ->whereIn('product_id', $productIds)
            ->where('type', 'purchase')
            ->orderBy('product_id')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get([
                'id',
                'product_id',
                'quantity',
                'unit_cost',
                'created_at',
            ]);

        /*
        |--------------------------------------------------------------------------
        | Get Sale Cost Allocations In Bulk
        |--------------------------------------------------------------------------
        |
        | Instead of querying SaleItemCost once for every purchase transaction,
        | load all allocations with one grouped query.
        |
        */

        $allocatedByTransaction = collect();

        if ($purchaseTransactions->isNotEmpty()) {
            $allocatedByTransaction = SaleItemCost::query()
                ->whereIn(
                    'inventory_transaction_id',
                    $purchaseTransactions->pluck('id')
                )
                ->select('inventory_transaction_id')
                ->selectRaw("
                    COALESCE(
                        SUM(quantity - reversed_quantity),
                        0
                    ) AS allocated_quantity
                ")
                ->groupBy('inventory_transaction_id')
                ->pluck(
                    'allocated_quantity',
                    'inventory_transaction_id'
                )
                ->map(fn($quantity) => (float) $quantity);
        }

        /*
        |--------------------------------------------------------------------------
        | Build FIFO Layers By Product
        |--------------------------------------------------------------------------
        */

        $layersByProduct = [];

        foreach ($purchaseTransactions as $transaction) {
            $purchasedQuantity = (float) $transaction->quantity;

            $allocatedQuantity = $allocatedByTransaction->get(
                $transaction->id,
                0.0
            );

            $remainingQuantity = max(
                0,
                $purchasedQuantity - $allocatedQuantity
            );

            if ($remainingQuantity <= 0) {
                continue;
            }

            $layersByProduct[$transaction->product_id][] = [
                'quantity' => $remainingQuantity,
                'unit_cost' => (float) $transaction->unit_cost,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Build Inventory Data
        |--------------------------------------------------------------------------
        */

        $data = $products
            ->map(function (Product $product) use (
                $stockByProduct,
                $layersByProduct
            ) {
                $stock = $stockByProduct->get(
                    $product->id,
                    0.0
                );

                $minimumStock = (float) $product->minimum_stock;

                $remainingStock = max(0, $stock);
                $inventoryValue = 0.0;

                $layers = $layersByProduct[$product->id] ?? [];

                foreach ($layers as $layer) {
                    if ($remainingStock <= 0) {
                        break;
                    }

                    $layerQuantity = min(
                        $remainingStock,
                        $layer['quantity']
                    );

                    $inventoryValue += round(
                        $layerQuantity * $layer['unit_cost'],
                        2
                    );

                    $remainingStock -= $layerQuantity;
                }

                $cost = $stock > 0
                    ? round($inventoryValue / $stock, 2)
                    : 0.0;

                $supplierNames = $product->suppliers
                    ->pluck('name')
                    ->filter()
                    ->implode(', ');

                return [
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'supplier' => $supplierNames,
                    'unit' => $product->unit,
                    'cost' => $cost,
                    'selling_price' => (float) $product->selling_price,
                    'stock' => $stock,
                    'stock_value' => round($inventoryValue, 2),
                    'minimum_stock' => $minimumStock,
                    'is_low_stock' => $stock <= $minimumStock,
                    'is_active' => (bool) $product->is_active,
                ];
            });

        /*
        |--------------------------------------------------------------------------
        | Stock Filter
        |--------------------------------------------------------------------------
        */

        $data = $data->filter(function (array $product) use (
            $stockFilter
        ) {
            $stock = (float) $product['stock'];

            return match ($stockFilter) {
                'in_stock' =>
                $stock > 0 && !$product['is_low_stock'],

                'low_stock' =>
                $product['is_low_stock'] && $stock > 0,

                'out_of_stock' =>
                $stock <= 0,

                default =>
                true,
            };
        })->values();

        /*
        |--------------------------------------------------------------------------
        | Inventory Summary
        |--------------------------------------------------------------------------
        */

        $badOrders = InventoryTransaction::query()
            ->where('type', 'bad_order')
            ->sum('quantity');

        $adjustments = InventoryTransaction::query()
            ->where('type', 'adjustment')
            ->count();

        $total = $data->count();

        $lastPage = max(
            1,
            (int) ceil($total / $perPage)
        );

        $currentPage = min(
            $page,
            $lastPage
        );

        $offset = ($currentPage - 1) * $perPage;

        $paginatedData = $data
            ->slice($offset, $perPage)
            ->values();

        $from = $total > 0
            ? $offset + 1
            : null;

        $to = $total > 0
            ? min($offset + $perPage, $total)
            : null;

        return response()->json([
            'data' => $paginatedData,
            'current_page' => $currentPage,
            'last_page' => $lastPage,
            'per_page' => $perPage,
            'total' => $total,
            'from' => $from,
            'to' => $to,
            'summary' => [
                'total_products' => $data->count(),
                'total_stock' => $data->sum('stock'),
                'low_stock' => $data
                    ->where('is_low_stock', true)
                    ->count(),
                'out_of_stock' => $data
                    ->where('stock', '<=', 0)
                    ->count(),
                'bad_orders' => (float) $badOrders,
                'adjustments' => $adjustments,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Export Inventory
    |--------------------------------------------------------------------------
    */

    public function export(
        Request $request
    ) {
        $validated = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:255',
            ],
            'stock_filter' => [
                'nullable',
                'in:all,in_stock,low_stock,out_of_stock',
            ],
            'product_status' => [
                'nullable',
                'in:all,active,inactive',
            ],
            'supplier_id' => [
                'nullable',
                'integer',
                'exists:suppliers,id',
            ],
        ]);

        $search = trim($validated['search'] ?? '');
        $stockFilter = $validated['stock_filter'] ?? 'all';
        $productStatus = $validated['product_status'] ?? 'all';
        $supplierId = $validated['supplier_id'] ?? null;

        /*
        |--------------------------------------------------------------------------
        | Get Products
        |--------------------------------------------------------------------------
        */

        $productQuery = Product::query()
            ->with('suppliers')
            ->orderBy('name');

        if ($search !== '') {
            $productQuery->where(function ($query) use ($search) {
                $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($productStatus === 'active') {
            $productQuery->where('is_active', true);
        } elseif ($productStatus === 'inactive') {
            $productQuery->where('is_active', false);
        }

        if ($supplierId !== null) {
            $productQuery->whereHas('suppliers', function ($query) use ($supplierId) {
                $query->where('suppliers.id', $supplierId);
            });
        }

        $products = $productQuery->get();

        if ($products->isEmpty()) {
            return Excel::download(
                new InventoryExport(collect()),
                'inventory-' . now()->format('Y-m-d') . '.xlsx'
            );
        }

        $productIds = $products
            ->pluck('id')
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Get Current Stock
        |--------------------------------------------------------------------------
        */

        $stockByProduct = InventoryTransaction::query()
            ->whereIn('product_id', $productIds)
            ->select('product_id')
            ->selectRaw("
                COALESCE(SUM(
                    CASE
                        WHEN type IN ('purchase', 'refund') THEN quantity
                        WHEN type IN ('sale', 'bad_order') THEN -quantity
                        WHEN type = 'adjustment' THEN quantity
                        ELSE 0
                    END
                ), 0) AS stock
            ")
            ->groupBy('product_id')
            ->pluck('stock', 'product_id')
            ->map(fn($stock) => (float) $stock);

        /*
        |--------------------------------------------------------------------------
        | Get Purchase Transactions
        |--------------------------------------------------------------------------
        */

        $purchaseTransactions = InventoryTransaction::query()
            ->whereIn('product_id', $productIds)
            ->where('type', 'purchase')
            ->orderBy('product_id')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get([
                'id',
                'product_id',
                'quantity',
                'unit_cost',
                'created_at',
            ]);

        /*
        |--------------------------------------------------------------------------
        | Get Sale Cost Allocations
        |--------------------------------------------------------------------------
        */

        $allocatedByTransaction = collect();

        if ($purchaseTransactions->isNotEmpty()) {
            $allocatedByTransaction = SaleItemCost::query()
                ->whereIn(
                    'inventory_transaction_id',
                    $purchaseTransactions->pluck('id')
                )
                ->select('inventory_transaction_id')
                ->selectRaw("
                    COALESCE(
                        SUM(quantity - reversed_quantity),
                        0
                    ) AS allocated_quantity
                ")
                ->groupBy('inventory_transaction_id')
                ->pluck(
                    'allocated_quantity',
                    'inventory_transaction_id'
                )
                ->map(fn($quantity) => (float) $quantity);
        }

        /*
        |--------------------------------------------------------------------------
        | Build FIFO Layers
        |--------------------------------------------------------------------------
        */

        $layersByProduct = [];

        foreach ($purchaseTransactions as $transaction) {
            $purchasedQuantity = (float) $transaction->quantity;

            $allocatedQuantity = $allocatedByTransaction->get(
                $transaction->id,
                0.0
            );

            $remainingQuantity = max(
                0,
                $purchasedQuantity - $allocatedQuantity
            );

            if ($remainingQuantity <= 0) {
                continue;
            }

            $layersByProduct[$transaction->product_id][] = [
                'quantity' => $remainingQuantity,
                'unit_cost' => (float) $transaction->unit_cost,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Build Export Data
        |--------------------------------------------------------------------------
        */

        $data = $products
            ->map(function (Product $product) use (
                $stockByProduct,
                $layersByProduct
            ) {
                $stock = $stockByProduct->get(
                    $product->id,
                    0.0
                );

                $minimumStock = (float) $product->minimum_stock;

                $remainingStock = max(0, $stock);
                $inventoryValue = 0.0;

                $layers = $layersByProduct[$product->id] ?? [];

                foreach ($layers as $layer) {
                    if ($remainingStock <= 0) {
                        break;
                    }

                    $layerQuantity = min(
                        $remainingStock,
                        $layer['quantity']
                    );

                    $inventoryValue += round(
                        $layerQuantity * $layer['unit_cost'],
                        2
                    );

                    $remainingStock -= $layerQuantity;
                }

                $cost = $stock > 0
                    ? round($inventoryValue / $stock, 2)
                    : 0.0;

                $stockStatus = $stock <= 0
                    ? 'Out of Stock'
                    : (
                        $stock <= $minimumStock
                        ? 'Low Stock'
                        : 'In Stock'
                    );

                $productStatus = $product->is_active
                    ? 'Active'
                    : 'Inactive';

                $supplierNames = $product->suppliers
                    ->pluck('name')
                    ->filter()
                    ->implode(', ');

                return [
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'unit' => $product->unit,
                    'supplier' => $supplierNames,
                    'stock' => $stock,
                    'minimum_stock' => $minimumStock,
                    'cost' => $cost,
                    'stock_value' => round($inventoryValue, 2),
                    'selling_price' => (float) $product->selling_price,
                    'stock_status' => $stockStatus,
                    'product_status' => $productStatus,
                ];
            });

        /*
        |--------------------------------------------------------------------------
        | Stock Filter
        |--------------------------------------------------------------------------
        */

        $data = $data->filter(function (array $product) use (
            $stockFilter
        ) {
            $stock = (float) $product['stock'];

            return match ($stockFilter) {
                'in_stock' =>
                $stock > 0 &&
                    $product['stock_status'] === 'In Stock',

                'low_stock' =>
                $product['stock_status'] === 'Low Stock' &&
                    $stock > 0,

                'out_of_stock' =>
                $stock <= 0,

                default =>
                true,
            };
        })->values();

        /*
        |--------------------------------------------------------------------------
        | Download Excel File
        |--------------------------------------------------------------------------
        */

        return Excel::download(
            new InventoryExport($data),
            'inventory-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    public function updateStatus(
        Request $request,
        Product $product
    ): JsonResponse {
        $validated = $request->validate([
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $product->update([
            'is_active' => $validated['is_active'],
        ]);

        return response()->json([
            'message' => $product->is_active
                ? 'Product activated successfully.'
                : 'Product deactivated successfully.',
            'data' => [
                'product_id' => $product->id,
                'is_active' => (bool) $product->is_active,
            ],
        ]);
    }

    public function show(
        Product $product,
        InventoryService $inventoryService
    ): JsonResponse {
        $stock = $inventoryService->getCurrentStock($product);

        $purchaseTransactions = InventoryTransaction::query()
            ->where('product_id', $product->id)
            ->where('type', 'purchase')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        $allocatedByTransaction = collect();

        if ($purchaseTransactions->isNotEmpty()) {
            $allocatedByTransaction = SaleItemCost::query()
                ->whereIn(
                    'inventory_transaction_id',
                    $purchaseTransactions->pluck('id')
                )
                ->select('inventory_transaction_id')
                ->selectRaw("
                    COALESCE(
                        SUM(quantity - reversed_quantity),
                        0
                    ) AS allocated_quantity
                ")
                ->groupBy('inventory_transaction_id')
                ->pluck(
                    'allocated_quantity',
                    'inventory_transaction_id'
                )
                ->map(fn($quantity) => (float) $quantity);
        }

        $remainingLayers = [];

        foreach ($purchaseTransactions as $transaction) {
            $purchasedQuantity = (float) $transaction->quantity;

            $allocatedQuantity = $allocatedByTransaction->get(
                $transaction->id,
                0.0
            );

            $remainingQuantity = max(
                0,
                $purchasedQuantity - $allocatedQuantity
            );

            if ($remainingQuantity <= 0) {
                continue;
            }

            $remainingLayers[] = [
                'quantity' => $remainingQuantity,
                'unit_cost' => (float) $transaction->unit_cost,
            ];
        }

        $remainingStock = max(0, $stock);
        $inventoryValue = 0.0;

        foreach ($remainingLayers as $layer) {
            if ($remainingStock <= 0) {
                break;
            }

            $layerQuantity = min(
                $remainingStock,
                $layer['quantity']
            );

            $inventoryValue += round(
                $layerQuantity * $layer['unit_cost'],
                2
            );

            $remainingStock -= $layerQuantity;
        }

        $cost = $stock > 0
            ? round($inventoryValue / $stock, 2)
            : 0.0;

        return response()->json([
            'data' => [
                'product_id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'unit' => $product->unit,
                'cost' => $cost,
                'selling_price' => (float) $product->selling_price,
                'stock' => $stock,
                'stock_value' => round($inventoryValue, 2),
                'minimum_stock' => (float) $product->minimum_stock,
                'is_low_stock' => $stock <= (float) $product->minimum_stock,
                'is_active' => (bool) $product->is_active,
            ],
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => [
                'required',
                'in:bad_order,adjustment',
            ],
        ]);

        $transactions = InventoryTransaction::query()
            ->with('product')
            ->where('type', $validated['type'])
            ->latest('id')
            ->paginate(20);

        return response()->json([
            'data' => $transactions,
        ]);
    }

    public function transactions(
        Product $product
    ): JsonResponse {
        $transactions = $product->inventoryTransactions()
            ->latest('id')
            ->paginate(20);

        return response()->json([
            'data' => $transactions,
        ]);
    }
}
