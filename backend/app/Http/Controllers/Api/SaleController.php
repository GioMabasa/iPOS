<?php

namespace App\Http\Controllers\Api;

use App\Exports\SalesExport;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use App\Services\InventoryCostService;
use App\Services\InventoryService;
use App\Services\InvoiceNumberService;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use App\Models\SaleActionRequest;

class SaleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string'],
            'status' => ['nullable', 'in:completed,refunded,voided'],
            'payment_method' => ['nullable', 'in:cash,charge'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $query = Sale::query();

        /*
    |--------------------------------------------------------------------------
    | User Filter
    |--------------------------------------------------------------------------
    */

        if ($request->user()->role === 'cashier') {
            $query->where('user_id', $request->user()->id);
        } elseif (!empty($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }

        /*
    |--------------------------------------------------------------------------
    | Search Filter
    |--------------------------------------------------------------------------
    */

        if (!empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($q) use ($search) {
                $q->where('sale_number', 'like', "%{$search}%")
                    ->orWhere('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        /*
    |--------------------------------------------------------------------------
    | Status Filter
    |--------------------------------------------------------------------------
    */

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        /*
    |--------------------------------------------------------------------------
    | Date Filters
    |--------------------------------------------------------------------------
    */

        if (!empty($validated['date_from'])) {
            $query->whereDate(
                'sale_date',
                '>=',
                $validated['date_from']
            );
        }

        if (!empty($validated['date_to'])) {
            $query->whereDate(
                'sale_date',
                '<=',
                $validated['date_to']
            );
        }

        /*
    |--------------------------------------------------------------------------
    | Payment Summary Query
    |
    | Clone BEFORE applying payment_method filter.
    | This allows Cash Sales and Charge Sales to be calculated
    | independently of the selected payment filter.
    |--------------------------------------------------------------------------
    */

        $paymentSummaryQuery = clone $query;

        /*
    |--------------------------------------------------------------------------
    | Payment Method Filter
    |
    | This filter is still applied to the actual sales list
    | and the normal sales summary.
    |--------------------------------------------------------------------------
    */

        if (!empty($validated['payment_method'])) {
            $query->where(
                'payment_method',
                $validated['payment_method']
            );
        }

        /*
    |--------------------------------------------------------------------------
    | Summary Query
    |--------------------------------------------------------------------------
    */

        $summaryQuery = clone $query;

        /*
    |--------------------------------------------------------------------------
    | Total Transactions
    |--------------------------------------------------------------------------
    */

        $totalTransactions = $summaryQuery->count();

        /*
    |--------------------------------------------------------------------------
    | Void / Refund
    |--------------------------------------------------------------------------
    */

        $totalVoid = (clone $query)
            ->where('status', 'voided')
            ->count();

        $totalRefund = (clone $query)
            ->where('status', 'refunded')
            ->count();

        /*
    |--------------------------------------------------------------------------
    | Total Items Sold
    |--------------------------------------------------------------------------
    */

        $totalItemsSold = (clone $query)
            ->where('status', 'completed')
            ->withSum('items', 'quantity')
            ->get()
            ->sum('items_sum_quantity');

        /*
    |--------------------------------------------------------------------------
    | Total Sales
    |--------------------------------------------------------------------------
    */

        $totalSales = (clone $query)
            ->where('status', 'completed')
            ->sum('total');

        /*
    |--------------------------------------------------------------------------
    | Completed Sales / COGS
    |--------------------------------------------------------------------------
    */

        $completedSales = (clone $query)
            ->where('status', 'completed')
            ->with('items')
            ->get();

        $totalCOGS = $completedSales->sum(function ($sale) {
            return $sale->items->sum(function ($item) {
                return (float) ($item->total_cost ?? 0);
            });
        });

        /*
    |--------------------------------------------------------------------------
    | Gross Profit
    |--------------------------------------------------------------------------
    */

        $grossProfit = $totalSales - $totalCOGS;

        /*
    |--------------------------------------------------------------------------
    | Gross Margin
    |--------------------------------------------------------------------------
    */

        $grossMargin = $totalSales > 0
            ? ($grossProfit / $totalSales) * 100
            : 0;

        /*
    |--------------------------------------------------------------------------
    | Cash Sales
    |
    | Uses paymentSummaryQuery so this remains independent
    | from the payment_method filter.
    |--------------------------------------------------------------------------
    */

        $cashSales = (clone $paymentSummaryQuery)
            ->where('status', 'completed')
            ->where('payment_method', 'cash')
            ->sum('total');

        /*
    |--------------------------------------------------------------------------
    | Charge Sales
    |--------------------------------------------------------------------------
    */

        $chargeSales = (clone $paymentSummaryQuery)
            ->where('status', 'completed')
            ->where('payment_method', 'charge')
            ->sum('total');

        /*
    |--------------------------------------------------------------------------
    | Amount Paid
    |--------------------------------------------------------------------------
    */

        $amountPaid = (clone $query)
            ->where('status', 'completed')
            ->sum('amount_paid');

        /*
    |--------------------------------------------------------------------------
    | Outstanding Balance
    |--------------------------------------------------------------------------
    */

        $outstandingBalance = (clone $query)
            ->where('status', 'completed')
            ->where('payment_method', 'charge')
            ->get()
            ->sum(function ($sale) {
                return max(
                    0,
                    (float) $sale->total
                        - (float) ($sale->amount_paid ?? 0)
                );
            });

        /*
    |--------------------------------------------------------------------------
    | Discount
    |--------------------------------------------------------------------------
    */

        $totalDiscount = (clone $query)
            ->where('status', 'completed')
            ->sum('discount');

        /*
    |--------------------------------------------------------------------------
    | Tax
    |--------------------------------------------------------------------------
    */

        $totalTax = (clone $query)
            ->where('status', 'completed')
            ->sum('tax');

        /*
    |--------------------------------------------------------------------------
    | Sales List
    |--------------------------------------------------------------------------
    */

        $sales = $query
            ->with([
                'customer',
                'user',
                'items.product',
                'items.costs.inventoryTransaction',
            ])
            ->latest('id')
            ->paginate(20);

        /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

        return response()->json([
            'data' => $sales,

            'summary' => [
                'total_transactions' => $totalTransactions,
                'total_items_sold' => (float) $totalItemsSold,
                'total_sales' => (float) $totalSales,
                'total_cogs' => (float) $totalCOGS,
                'gross_profit' => (float) $grossProfit,
                'gross_margin' => round($grossMargin, 2),

                'cash_sales' => (float) $cashSales,
                'charge_sales' => (float) $chargeSales,

                'amount_paid' => (float) $amountPaid,
                'outstanding_balance' => (float) $outstandingBalance,

                'total_void' => $totalVoid,
                'total_refund' => $totalRefund,

                'total_discount' => (float) $totalDiscount,
                'total_tax' => (float) $totalTax,
            ],
        ]);
    }



    /*
    |--------------------------------------------------------------------------
    | Export Sales
    |--------------------------------------------------------------------------
    */

    public function export(Request $request)
    {
        $validated = $request->validate([
            'search' => [
                'nullable',
                'string',
            ],

            'status' => [
                'nullable',
                'in:completed,refunded,voided',
            ],

            'payment_method' => [
                'nullable',
                'in:cash,charge',
            ],

            'user_id' => [
                'nullable',
                'integer',
                'exists:users,id',
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
        ]);

        /*
        * Base query for sales.
        */
        $query = Sale::query();

        /*
        * Cashier can only export their own sales.
        * Manager and Admin can export all filtered sales.
        */
        if ($request->user()->role === 'cashier') {
            $query->where('user_id', $request->user()->id);
        } elseif (!empty($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }

        /*
        * Search
        */
        if (!empty($validated['search'])) {

            $search = $validated['search'];

            $query->where(function ($q) use ($search) {

                $q->where('sale_number', 'like', "%{$search}%")
                    ->orWhere('invoice_number', 'like', "%{$search}%")

                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('name', 'like', "%{$search}%");
                    })

                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        /*
        * Status filter
        */
        if (!empty($validated['status'])) {
            $query->where(
                'status',
                $validated['status']
            );
        }

        /*
        * Payment Method filter
        *
        * Keep a separate query for payment summary cards
        * before applying the selected payment method filter.
        */
        $paymentSummaryQuery = clone $query;

        if (!empty($validated['payment_method'])) {
            $query->where(
                'payment_method',
                $validated['payment_method']
            );
        }

        /*
        * Date From
        */
        if (!empty($validated['date_from'])) {
            $query->whereDate(
                'sale_date',
                '>=',
                $validated['date_from']
            );
        }

        /*
        * Date To
        */
        if (!empty($validated['date_to'])) {
            $query->whereDate(
                'sale_date',
                '<=',
                $validated['date_to']
            );
        }

        /*
        * Get all matching sales.
        *
        * No pagination because the spreadsheet should
        * contain all matching records.
        */
        $sales = $query
            ->with([
                'customer',
                'user',
                'items',
            ])
            ->latest('id')
            ->get();

        /*
        * Build export data.
        */
        $data = $sales->map(function (Sale $sale) {

            $totalItems = $sale->items->sum(
                fn($item) => (float) $item->quantity
            );

            $cogs = $sale->items->sum(
                fn($item) => (float) ($item->total_cost ?? 0)
            );

            $total = (float) $sale->total;

            $grossProfit = $total - $cogs;

            $grossMargin = $total > 0
                ? ($grossProfit / $total) * 100
                : 0;

            $status = match ($sale->status) {
                'completed' => 'Completed',
                'refunded' => 'Refunded',
                'voided' => 'Voided',
                default => $sale->status,
            };

            return [
                'sale_number' => $sale->sale_number,

                'invoice_number' => $sale->invoice_number,

                'sale_date' => $sale->sale_date,

                'customer' =>
                $sale->customer?->name
                    ?? 'Walk-in Customer',

                'cashier' =>
                $sale->user?->name
                    ?? '—',

                'total_items' =>
                $totalItems,

                'subtotal' =>
                (float) $sale->subtotal,

                'discount' =>
                (float) $sale->discount,

                'tax' =>
                (float) $sale->tax,

                'total' =>
                $total,

                'cogs' =>
                $cogs,

                'gross_profit' =>
                $grossProfit,

                'gross_margin' =>
                round($grossMargin, 2),

                'payment_method' =>
                ucfirst(
                    (string) (
                        $sale->payment_method
                        ?? 'cash'
                    )
                ),

                'term_months' =>
                $sale->term_months ?? 0,

                'due_date' =>
                $sale->due_date ?? '',


                'status' =>
                $status,
            ];
        });

        /*
        |--------------------------------------------------------------------------
        | Download Excel File
        |--------------------------------------------------------------------------
        */

        return Excel::download(
            new SalesExport(
                $data,
                $validated['date_from'] ?? null,
                $validated['date_to'] ?? null,
                $validated['payment_method'] ?? null
            ),
            'sales-' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    public function show(Sale $sale): JsonResponse
    {
        return response()->json([
            'data' => $sale->load([
                'customer',
                'user',
                'items.product',
                'items.costs.inventoryTransaction',
            ]),
        ]);
    }

    /**
     * Complete a new sale.
     */
    public function store(
        Request $request,
        InventoryService $inventoryService,
        InventoryCostService $inventoryCostService,
        InvoiceNumberService $invoiceNumberService
    ): JsonResponse {

        $validated = $request->validate([

            'customer_id' => [
                'nullable',
                'exists:customers,id',
                'required_if:payment_method,charge',
            ],

            'payment_method' => [
                'required',
                'in:cash,charge',
            ],

            'term_months' => [
                'nullable',
                'integer',
                'in:1,2,3,4,5,6,9,12',
                'required_if:payment_method,charge',
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
                'nullable',
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
            $inventoryService,
            $inventoryCostService,
            $invoiceNumberService
        ) {

            $items = collect(
                $validated['items']
            );

            $productIds = $items
                ->pluck('product_id')
                ->unique()
                ->values();

            $products = Product::whereIn(
                'id',
                $productIds
            )
                ->get()
                ->keyBy('id');

            $subtotal = 0.0;

            foreach ($items as $item) {

                $product =
                    $products->get(
                        $item['product_id']
                    );

                if (!$product) {
                    throw ValidationException::withMessages([
                        'items' => [
                            "Product {$item['product_id']} not found.",
                        ],
                    ]);
                }

                $quantity =
                    (float) $item['quantity'];

                $inventoryService
                    ->ensureSufficientStock(
                        $product,
                        $quantity
                    );

                $subtotal +=
                    $quantity
                    * (float) $product->selling_price;
            }

            $discount =
                (float) (
                    $validated['discount']
                    ?? 0
                );

            $tax =
                (float) (
                    $validated['tax']
                    ?? 0
                );

            $total =
                $subtotal
                - $discount
                + $tax;

            if ($total < 0) {
                throw ValidationException::withMessages([
                    'discount' => [
                        'Discount cannot make the sale total negative.',
                    ],
                ]);
            }

            $paymentMethod =
                $validated['payment_method'];

            $amountPaid = 0.0;
            $changeAmount = 0.0;
            $termMonths = null;
            $dueDate = null;

            if ($paymentMethod === 'cash') {

                $amountPaid =
                    (float) (
                        $validated['amount_paid']
                        ?? 0
                    );

                if ($amountPaid < $total) {
                    throw ValidationException::withMessages([
                        'amount_paid' => [
                            "Insufficient payment. Total is {$total}, paid {$amountPaid}.",
                        ],
                    ]);
                }

                $changeAmount =
                    $amountPaid - $total;
            } elseif ($paymentMethod === 'charge') {

                $termMonths =
                    (int) $validated['term_months'];

                $dueDate =
                    \Carbon\Carbon::parse(
                        $validated['sale_date']
                    )->addMonths(
                        $termMonths
                    )->toDateString();
            }

            $userId =
                Auth::id() ?? 1;

            $sale = Sale::create([

                'sale_number' =>
                $this->generateSaleNumber(),

                'invoice_number' =>
                $invoiceNumberService->generate(),

                'customer_id' =>
                $validated['customer_id'] ?? null,

                'user_id' =>
                $userId,

                'sale_date' =>
                $validated['sale_date'],

                'subtotal' =>
                $subtotal,

                'discount' =>
                $discount,

                'tax' =>
                $tax,

                'total' =>
                $total,

                'payment_method' =>
                $paymentMethod,

                'term_months' =>
                $termMonths,

                'due_date' =>
                $dueDate,

                'amount_paid' =>
                $amountPaid,

                'change_amount' =>
                $changeAmount,

                'status' =>
                'completed',

                'notes' =>
                $validated['notes'] ?? null,
            ]);

            foreach ($items as $item) {

                $product =
                    $products->get(
                        $item['product_id']
                    );

                $quantity =
                    (float) $item['quantity'];

                $unitPrice =
                    (float) $product->selling_price;

                $lineTotal =
                    $quantity * $unitPrice;

                $saleItem =
                    $sale->items()->create([

                        'product_id' =>
                        $product->id,

                        'quantity' =>
                        $quantity,

                        'unit_price' =>
                        $unitPrice,

                        'discount' =>
                        0,

                        'total' =>
                        $lineTotal,
                    ]);

                /*
                 * Remove physical inventory.
                 */
                $inventoryService->removeStock(
                    $product,
                    $quantity,
                    $unitPrice,
                    'sale',
                    $sale->id,
                    $userId,
                    "Sale {$sale->sale_number}"
                );

                /*
                 * Allocate actual inventory cost
                 * using FIFO.
                 */
                $inventoryCostService
                    ->allocateFIFO(
                        $saleItem
                    );
            }

            return $sale;
        });

        return response()->json([
            'message' =>
            'Sale completed successfully.',

            'data' =>
            $sale->load([
                'customer',
                'user',
                'items.product',
                'items.costs.inventoryTransaction',
            ]),
        ], 201);
    }

    /**
     * Void completed sale.
     */
    public function void(
        Request $request,
        Sale $sale,
        InventoryService $inventoryService,
        InventoryCostService $inventoryCostService
    ): JsonResponse {

        if (!in_array($request->user()->role, ['admin', 'manager'])) {
            return response()->json([
                'message' => 'Only Manager or Admin can void a sale directly.',
            ], 403);
        }

        if ($sale->status !== 'completed') {
            return response()->json([
                'message' =>
                'Only completed sales can be voided.',
            ], 422);
        }

        DB::transaction(function () use (
            $sale,
            $inventoryService,
            $inventoryCostService
        ) {

            $sale->load([
                'items.product',
                'items.costs',
            ]);

            foreach ($sale->items as $item) {

                $refundedQuantity = (float) $item->refunded_quantity;

                $remainingQuantity =
                    (float) $item->quantity
                    - $refundedQuantity;

                if ($remainingQuantity <= 0) {
                    continue;
                }

                /*
                * Restore only the quantity that has not
                * already been refunded.
                */
                $inventoryService->restoreStock(
                    $item->product,
                    $remainingQuantity,
                    'sale_void',
                    $sale->id,
                    Auth::id(),
                    "Void sale {$sale->sale_number}"
                );

                /*
                * Reverse only the remaining FIFO COGS.
                */
                $inventoryCostService->reverseFIFO(
                    $item,
                    $remainingQuantity
                );
            }

            $sale->update([
                'status' => 'voided',
            ]);
        });

        return response()->json([
            'message' =>
            'Sale voided successfully.',

            'data' =>
            $sale->fresh()->load([
                'customer',
                'user',
                'items.product',
                'items.costs.inventoryTransaction',
            ]),
        ]);
    }

    /**
     * Refund selected items from a completed sale.
     */
    public function refund(
        Request $request,
        Sale $sale,
        InventoryService $inventoryService,
        InventoryCostService $inventoryCostService
    ): JsonResponse {

        if (!in_array($request->user()->role, ['admin', 'manager'])) {
            return response()->json([
                'message' => 'Only Manager or Admin can refund a sale directly.',
            ], 403);
        }

        $validated = $request->validate([
            'items' => [
                'required',
                'array',
                'min:1',
            ],

            'items.*.sale_item_id' => [
                'required',
                'integer',
            ],

            'items.*.quantity' => [
                'required',
                'numeric',
                'gt:0',
            ],
        ]);

        if ($sale->status !== 'completed') {
            return response()->json([
                'message' =>
                'Only completed sales can be refunded.',
            ], 422);
        }

        DB::transaction(function () use (
            $validated,
            $sale,
            $inventoryService,
            $inventoryCostService
        ) {

            $sale->load([
                'items.product',
                'items.costs',
            ]);

            foreach ($validated['items'] as $refundItem) {

                $saleItem = $sale->items
                    ->firstWhere(
                        'id',
                        (int) $refundItem['sale_item_id']
                    );

                if (!$saleItem) {
                    throw ValidationException::withMessages([
                        'items' => [
                            "Sale item {$refundItem['sale_item_id']} does not belong to this sale.",
                        ],
                    ]);
                }

                $refundQuantity =
                    (float) $refundItem['quantity'];

                $soldQuantity =
                    (float) $saleItem->quantity;

                $alreadyRefunded =
                    (float) $saleItem->refunded_quantity;

                $remainingRefundable =
                    $soldQuantity
                    - $alreadyRefunded;

                if ($refundQuantity > $remainingRefundable) {
                    throw ValidationException::withMessages([
                        'items' => [
                            "Refund quantity for sale item {$saleItem->id} exceeds the remaining refundable quantity.",
                        ],
                    ]);
                }

                /*
             * Return selected quantity to inventory.
                 */
                $inventoryService->refundStock(
                    $saleItem->product,
                    $refundQuantity,
                    (float) $saleItem->unit_price,
                    'sale_refund',
                    $sale->id,
                    Auth::id(),
                    "Refund sale {$sale->sale_number}"
                );

                /*
             * Reverse only the refunded quantity
             * from the original FIFO allocation.
                 */
                $inventoryCostService->reverseFIFO(
                    $saleItem,
                    $refundQuantity
                );

                /*
             * Track refunded quantity.
                 */
                $saleItem->increment(
                    'refunded_quantity',
                    $refundQuantity
                );
            }

            /*
         * Mark the entire sale as refunded only when
         * every sale item has been fully refunded.
             */
            $sale->refresh();

            $fullyRefunded = $sale->items()
                ->get()
                ->every(function ($item) {
                    return (float) $item->refunded_quantity
                        >= (float) $item->quantity;
                });

            if ($fullyRefunded) {
                $sale->update([
                    'status' => 'refunded',
                ]);
            }
        });

        return response()->json([
            'message' =>
            'Sale refund processed successfully.',

            'data' =>
            $sale->fresh()->load([
                'customer',
                'user',
                'items.product',
                'items.costs.inventoryTransaction',
            ]),
        ]);
    }

    /**
     * Get invoice data.
     */
    public function invoice(
        Sale $sale,
        InvoiceService $invoiceService
    ): JsonResponse {

        return response()->json([
            'message' =>
            'Invoice data retrieved successfully.',

            'data' =>
            $invoiceService
                ->getInvoiceData($sale),
        ]);
    }

    /**
     * Generate next sale number.
     */
    private function generateSaleNumber(): string
    {
        $nextId =
            (Sale::max('id') ?? 0) + 1;

        return 'SO-' . str_pad(
            $nextId,
            6,
            '0',
            STR_PAD_LEFT
        );
    }

    /**
     * Request a sale void.
     */
    public function voidRequest(Request $request, Sale $sale)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        if ($sale->status !== 'completed') {
            return response()->json([
                'message' => 'Only completed sales can be requested for void.',
            ], 422);
        }

        $pendingRequest = SaleActionRequest::where('sale_id', $sale->id)
            ->where('action_type', 'void')
            ->where('status', 'pending')
            ->first();

        if ($pendingRequest) {
            return response()->json([
                'message' => 'A pending void request already exists for this sale.',
            ], 422);
        }

        $actionRequest = SaleActionRequest::create([
            'sale_id' => $sale->id,
            'requested_by' => $request->user()->id,
            'action_type' => 'void',
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Void request submitted successfully.',
            'data' => $actionRequest->load([
                'sale',
                'requester',
            ]),
        ], 201);
    }

    /**
     * Request a sale item refund.
     */
    public function refundRequest(
        Request $request,
        Sale $sale
    ) {
        $validated = $request->validate([
            'reason' => [
                'required',
                'string',
                'max:1000',
            ],

            'items' => [
                'required',
                'array',
                'min:1',
            ],

            'items.*.sale_item_id' => [
                'required',
                'integer',
            ],

            'items.*.quantity' => [
                'required',
                'numeric',
                'gt:0',
            ],
        ]);

        if ($sale->status !== 'completed') {
            return response()->json([
                'message' =>
                'Only completed sales can be requested for refund.',
            ], 422);
        }

        $sale->load('items');

        foreach ($validated['items'] as $refundItem) {

            $saleItem = $sale->items
                ->firstWhere(
                    'id',
                    (int) $refundItem['sale_item_id']
                );

            if (!$saleItem) {
                return response()->json([
                    'message' =>
                    "Sale item {$refundItem['sale_item_id']} does not belong to this sale.",
                ], 422);
            }

            $remainingRefundable =
                (float) $saleItem->quantity
                - (float) $saleItem->refunded_quantity;

            if ((float) $refundItem['quantity'] > $remainingRefundable) {
                return response()->json([
                    'message' =>
                    "Refund quantity for sale item {$saleItem->id} exceeds the remaining refundable quantity.",
                ], 422);
            }
        }

        $pendingRequest = SaleActionRequest::where(
            'sale_id',
            $sale->id
        )
            ->where('action_type', 'refund')
            ->where('status', 'pending')
            ->first();

        if ($pendingRequest) {
            return response()->json([
                'message' =>
                'A pending refund request already exists for this sale.',
            ], 422);
        }

        $actionRequest = SaleActionRequest::create([
            'sale_id' =>
            $sale->id,

            'requested_by' =>
            $request->user()->id,

            'action_type' =>
            'refund',

            'reason' =>
            $validated['reason'],

            'refund_items' =>
            $validated['items'],

            'status' =>
            'pending',
        ]);

        return response()->json([
            'message' =>
            'Refund request submitted successfully.',

            'data' =>
            $actionRequest->load([
                'sale',
                'requester',
            ]),
        ], 201);
    }

    /**
     * Get sale action requests.
     */
    public function actionRequests(Request $request)
    {
        $query = SaleActionRequest::query()
            ->with([
                'sale.customer',
                'sale.user',
                'sale.items.product',
                'requester',
                'approver',
            ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('action_type')) {
            $query->where('action_type', $request->action_type);
        }

        // Cashier can only see their own requests.
        if ($request->user()->role === 'cashier') {
            $query->where('requested_by', $request->user()->id);
        }

        $requests = $query
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => $requests,
        ]);
    }

    /**
     * Approve a sale action request.
     *
     * Approval executes the requested void/refund action.
     */
    public function approveActionRequest(
        Request $request,
        SaleActionRequest $actionRequest,
        InventoryService $inventoryService,
        InventoryCostService $inventoryCostService
    ) {
        if (!in_array($request->user()->role, ['admin', 'manager'])) {
            return response()->json([
                'message' => 'Only Manager or Admin can approve requests.',
            ], 403);
        }

        if ($actionRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending requests can be approved.',
            ], 422);
        }

        $validated = $request->validate([
            'approval_reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $actionRequest->load([
            'sale.items.product',
            'sale.items.costs',
        ]);

        if (!$actionRequest->sale) {
            return response()->json([
                'message' => 'The sale associated with this request was not found.',
            ], 404);
        }

        if ($actionRequest->sale->status !== 'completed') {
            return response()->json([
                'message' => 'Only completed sales can be approved for this action.',
            ], 422);
        }

        DB::transaction(function () use (
            $request,
            $actionRequest,
            $validated,
            $inventoryService,
            $inventoryCostService
        ) {

            $sale = $actionRequest->sale;

            /*
         * Execute the requested action.
             */
            if ($actionRequest->action_type === 'void') {

                foreach ($sale->items as $item) {

                    $refundedQuantity =
                        (float) $item->refunded_quantity;

                    $remainingQuantity =
                        (float) $item->quantity
                        - $refundedQuantity;

                    if ($remainingQuantity <= 0) {
                        continue;
                    }

                    $inventoryService->restoreStock(
                        $item->product,
                        $remainingQuantity,
                        'sale_void',
                        $sale->id,
                        $request->user()->id,
                        "Void sale {$sale->sale_number}"
                    );

                    $inventoryCostService->reverseFIFO(
                        $item,
                        $remainingQuantity
                    );
                }

                $sale->update([
                    'status' => 'voided',
                ]);
            } elseif ($actionRequest->action_type === 'refund') {

                $refundItems =
                    $actionRequest->refund_items ?? [];

                foreach ($refundItems as $refundItem) {

                    $saleItem = $sale->items
                        ->firstWhere(
                            'id',
                            (int) $refundItem['sale_item_id']
                        );

                    if (!$saleItem) {
                        throw ValidationException::withMessages([
                            'items' => [
                                "Sale item {$refundItem['sale_item_id']} does not belong to this sale.",
                            ],
                        ]);
                    }

                    $refundQuantity =
                        (float) $refundItem['quantity'];

                    $remainingRefundable =
                        (float) $saleItem->quantity
                        - (float) $saleItem->refunded_quantity;

                    if ($refundQuantity > $remainingRefundable) {
                        throw ValidationException::withMessages([
                            'items' => [
                                "Refund quantity for sale item {$saleItem->id} exceeds the remaining refundable quantity.",
                            ],
                        ]);
                    }

                    $inventoryService->refundStock(
                        $saleItem->product,
                        $refundQuantity,
                        (float) $saleItem->unit_price,
                        'sale_refund',
                        $sale->id,
                        $request->user()->id,
                        "Refund sale {$sale->sale_number}"
                    );

                    $inventoryCostService->reverseFIFO(
                        $saleItem,
                        $refundQuantity
                    );

                    $saleItem->increment(
                        'refunded_quantity',
                        $refundQuantity
                    );
                }

                /*
                * The sale becomes "refunded" only when
                * all items have been fully refunded.
                */
                $sale->refresh();

                $fullyRefunded = $sale->items()
                    ->get()
                    ->every(function ($item) {
                        return (float) $item->refunded_quantity
                            >= (float) $item->quantity;
                    });

                if ($fullyRefunded) {
                    $sale->update([
                        'status' => 'refunded',
                    ]);
                }
            } else {

                throw ValidationException::withMessages([
                    'action_type' => [
                        'Invalid sale action type.',
                    ],
                ]);
            }

            /*
         * Mark request as approved only after
         * the actual sale action succeeds.
             */
            $actionRequest->update([
                'status' => 'approved',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
                'approval_reason' => $validated['approval_reason'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Sale action request approved and executed successfully.',
            'data' => $actionRequest->fresh()->load([
                'sale.customer',
                'sale.user',
                'sale.items.product',
                'sale.items.costs.inventoryTransaction',
                'requester',
                'approver',
            ]),
        ]);
    }

    /**
     * Reject a sale action request.
     */
    public function rejectActionRequest(
        Request $request,
        SaleActionRequest $actionRequest
    ) {
        if (!in_array($request->user()->role, ['admin', 'manager'])) {
            return response()->json([
                'message' => 'Only Manager or Admin can reject requests.',
            ], 403);
        }

        if ($actionRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending requests can be rejected.',
            ], 422);
        }

        $validated = $request->validate([
            'approval_reason' => ['required', 'string', 'max:1000'],
        ]);

        $actionRequest->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'approval_reason' => $validated['approval_reason'],
        ]);

        return response()->json([
            'message' => 'Sale action request rejected successfully.',
            'data' => $actionRequest->load([
                'sale',
                'requester',
                'approver',
            ]),
        ]);
    }
}
