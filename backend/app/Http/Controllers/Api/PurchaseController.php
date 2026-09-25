<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Purchase;
use App\Services\InventoryService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Exports\PurchasesExport;
use Maatwebsite\Excel\Facades\Excel;

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

        $validated = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],

            'supplier_id' => [
                'nullable',
                'integer',
                'exists:suppliers,id',
            ],

            'period' => [
                'nullable',
                'in:all,today,yesterday,this_week,this_month,this_year,custom',
            ],

            'start_date' => [
                'nullable',
                'date',
            ],

            'end_date' => [
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],
        ]);

        $query = Purchase::query()
            ->with('supplier');

        /*
         * Search
         */
        if (!empty($validated['search'])) {
            $search = trim($validated['search']);

            $query->where(function ($q) use ($search) {
                $q->where('purchase_number', 'like', "%{$search}%")
                    ->orWhere('reference_number', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($supplierQuery) use ($search) {
                        $supplierQuery->where(
                            'name',
                            'like',
                            "%{$search}%"
                        );
                    });
            });
        }

        /*
         * Supplier filter
         */
        if (!empty($validated['supplier_id'])) {
            $query->where(
                'supplier_id',
                $validated['supplier_id']
            );
        }

        /*
         * Period filter
         *
         * All date calculations use Asia/Manila.
         */
        $period = $validated['period'] ?? 'all';

        if ($period !== 'all') {
            $timezone = 'Asia/Manila';
            $now = Carbon::now($timezone);

            switch ($period) {
                case 'today':
                    $query->whereDate(
                        'purchase_date',
                        $now->toDateString()
                    );
                    break;

                case 'yesterday':
                    $yesterday = $now->copy()->subDay();

                    $query->whereDate(
                        'purchase_date',
                        $yesterday->toDateString()
                    );
                    break;

                case 'this_week':
                    $startOfWeek = $now
                        ->copy()
                        ->startOfWeek();

                    $endOfWeek = $now
                        ->copy()
                        ->endOfWeek();

                    $query->whereBetween('purchase_date', [
                        $startOfWeek->toDateString(),
                        $endOfWeek->toDateString(),
                    ]);
                    break;

                case 'this_month':
                    $startOfMonth = $now
                        ->copy()
                        ->startOfMonth();

                    $endOfMonth = $now
                        ->copy()
                        ->endOfMonth();

                    $query->whereBetween('purchase_date', [
                        $startOfMonth->toDateString(),
                        $endOfMonth->toDateString(),
                    ]);
                    break;

                case 'this_year':
                    $startOfYear = $now
                        ->copy()
                        ->startOfYear();

                    $endOfYear = $now
                        ->copy()
                        ->endOfYear();

                    $query->whereBetween('purchase_date', [
                        $startOfYear->toDateString(),
                        $endOfYear->toDateString(),
                    ]);
                    break;

                case 'custom':
                    if (
                        !empty($validated['start_date']) &&
                        !empty($validated['end_date'])
                    ) {
                        $query->whereBetween('purchase_date', [
                            $validated['start_date'],
                            $validated['end_date'],
                        ]);
                    }

                    break;
            }
        }

        $purchases = $query
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
     * Export purchases to spreadsheet.
     */
    public function export(Request $request)
    {
        $validated = $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:100',
            ],

            'supplier_id' => [
                'nullable',
                'integer',
                'exists:suppliers,id',
            ],

            'period' => [
                'nullable',
                'in:all,today,yesterday,this_week,this_month,this_year,custom',
            ],

            'start_date' => [
                'nullable',
                'date',
            ],

            'end_date' => [
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],
        ]);

        $query = Purchase::query()
            ->with([
                'supplier',
                'items.product',
            ]);

        /*
    |--------------------------------------------------------------------------
    | Search filter
    |--------------------------------------------------------------------------
    */

        if (!empty($validated['search'])) {
            $search = trim($validated['search']);

            $query->where(function ($q) use ($search) {
                $q->where(
                    'purchase_number',
                    'like',
                    "%{$search}%"
                )
                    ->orWhere(
                        'reference_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'status',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhereHas('supplier', function ($supplierQuery) use ($search) {
                        $supplierQuery->where(
                            'name',
                            'like',
                            "%{$search}%"
                        );
                    });
            });
        }

        /*
    |--------------------------------------------------------------------------
    | Supplier filter
    |--------------------------------------------------------------------------
    */

        if (!empty($validated['supplier_id'])) {
            $query->where(
                'supplier_id',
                $validated['supplier_id']
            );
        }

        /*
    |--------------------------------------------------------------------------
    | Period filter
    |--------------------------------------------------------------------------
    |
    | All date calculations use Asia/Manila.
    |
    */

        $period = $validated['period'] ?? 'all';

        $dateFrom = null;
        $dateTo = null;

        if ($period !== 'all') {
            $timezone = 'Asia/Manila';
            $now = Carbon::now($timezone);

            switch ($period) {
                case 'today':
                    $dateFrom = $now->toDateString();
                    $dateTo = $now->toDateString();

                    $query->whereDate(
                        'purchase_date',
                        $dateFrom
                    );

                    break;

                case 'yesterday':
                    $yesterday = $now->copy()->subDay();

                    $dateFrom = $yesterday->toDateString();
                    $dateTo = $yesterday->toDateString();

                    $query->whereDate(
                        'purchase_date',
                        $dateFrom
                    );

                    break;

                case 'this_week':
                    $startOfWeek = $now
                        ->copy()
                        ->startOfWeek();

                    $endOfWeek = $now
                        ->copy()
                        ->endOfWeek();

                    $dateFrom = $startOfWeek->toDateString();
                    $dateTo = $endOfWeek->toDateString();

                    $query->whereBetween('purchase_date', [
                        $dateFrom,
                        $dateTo,
                    ]);

                    break;

                case 'this_month':
                    $startOfMonth = $now
                        ->copy()
                        ->startOfMonth();

                    $endOfMonth = $now
                        ->copy()
                        ->endOfMonth();

                    $dateFrom = $startOfMonth->toDateString();
                    $dateTo = $endOfMonth->toDateString();

                    $query->whereBetween('purchase_date', [
                        $dateFrom,
                        $dateTo,
                    ]);

                    break;

                case 'this_year':
                    $startOfYear = $now
                        ->copy()
                        ->startOfYear();

                    $endOfYear = $now
                        ->copy()
                        ->endOfYear();

                    $dateFrom = $startOfYear->toDateString();
                    $dateTo = $endOfYear->toDateString();

                    $query->whereBetween('purchase_date', [
                        $dateFrom,
                        $dateTo,
                    ]);

                    break;

                case 'custom':
                    $dateFrom = $validated['start_date'] ?? null;
                    $dateTo = $validated['end_date'] ?? null;

                    if ($dateFrom && $dateTo) {
                        $query->whereBetween('purchase_date', [
                            $dateFrom,
                            $dateTo,
                        ]);
                    }

                    break;
            }
        }

        /*
    |--------------------------------------------------------------------------
    | Get purchases
    |--------------------------------------------------------------------------
    */

        $purchases = $query
            ->latest()
            ->get();

        /*
    |--------------------------------------------------------------------------
    | Supplier name
    |--------------------------------------------------------------------------
    */

        $supplier = null;

        if (!empty($validated['supplier_id'])) {
            $supplier = \App\Models\Supplier::find(
                $validated['supplier_id']
            );
        }

        /*
    |--------------------------------------------------------------------------
    | Export
    |--------------------------------------------------------------------------
    */

        return Excel::download(
            new PurchasesExport(
                data: $purchases,
                period: $period,
                dateFrom: $dateFrom,
                dateTo: $dateTo,
                search: $validated['search'] ?? null,
                supplier: $supplier?->name,
            ),
            'purchases.xlsx'
        );
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
