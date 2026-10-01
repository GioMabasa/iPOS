<?php

namespace App\Http\Controllers\Api;

use App\Exports\InventoryExport;
use App\Http\Controllers\Controller;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\SaleItemCost;
use App\Services\InventoryService;
use App\Services\InventoryCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Models\PurchaseItem;
use App\Models\Purchase;

class InventoryController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Shared Inventory Product Query
    |--------------------------------------------------------------------------
    |
    | This is the shared source for:
    | - Inventory page
    | - Inventory export
    | - Future inventory print
    |
    | Search, product status, supplier, and ordering are kept in one place
    | so these outputs use the same product filtering logic.
    |
    */

    private function buildInventoryProductQuery(
        string $search,
        string $productStatus,
        ?int $supplierId
    ) {
        $productQuery = Product::query()
            ->with('suppliers')
            ->orderBy('name')
            ->orderBy('id');

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

        return $productQuery;
    }

    public function index(
        Request $request,
        InventoryService $inventoryService,
        InventoryCalculationService $inventoryCalculationService
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
        | Search, supplier, product status, and ordering are handled by the
        | shared inventory product query.
        |
        */

        $productQuery = $this->buildInventoryProductQuery(
            $search,
            $productStatus,
            $supplierId
        );

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

        /*
        |--------------------------------------------------------------------------
        | Calculate Inventory Data
        |--------------------------------------------------------------------------
        |
        | InventoryCalculationService is the shared source of truth
        | for stock, FIFO cost, stock value, and low-stock calculation.
        |
        */

        $data = $inventoryCalculationService
            ->calculate($products);

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
                    !$product['is_low_stock'],

                'low_stock' =>
                $product['is_low_stock'] &&
                    $stock > 0,

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
    | Print Inventory
    |--------------------------------------------------------------------------
    |
    | Dedicated endpoint for Inventory A4 printing.
    |
    | Uses the same inventory product query and inventory calculation logic
    | as the Inventory page and Export.
    |
    | Important:
    | - No arbitrary per_page=10000
    | - No XLSX/CSV conversion
    | - Same search/filter logic
    | - Same InventoryCalculationService
    | - Returns the complete filtered inventory dataset
    |
    */

    public function print(
        Request $request,
        InventoryCalculationService $inventoryCalculationService
    ): JsonResponse {
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
    | Shared Product Query
    |--------------------------------------------------------------------------
    */

        $productQuery = $this->buildInventoryProductQuery(
            $search,
            $productStatus,
            $supplierId
        );

        $products = $productQuery->get();

        /*
    |--------------------------------------------------------------------------
    | Calculate Inventory
    |--------------------------------------------------------------------------
    */

        $data = $inventoryCalculationService
            ->calculate($products);

        /*
    |--------------------------------------------------------------------------
    | Apply Stock Filter
    |--------------------------------------------------------------------------
    */

        $data = $data->filter(function (array $product) use (
            $stockFilter
        ) {
            $stock = (float) $product['stock'];

            return match ($stockFilter) {
                'in_stock' =>
                $stock > 0 &&
                    !$product['is_low_stock'],

                'low_stock' =>
                $product['is_low_stock'] &&
                    $stock > 0,

                'out_of_stock' =>
                $stock <= 0,

                default =>
                true,
            };
        })->values();

        /*
    |--------------------------------------------------------------------------
    | Summary
    |--------------------------------------------------------------------------
    */

        $badOrders = InventoryTransaction::query()
            ->where('type', 'bad_order')
            ->sum('quantity');

        $adjustments = InventoryTransaction::query()
            ->where('type', 'adjustment')
            ->count();

        /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

        return response()->json([
            'data' => $data,

            'total' => $data->count(),

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
        Request $request,
        InventoryCalculationService $inventoryCalculationService
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
            'format' => [
                'nullable',
                'in:xlsx,csv',
            ],
        ]);

        $search = trim($validated['search'] ?? '');
        $stockFilter = $validated['stock_filter'] ?? 'all';
        $productStatus = $validated['product_status'] ?? 'all';
        $supplierId = $validated['supplier_id'] ?? null;
        $format = $validated['format'] ?? 'xlsx';

        /*
        |--------------------------------------------------------------------------
        | Product Query
        |--------------------------------------------------------------------------
        |
        | Uses the same shared query as the Inventory page.
        |
        */

        $productQuery = $this->buildInventoryProductQuery(
            $search,
            $productStatus,
            $supplierId
        );

        /*
        |--------------------------------------------------------------------------
        | Supplier Label
        |--------------------------------------------------------------------------
        */

        $supplierLabel = 'All Suppliers';

        if ($supplierId !== null) {
            $supplier = \App\Models\Supplier::find($supplierId);

            if ($supplier) {
                $supplierLabel = $supplier->name;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | CSV Export
        |--------------------------------------------------------------------------
        |
        | CSV is intentionally streamed so large exports do not require
        | the complete dataset to remain in memory.
        |
        */

        if ($format === 'csv') {
            $fileName = 'inventory-' . now()->format('Y-m-d') . '.csv';

            return response()->streamDownload(
                function () use (
                    $productQuery,
                    $stockFilter,
                    $inventoryCalculationService
                ) {
                    $handle = fopen('php://output', 'w');

                    if ($handle === false) {
                        return;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | UTF-8 BOM
                    |--------------------------------------------------------------------------
                    |
                    | Helps Microsoft Excel correctly detect UTF-8 CSV files.
                    |
                    */

                    fwrite($handle, "\xEF\xBB\xBF");

                    /*
                    |--------------------------------------------------------------------------
                    | CSV Headings
                    |--------------------------------------------------------------------------
                    */

                    fputcsv($handle, [
                        'Product',
                        'SKU',
                        'Barcode',
                        'Supplier',
                        'Minimum Stock',
                        'Stock',
                        'Unit',
                        'Stock Value',
                        'Cost',
                        'Selling Price',
                        'Stock Status',
                        'Product Status',
                    ]);

                    /*
                    |--------------------------------------------------------------------------
                    | Batch Processing
                    |--------------------------------------------------------------------------
                    */

                    $batchSize = 500;

                    $products = $productQuery
                        ->clone()
                        ->with('suppliers')
                        ->cursor();

                    $productBatch = collect();

                    foreach ($products as $product) {
                        $productBatch->push($product);

                        if ($productBatch->count() < $batchSize) {
                            continue;
                        }

                        $inventoryData = $inventoryCalculationService
                            ->calculate($productBatch);

                        foreach ($inventoryData as $inventory) {
                            $stock = (float) $inventory['stock'];

                            $isLowStock = (bool) $inventory['is_low_stock'];

                            $stockStatus = $stock <= 0
                                ? 'Out of Stock'
                                : (
                                    $isLowStock
                                    ? 'Low Stock'
                                    : 'In Stock'
                                );

                            $include = match ($stockFilter) {
                                'in_stock' =>
                                $stock > 0 &&
                                    !$isLowStock,

                                'low_stock' =>
                                $isLowStock &&
                                    $stock > 0,

                                'out_of_stock' =>
                                $stock <= 0,

                                default =>
                                true,
                            };

                            if (!$include) {
                                continue;
                            }

                            fputcsv($handle, [
                                $inventory['name'],
                                $inventory['sku'],
                                $inventory['barcode'],
                                $inventory['supplier'],
                                $inventory['minimum_stock'],
                                $stock,
                                $inventory['unit'],
                                $inventory['stock_value'],
                                $inventory['cost'],
                                $inventory['selling_price'],
                                $stockStatus,
                                $inventory['is_active']
                                    ? 'Active'
                                    : 'Inactive',
                            ]);
                        }

                        $productBatch = collect();

                        unset($inventoryData);
                        unset($product);
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Remaining Batch
                    |--------------------------------------------------------------------------
                    */

                    if ($productBatch->isNotEmpty()) {
                        $inventoryData = $inventoryCalculationService
                            ->calculate($productBatch);

                        foreach ($inventoryData as $inventory) {
                            $stock = (float) $inventory['stock'];

                            $isLowStock = (bool) $inventory['is_low_stock'];

                            $stockStatus = $stock <= 0
                                ? 'Out of Stock'
                                : (
                                    $isLowStock
                                    ? 'Low Stock'
                                    : 'In Stock'
                                );

                            $include = match ($stockFilter) {
                                'in_stock' =>
                                $stock > 0 &&
                                    !$isLowStock,

                                'low_stock' =>
                                $isLowStock &&
                                    $stock > 0,

                                'out_of_stock' =>
                                $stock <= 0,

                                default =>
                                true,
                            };

                            if (!$include) {
                                continue;
                            }

                            fputcsv($handle, [
                                $inventory['name'],
                                $inventory['sku'],
                                $inventory['barcode'],
                                $inventory['supplier'],
                                $inventory['minimum_stock'],
                                $stock,
                                $inventory['unit'],
                                $inventory['stock_value'],
                                $inventory['cost'],
                                $inventory['selling_price'],
                                $stockStatus,
                                $inventory['is_active']
                                    ? 'Active'
                                    : 'Inactive',
                            ]);
                        }

                        unset($inventoryData);
                        $productBatch = collect();
                    }

                    fclose($handle);
                },
                $fileName,
                [
                    'Content-Type' => 'text/csv; charset=UTF-8',
                    'Content-Disposition' =>
                    'attachment; filename="' . $fileName . '"',
                    'Cache-Control' => 'no-store, no-cache',
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | XLSX Export Preflight
        |--------------------------------------------------------------------------
        |
        | Only the standard XLSX export is subject to the product threshold.
        |
        */

        $exportProductCount = (clone $productQuery)->count();

        $maxExportProducts = (int) config(
            'ipos.inventory_export_max_products',
            10000
        );

        if ($exportProductCount > $maxExportProducts) {
            return response()->json([
                'message' =>
                'The inventory export is too large for the standard XLSX export.',
                'export_type' => 'inventory',
                'product_count' => $exportProductCount,
                'max_xlsx_products' => $maxExportProducts,
                'csv_available' => true,
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | XLSX Export
        |--------------------------------------------------------------------------
        |
        | Existing XLSX export behavior remains unchanged.
        |
        */

        return Excel::download(
            new InventoryExport(
                $productQuery,
                $stockFilter,
                $supplierLabel
            ),
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

        $supplierCostHistory = PurchaseItem::query()
            ->where('product_id', $product->id)
            ->whereHas('purchase', function ($query) {
                $query->where('status', 'received');
            })
            ->with('purchase.supplier')
            ->orderByDesc(
                Purchase::select('purchase_date')
                    ->whereColumn(
                        'purchases.id',
                        'purchase_items.purchase_id'
                    )
            )
            ->orderByDesc('id')
            ->get()
            ->map(function (PurchaseItem $item) {
                return [
                    'supplier' => $item->purchase?->supplier?->name,
                    'cost_price' => (float) $item->unit_cost,
                    'purchase_date' => $item->purchase?->purchase_date?->format('Y-m-d'),
                ];
            })
            ->values();

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
                'supplier_cost_history' => $supplierCostHistory,
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

            'period' => [
                'nullable',
                'in:all,today,yesterday,this_week,this_month,custom',
            ],

            'date_from' => [
                'nullable',
                'date',
            ],

            'date_to' => [
                'nullable',
                'date',
                'after_or_equal:date_from',
            ],

            'search' => [
                'nullable',
                'string',
                'max:255',
            ],

            'direction' => [
                'nullable',
                'in:all,increase,decrease',
            ],
        ]);

        $page = $validated['page'] ?? 1;
        $perPage = $validated['per_page'] ?? 20;

        $type = $validated['type'];

        $period = $validated['period'] ?? 'today';

        $search = trim(
            $validated['search'] ?? ''
        );

        $direction = $validated['direction'] ?? 'all';

        $query = InventoryTransaction::query()
            ->with('product')
            ->where('type', $type);

        /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

        if ($search !== '') {
            $query->where(function ($query) use ($search) {
                $query
                    ->where('notes', 'like', "%{$search}%")
                    ->orWhereHas('product', function ($productQuery) use ($search) {
                        $productQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%")
                            ->orWhere('barcode', 'like', "%{$search}%");
                    });
            });
        }

        /*
    |--------------------------------------------------------------------------
    | Direction
    |--------------------------------------------------------------------------
    |
    | Direction applies only to manual adjustments.
    |
    */

        if (
            $type === 'adjustment' &&
            $direction !== 'all'
        ) {
            if ($direction === 'increase') {
                $query->where('quantity', '>', 0);
            }

            if ($direction === 'decrease') {
                $query->where('quantity', '<', 0);
            }
        }

        /*
    |--------------------------------------------------------------------------
    | Period / Date Filter
    |--------------------------------------------------------------------------
    */

        if ($period !== 'all') {
            $dateFrom = null;
            $dateTo = null;

            switch ($period) {
                case 'today':
                    $dateFrom = now('Asia/Manila')
                        ->startOfDay()
                        ->utc();

                    $dateTo = now('Asia/Manila')
                        ->endOfDay()
                        ->utc();
                    break;

                case 'yesterday':
                    $dateFrom = now('Asia/Manila')
                        ->subDay()
                        ->startOfDay()
                        ->utc();

                    $dateTo = now('Asia/Manila')
                        ->subDay()
                        ->endOfDay()
                        ->utc();
                    break;

                case 'this_week':
                    $dateFrom = now('Asia/Manila')
                        ->startOfWeek()
                        ->utc();

                    $dateTo = now('Asia/Manila')
                        ->endOfDay()
                        ->utc();
                    break;

                case 'this_month':
                    $dateFrom = now('Asia/Manila')
                        ->startOfMonth()
                        ->utc();

                    $dateTo = now('Asia/Manila')
                        ->endOfDay()
                        ->utc();
                    break;

                case 'custom':
                    if (!empty($validated['date_from'])) {
                        $dateFrom = \Carbon\Carbon::parse(
                            $validated['date_from'],
                            'Asia/Manila'
                        )
                            ->startOfDay()
                            ->utc();
                    }

                    if (!empty($validated['date_to'])) {
                        $dateTo = \Carbon\Carbon::parse(
                            $validated['date_to'],
                            'Asia/Manila'
                        )
                            ->endOfDay()
                            ->utc();
                    }
                    break;
            }

            if ($dateFrom) {
                $query->where('created_at', '>=', $dateFrom);
            }

            if ($dateTo) {
                $query->where('created_at', '<=', $dateTo);
            }
        }

        /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

        $transactions = $query
            ->latest('id')
            ->paginate(
                $perPage,
                ['*'],
                'page',
                $page
            );

        return response()->json($transactions);
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
