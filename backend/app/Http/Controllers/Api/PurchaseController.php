<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseController extends Controller
{
    //
    public function store(Request $request, InventoryService $inventoryService)
    {
        $validated = $request->validate([
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'purchase_date' => ['required', 'date'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],

            'items' => ['required', 'array', 'min:1'],

            'items.*.product_id' => [
                'required',
                'exists:products,id',
            ],

            'items.*.quantity' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'items.*.unit_cost' => [
                'required',
                'numeric',
                'gte:0',
            ],
        ]);

        $purchase = DB::transaction(function () use (
            $validated,
            $inventoryService
        ) {
            $subtotal = 0;

            foreach ($validated['items'] as $item) {
                $subtotal +=
                    $item['quantity'] * $item['unit_cost'];
            }

            $discount = $validated['discount'] ?? 0;
            $tax = $validated['tax'] ?? 0;

            $total = $subtotal - $discount + $tax;

            $purchase = Purchase::create([
                'supplier_id' => $validated['supplier_id'],
                'purchase_number' => $this->generatePurchaseNumber(),
                'purchase_date' => $validated['purchase_date'],
                'reference_number' => $validated['reference_number'] ?? null,
                'status' => 'received',
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'total' => $total,
                'notes' => $validated['notes'] ?? null,
                'received_by' => auth()->id(),
            ]);

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);

                $lineTotal =
                    $item['quantity'] * $item['unit_cost'];

                $purchaseItem = $purchase->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'total' => $lineTotal,
                ]);

                $inventoryService->receiveStock(
                    $product,
                    $item['quantity'],
                    $item['unit_cost'],
                    'purchase',
                    $purchase->id,
                    auth()->id(),
                    "Purchase {$purchase->purchase_number}"
                );
            }

            return $purchase;
        });

        return response()->json([
            'message' => 'Purchase received successfully.',
            'data' => $purchase->load([
                'supplier',
                'items.product',
            ]),
        ], 201);
    }

    private function generatePurchaseNumber(): string
    {
        $nextId = (Purchase::max('id') ?? 0) + 1;

        return 'PO-' . str_pad(
            $nextId,
            6,
            '0',
            STR_PAD_LEFT
        );
    }
}
