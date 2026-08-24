<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class InventoryAdjustmentController extends Controller
{
    public function store(
        Request $request,
        InventoryService $inventoryService
    ): JsonResponse {
        $validated = $request->validate([
            'product_id' => [
                'required',
                'exists:products,id',
            ],

            'quantity' => [
                'required',
                'numeric',
                'not_in:0',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        $product = Product::findOrFail(
            $validated['product_id']
        );

        $quantity = (float) $validated['quantity'];

        /*
         * Prevent stock from becoming negative.
         */
        if ($quantity < 0) {
            $inventoryService->ensureSufficientStock(
                $product,
                abs($quantity)
            );
        }

        $userId = Auth::id() ?? 1;

        $transaction = $inventoryService->adjustStock(
            $product,
            $quantity,
            $userId,
            $validated['notes'] ?? null
        );

        return response()->json([
            'message' => 'Inventory adjusted successfully.',
            'data' => [
                'transaction' => $transaction,
                'current_stock' => $inventoryService->getCurrentStock($product),
            ],
        ], 201);
    }
}
