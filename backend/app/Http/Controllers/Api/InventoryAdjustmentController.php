<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

            'type' => [
                'required',
                'in:adjustment,bad_order',
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
         * Bad Order always removes stock.
         */
        if ($validated['type'] === 'bad_order') {
            $quantity = abs($quantity);

            $inventoryService->ensureSufficientStock(
                $product,
                $quantity
            );
        }

        /*
         * Adjustment can increase or decrease stock.
         * Negative quantity decreases stock.
         */
        if (
            $validated['type'] === 'adjustment' &&
            $quantity < 0
        ) {
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
            $validated['notes'] ?? null,
            $validated['type']
        );

        return response()->json([
            'message' => 'Inventory adjusted successfully.',
            'data' => [
                'transaction' => $transaction,
                'current_stock' => $inventoryService->getCurrentStock(
                    $product
                ),
            ],
        ], 201);
    }
}
