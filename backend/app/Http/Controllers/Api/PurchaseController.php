<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Purchase;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    /**
     * Display a paginated list of purchases.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min(
            max((int) $request->input('per_page', 20), 1),
            100
        );

        $purchases = Purchase::query()
            ->with('supplier')
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'message' => 'Purchases retrieved successfully.',
            'data' => $purchases->items(),
            'pagination' => [
                'current_page' => $purchases->currentPage(),
                'last_page' => $purchases->lastPage(),
                'per_page' => $purchases->perPage(),
                'total' => $purchases->total(),
                'from' => $purchases->firstItem(),
                'to' => $purchases->lastItem(),
            ],
        ]);
    }

    /**
     * Display the specified purchase.
     */
    public function show(Purchase $purchase): JsonResponse
    {
        $purchase->load([
            'supplier',
            'items.product',
            'receivedBy',
        ]);

        return response()->json([
            'message' => 'Purchase retrieved successfully.',
            'data' => $purchase,
        ]);
    }

    /**
     * Store a newly created purchase and receive inventory.
     */
    public function store(
        Request $request,
        InventoryService $inventoryService
    ): JsonResponse {
        $validated = $request->validate([
            'supplier_id' => [
                'required',
                'exists:suppliers,id',
            ],

            'purchase_date' => [
                'required',
                'date',
            ],

            'reference_number' => [
                'nullable',
                'string',
                'max:100',
            ],

            'discount' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'tax' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'notes' => [
                'nullable',
                'string',
            ],

            'items' => [
                'required',
                'array',
                'min:1',
            ],

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
            $subtotal = collect($validated['items'])
                ->sum(function ($item) {
                    return $item['quantity'] * $item['unit_cost'];
                });

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
                'received_by' => Auth::id(),
            ]);

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail(
                    $item['product_id']
                );

                $lineTotal =
                    $item['quantity'] * $item['unit_cost'];

                $purchase->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'total' => $lineTotal,
                ]);

                /*
                 * Update the current supplier cost for this product.
                 *
                 * purchase_items.unit_cost remains the historical
                 * purchase cost for this specific purchase.
                 */
                $product->suppliers()->syncWithoutDetaching([
                    $validated['supplier_id'] => [
                        'cost_price' => $item['unit_cost'],
                    ],
                ]);

                $inventoryService->receiveStock(
                    $product,
                    $item['quantity'],
                    $item['unit_cost'],
                    'purchase',
                    $purchase->id,
                    Auth::id(),
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

    /**
     * Generate purchase number.
     */
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
