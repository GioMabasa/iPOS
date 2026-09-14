<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\SaleItemCost;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        ]);

        $page = $validated['page'] ?? 1;
        $perPage = $validated['per_page'] ?? 20;
        $search = trim($validated['search'] ?? '');
        $stockFilter = $validated['stock_filter'] ?? 'all';
        $productStatus = $validated['product_status'] ?? 'all';

        $products = Product::query()
            ->orderBy('name')
            ->get();

        $data = $products->map(function (Product $product) use (
            $inventoryService
        ) {
            $stock = $inventoryService->getCurrentStock($product);

            $purchaseTransactions = InventoryTransaction::query()
                ->where('product_id', $product->id)
                ->where('type', 'purchase')
                ->orderBy('created_at')
                ->orderBy('id')
                ->get();

            $remainingLayers = [];

            foreach ($purchaseTransactions as $transaction) {
                $purchasedQuantity = (float) $transaction->quantity;

                $allocatedQuantity = (float) SaleItemCost::query()
                    ->where(
                        'inventory_transaction_id',
                        $transaction->id
                    )
                    ->selectRaw(
                        'COALESCE(SUM(quantity - reversed_quantity), 0) AS allocated_quantity'
                    )
                    ->value('allocated_quantity');

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

            return [
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
            ];
        });

        if ($search !== '') {
            $searchValue = strtolower($search);

            $data = $data->filter(function (array $product) use (
                $searchValue
            ) {
                return str_contains(
                    strtolower($product['name']),
                    $searchValue
                )
                    || str_contains(
                        strtolower($product['sku']),
                        $searchValue
                    )
                    || str_contains(
                        strtolower($product['barcode'] ?? ''),
                        $searchValue
                    );
            });
        }

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
        });

        $data = $data->filter(function (array $product) use (
            $productStatus
        ) {
            return match ($productStatus) {
                'active' =>
                $product['is_active'] === true,

                'inactive' =>
                $product['is_active'] === false,

                default =>
                true,
            };
        })->values();

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
                'low_stock' => $data->where('is_low_stock', true)->count(),
                'out_of_stock' => $data->where('stock', '<=', 0)->count(),
                'bad_orders' => (float) $badOrders,
                'adjustments' => $adjustments,
            ],
        ]);
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

        $remainingLayers = [];

        foreach ($purchaseTransactions as $transaction) {
            $purchasedQuantity = (float) $transaction->quantity;

            $allocatedQuantity = (float) SaleItemCost::query()
                ->where(
                    'inventory_transaction_id',
                    $transaction->id
                )
                ->selectRaw(
                    'COALESCE(SUM(quantity - reversed_quantity), 0) AS allocated_quantity'
                )
                ->value('allocated_quantity');

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
