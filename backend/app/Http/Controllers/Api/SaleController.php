<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleController extends Controller
{
    public function index(): JsonResponse
    {
        $sales = Sale::with([
            'customer',
            'user',
            'items.product',
        ])
            ->latest('id')
            ->paginate(20);

        return response()->json([
            'data' => $sales,
        ]);
    }

    public function show(Sale $sale): JsonResponse
    {
        return response()->json([
            'data' => $sale->load([
                'customer',
                'user',
                'items.product',
            ]),
        ]);
    }

    public function void(
        Sale $sale,
        InventoryService $inventoryService
    ): JsonResponse {
        if ($sale->status !== 'completed') {
            return response()->json([
                'message' => 'Only completed sales can be voided.',
            ], 422);
        }

        DB::transaction(function () use (
            $sale,
            $inventoryService
        ) {
            $sale->load('items.product');

            foreach ($sale->items as $item) {
                $inventoryService->restoreStock(
                    $item->product,
                    (float) $item->quantity,
                    'sale_void',
                    $sale->id,
                    Auth::id(),
                    "Void sale {$sale->sale_number}"
                );
            }

            $sale->update([
                'status' => 'voided',
            ]);
        });

        return response()->json([
            'message' => 'Sale voided successfully.',
            'data' => $sale->fresh()->load([
                'customer',
                'user',
                'items.product',
            ]),
        ]);
    }

    public function refund(
        Sale $sale,
        InventoryService $inventoryService
    ): JsonResponse {
        if ($sale->status !== 'completed') {
            return response()->json([
                'message' => 'Only completed sales can be refunded.',
            ], 422);
        }

        DB::transaction(function () use (
            $sale,
            $inventoryService
        ) {
            $sale->load('items.product');

            foreach ($sale->items as $item) {
                $inventoryService->refundStock(
                    $item->product,
                    (float) $item->quantity,
                    (float) $item->unit_price,
                    'sale_refund',
                    $sale->id,
                    Auth::id(),
                    "Refund sale {$sale->sale_number}"
                );
            }

            $sale->update([
                'status' => 'refunded',
            ]);
        });

        return response()->json([
            'message' => 'Sale refunded successfully.',
            'data' => $sale->fresh()->load([
                'customer',
                'user',
                'items.product',
            ]),
        ]);
    }

    public function store(
        Request $request,
        InventoryService $inventoryService
    ): JsonResponse {
        $validated = $request->validate([
            'customer_id' => [
                'nullable',
                'exists:customers,id',
            ],

            'sale_date' => [
                'required',
                'date',
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

            'amount_paid' => [
                'required',
                'numeric',
                'gte:0',
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
        ]);

        $sale = DB::transaction(function () use (
            $validated,
            $inventoryService
        ) {
            $items = collect($validated['items']);

            /*
             * Load products once and prevent duplicate
             * product IDs from causing inconsistent stock.
             */
            $productIds = $items
                ->pluck('product_id')
                ->unique()
                ->values();

            $products = Product::whereIn('id', $productIds)
                ->get()
                ->keyBy('id');

            /*
             * Calculate subtotal and validate stock.
             */
            $subtotal = 0;

            foreach ($items as $item) {
                $product = $products->get($item['product_id']);

                if (!$product) {
                    throw ValidationException::withMessages([
                        'items' => [
                            "Product {$item['product_id']} not found.",
                        ],
                    ]);
                }

                $quantity = (float) $item['quantity'];

                $inventoryService->ensureSufficientStock(
                    $product,
                    $quantity
                );

                $subtotal += $quantity * (float) $product->selling_price;
            }

            $discount = (float) ($validated['discount'] ?? 0);
            $tax = (float) ($validated['tax'] ?? 0);

            $total = $subtotal - $discount + $tax;

            if ($total < 0) {
                throw ValidationException::withMessages([
                    'discount' => [
                        'Discount cannot make the sale total negative.',
                    ],
                ]);
            }

            $amountPaid = (float) $validated['amount_paid'];

            if ($amountPaid < $total) {
                throw ValidationException::withMessages([
                    'amount_paid' => [
                        "Insufficient payment. Total is {$total}, paid {$amountPaid}.",
                    ],
                ]);
            }

            $changeAmount = $amountPaid - $total;
            $userId = Auth::id() ?? 1;
            $sale = Sale::create([
                'sale_number' => $this->generateSaleNumber(),
                'customer_id' => $validated['customer_id'] ?? null,
                //'user_id' => Auth::id(),
                'user_id' => $userId,
                'sale_date' => $validated['sale_date'],
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'total' => $total,
                'amount_paid' => $amountPaid,
                'change_amount' => $changeAmount,
                'status' => 'completed',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($items as $item) {
                $product = $products->get($item['product_id']);

                $quantity = (float) $item['quantity'];
                $unitPrice = (float) $product->selling_price;
                $lineTotal = $quantity * $unitPrice;

                $sale->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'discount' => 0,
                    'total' => $lineTotal,
                ]);

                $inventoryService->removeStock(
                    $product,
                    $quantity,
                    $unitPrice,
                    'sale',
                    $sale->id,
                    Auth::id(),
                    "Sale {$sale->sale_number}"
                );
            }

            return $sale;
        });

        return response()->json([
            'message' => 'Sale completed successfully.',
            'data' => $sale->load([
                'customer',
                'user',
                'items.product',
            ]),
        ], 201);
    }

    private function generateSaleNumber(): string
    {
        $nextId = (Sale::max('id') ?? 0) + 1;

        return 'SO-' . str_pad(
            $nextId,
            6,
            '0',
            STR_PAD_LEFT
        );
    }
}
