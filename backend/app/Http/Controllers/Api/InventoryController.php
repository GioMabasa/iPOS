<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;

class InventoryController extends Controller
{
    public function index(
        InventoryService $inventoryService
    ): JsonResponse {
        $products = Product::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $data = $products->map(function (Product $product) use (
            $inventoryService
        ) {
            $stock = $inventoryService->getCurrentStock($product);

            return [
                'product_id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'unit' => $product->unit,
                'cost_price' => (float) $product->cost_price,
                'selling_price' => (float) $product->selling_price,
                'stock' => $stock,
                'minimum_stock' => (float) $product->minimum_stock,
                'is_low_stock' => $stock <= (float) $product->minimum_stock,
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    public function show(
        Product $product,
        InventoryService $inventoryService
    ): JsonResponse {
        $stock = $inventoryService->getCurrentStock($product);

        return response()->json([
            'data' => [
                'product_id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'unit' => $product->unit,
                'cost_price' => (float) $product->cost_price,
                'selling_price' => (float) $product->selling_price,
                'stock' => $stock,
                'minimum_stock' => (float) $product->minimum_stock,
                'is_low_stock' => $stock <= (float) $product->minimum_stock,
            ],
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
