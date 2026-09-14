<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class POSProductController extends Controller
{
    public function index(
        Request $request,
        InventoryService $inventoryService
    ): JsonResponse {
        $validated = $request->validate([
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $perPage = $validated['per_page'] ?? 9;
        $search = trim($validated['search'] ?? '');

        $query = Product::query()
            ->where('is_active', true);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        $products = $query->get();

        $data = $products
            ->map(function (Product $product) use ($inventoryService) {
                $stock = $inventoryService->getCurrentStock($product);
                $minimumStock = (float) $product->minimum_stock;

                if ($stock <= 0) {
                    $stockOrder = 2;
                } elseif ($stock <= $minimumStock) {
                    $stockOrder = 1;
                } else {
                    $stockOrder = 0;
                }

                return [
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'unit' => $product->unit,
                    'selling_price' => (float) $product->selling_price,
                    'stock' => $stock,
                    'minimum_stock' => $minimumStock,
                    'is_low_stock' => $stock <= $minimumStock,
                    '_stock_order' => $stockOrder,
                ];
            })
            ->sort(function ($a, $b) {
                if ($a['_stock_order'] !== $b['_stock_order']) {
                    return $a['_stock_order'] <=> $b['_stock_order'];
                }

                return strcasecmp($a['name'], $b['name']);
            })
            ->values();

        $total = $data->count();
        $currentPage = $validated['page'] ?? 1;
        $offset = ($currentPage - 1) * $perPage;

        $paginatedData = $data
            ->slice($offset, $perPage)
            ->values()
            ->map(function ($item) {
                unset($item['_stock_order']);

                return $item;
            })
            ->values();

        $lastPage = $total > 0
            ? (int) ceil($total / $perPage)
            : 1;

        return response()->json([
            'data' => $paginatedData,
            'current_page' => $currentPage,
            'last_page' => $lastPage,
            'per_page' => $perPage,
            'total' => $total,
            'from' => $total > 0 ? $offset + 1 : null,
            'to' => $total > 0
                ? min($offset + $perPage, $total)
                : null,
        ]);
    }
}
