<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SalesReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use App\Services\InventoryReportService;
use App\Services\DashboardReportService;
use Carbon\Carbon;
use App\Exports\ReportsExport;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    /**
     * Resolve report period into date range.
     *
     * Supported periods:
     * - today
     * - yesterday
     * - this_week
     * - this_month
     * - last_month
     * - this_year
     * - custom
     */
    private function resolveDateRange(
        Request $request
    ): array {

        $period = $request->input('period');

        switch ($period) {

            /*
        |--------------------------------------------------------------------------
        | Today
        |--------------------------------------------------------------------------
        */

            case 'today':

                $date = Carbon::now('Asia/Manila');

                return [
                    'from' => $date->toDateString(),
                    'to' => $date->toDateString(),
                ];


                /*
        |--------------------------------------------------------------------------
        | Yesterday
        |--------------------------------------------------------------------------
        */

            case 'yesterday':

                $date = Carbon::now('Asia/Manila')->subDay();

                return [
                    'from' => $date->toDateString(),
                    'to' => $date->toDateString(),
                ];


                /*
        |--------------------------------------------------------------------------
        | This Week
        |--------------------------------------------------------------------------
        */

            case 'this_week':

                $date = Carbon::now('Asia/Manila');

                return [
                    'from' => $date->copy()
                        ->startOfWeek()
                        ->toDateString(),

                    'to' => $date->copy()
                        ->endOfWeek()
                        ->toDateString(),
                ];


                /*
        |--------------------------------------------------------------------------
        | This Month
        |--------------------------------------------------------------------------
        */

            case 'this_month':

                $date = Carbon::now('Asia/Manila');

                return [
                    'from' => $date->copy()
                        ->startOfMonth()
                        ->toDateString(),

                    'to' => $date->copy()
                        ->endOfMonth()
                        ->toDateString(),
                ];


                /*
        |--------------------------------------------------------------------------
        | Last Month
        |--------------------------------------------------------------------------
        */

            case 'last_month':

                $date = Carbon::now('Asia/Manila')->subMonth();

                return [
                    'from' => $date->copy()
                        ->startOfMonth()
                        ->toDateString(),

                    'to' => $date->copy()
                        ->endOfMonth()
                        ->toDateString(),
                ];


                /*
        |--------------------------------------------------------------------------
        | This Year
        |--------------------------------------------------------------------------
        */

            case 'this_year':

                $date = Carbon::now('Asia/Manila');

                return [
                    'from' => $date->copy()
                        ->startOfYear()
                        ->toDateString(),

                    'to' => $date->copy()
                        ->endOfYear()
                        ->toDateString(),
                ];


                /*
        |--------------------------------------------------------------------------
        | Custom
        |--------------------------------------------------------------------------
        */

            case 'custom':

                $validated = $request->validate([
                    'from' => [
                        'required',
                        'date',
                    ],

                    'to' => [
                        'required',
                        'date',
                        'after_or_equal:from',
                    ],
                ]);

                return [
                    'from' => $validated['from'],
                    'to' => $validated['to'],
                ];


                /*
        |--------------------------------------------------------------------------
        | Invalid Period
        |--------------------------------------------------------------------------
        */

            default:

                throw ValidationException::withMessages([
                    'period' => [
                        'Invalid or missing report period. '
                            . 'Allowed values: today, '
                            . 'yesterday, this_week, '
                            . 'this_month, last_month, '
                            . 'this_year, custom.',
                    ],
                ]);
        }
    }




    /**
     * Validate sales report filters.
     */
    private function validateSalesFilters(
        Request $request
    ): array {

        return $request->validate([
            'user_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],

            'product_id' => [
                'nullable',
                'integer',
                'exists:products,id',
            ],

            'status' => [
                'nullable',
                'in:all,completed,voided,refunded',
            ],

            'sale_number' => [
                'nullable',
                'string',
                'max:255',
            ],

            'invoice_number' => [
                'nullable',
                'string',
                'max:255',
            ],

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
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Daily Sales
    |--------------------------------------------------------------------------
    */

    /**
     * Today's daily sales report.
     *
     * This endpoint does not require a period.
     */
    public function dailySales(
        SalesReportService $salesReportService
    ): JsonResponse {

        return response()->json([
            'message' =>
            'Daily sales report retrieved successfully.',

            'data' =>
            $salesReportService->dailySales(),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Sales Report
    |--------------------------------------------------------------------------
    */

    /**
     * Detailed sales report.
     */
    public function sales(
        Request $request,
        SalesReportService $salesReportService
    ): JsonResponse {

        $range = $this->resolveDateRange(
            $request
        );

        $filters = $this->validateSalesFilters(
            $request
        );

        return response()->json([
            'message' =>
            'Sales report retrieved successfully.',

            'filters' => [
                'period' =>
                $request->input('period'),

                'from' =>
                $range['from'],

                'to' =>
                $range['to'],

                'user_id' =>
                $filters['user_id'] ?? null,

                'product_id' =>
                $filters['product_id'] ?? null,

                'status' =>
                $filters['status'] ?? 'completed',

                'sale_number' =>
                $filters['sale_number'] ?? null,

                'invoice_number' =>
                $filters['invoice_number'] ?? null,
            ],

            'data' =>
            $salesReportService->salesPaginated(
                $range['from'],
                $range['to'],
                $filters,
                $request->input('per_page', 20)
            ),
        ]);
    }

    /*
|--------------------------------------------------------------------------
| Export Sales Report
|--------------------------------------------------------------------------
*/

    public function export(
        Request $request,
        SalesReportService $salesReportService
    ) {
        $range = $this->resolveDateRange(
            $request
        );

        $filters = $this->validateSalesFilters(
            $request
        );

        $sales = $salesReportService->sales(
            $range['from'],
            $range['to'],
            $filters
        );

        $data = $sales->map(function ($sale) {
            $totalItems = $sale->items->sum(
                fn($item) => (float) $item->quantity
            );

            $cogs = $sale->items->sum(function ($item) {
                return $item->costs->sum(function ($cost) {
                    $quantity = (float) $cost->quantity;
                    $reversedQuantity =
                        (float) $cost->reversed_quantity;

                    $remainingQuantity = max(
                        0,
                        $quantity - $reversedQuantity
                    );

                    return $remainingQuantity *
                        (float) $cost->unit_cost;
                });
            });

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
                'sale_number' =>
                $sale->sale_number,

                'invoice_number' =>
                $sale->invoice_number,

                'sale_date' =>
                $sale->sale_date,

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
                round($cogs, 2),

                'gross_profit' =>
                round($grossProfit, 2),

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

                'amount_paid' =>
                (float) (
                    $sale->amount_paid ?? 0
                ),

                'status' =>
                $status,
            ];
        });

        return Excel::download(
            new ReportsExport(
                $data,
                $range['from'],
                $range['to'],
                $filters['status'] ?? 'completed'
            ),
            'reports-sales-' .
                now()->format('Y-m-d') .
                '.xlsx'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Sales Summary
    |--------------------------------------------------------------------------
    */

    /**
     * Sales summary report.
     */
    public function salesSummary(
        Request $request,
        SalesReportService $salesReportService
    ): JsonResponse {

        $range = $this->resolveDateRange(
            $request
        );

        $filters = $this->validateSalesFilters(
            $request
        );

        return response()->json([
            'message' =>
            'Sales summary retrieved successfully.',

            'filters' => [
                'period' =>
                $request->input('period'),

                'from' =>
                $range['from'],

                'to' =>
                $range['to'],

                'user_id' =>
                $filters['user_id'] ?? null,

                'product_id' =>
                $filters['product_id'] ?? null,

                'status' =>
                $filters['status'] ?? 'completed',

                'sale_number' =>
                $filters['sale_number'] ?? null,

                'invoice_number' =>
                $filters['invoice_number'] ?? null,
            ],

            'data' =>
            $salesReportService->summary(
                $range['from'],
                $range['to'],
                $filters
            ),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Product Sales
    |--------------------------------------------------------------------------
    */

    /**
     * Product sales report.
     */
    public function productSales(
        Request $request,
        SalesReportService $salesReportService
    ): JsonResponse {

        $range = $this->resolveDateRange(
            $request
        );

        return response()->json([
            'message' =>
            'Product sales report retrieved successfully.',

            'filters' => [
                'period' =>
                $request->input('period'),

                'from' =>
                $range['from'],

                'to' =>
                $range['to'],
            ],

            'data' =>
            $salesReportService->productSales(
                $range['from'],
                $range['to']
            ),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Top Selling Products
    |--------------------------------------------------------------------------
    */

    /**
     * Top selling products report.
     */
    public function topSellingProducts(
        Request $request,
        SalesReportService $salesReportService
    ): JsonResponse {

        $range = $this->resolveDateRange(
            $request
        );

        $products =
            $salesReportService->topSellingProducts(
                $range['from'],
                $range['to']
            );

        return response()->json([
            'message' =>
            'Top selling products retrieved successfully.',

            'filters' => [
                'period' =>
                $request->input('period'),

                'from' =>
                $range['from'],

                'to' =>
                $range['to'],
            ],

            'data' =>
            $products,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Void & Refund History
    |--------------------------------------------------------------------------
    */

    /**
     * Void and refund history report.
     *
     * Uses updated_at because that represents
     * when the void/refund action actually occurred.
     */
    public function voidRefundHistory(
        Request $request,
        SalesReportService $salesReportService
    ): JsonResponse {

        $range = $this->resolveDateRange(
            $request
        );

        $data =
            $salesReportService->voidRefundHistory(
                $range['from'],
                $range['to']
            );

        return response()->json([
            'message' =>
            'Void and refund history retrieved successfully.',

            'filters' => [
                'period' =>
                $request->input('period'),

                'from' =>
                $range['from'],

                'to' =>
                $range['to'],
            ],

            'data' =>
            $data,
        ]);
    }


    /**
     * Inventory movement report.
     */
    public function inventoryMovement(
        Request $request,
        InventoryReportService $inventoryReportService
    ): JsonResponse {

        $range = $this->resolveDateRange(
            $request
        );

        $data =
            $inventoryReportService->movement(
                $range['from'],
                $range['to']
            );

        return response()->json([
            'message' =>
            'Inventory movement report retrieved successfully.',

            'filters' => [
                'period' =>
                $request->input('period'),

                'from' =>
                $range['from'],

                'to' =>
                $range['to'],
            ],

            'data' =>
            $data,
        ]);
    }


    /**
     * Inventory movement summary report.
     */
    public function inventoryMovementSummary(
        Request $request,
        InventoryReportService $inventoryReportService
    ): JsonResponse {

        $range = $this->resolveDateRange(
            $request
        );

        $data =
            $inventoryReportService->summary(
                $range['from'],
                $range['to']
            );

        return response()->json([
            'message' =>
            'Inventory movement summary retrieved successfully.',

            'filters' => [
                'period' =>
                $request->input('period'),

                'from' =>
                $range['from'],

                'to' =>
                $range['to'],
            ],

            'data' =>
            $data,
        ]);
    }



    /**
     * Dashboard report.
     */
    public function dashboard(
        Request $request,
        DashboardReportService $dashboardReportService
    ): JsonResponse {

        /*
    |----------------------------------------------------------------------
    | Main Dashboard Period
    |----------------------------------------------------------------------
    */

        $range = $this->resolveDateRange(
            $request
        );


        /*
    |----------------------------------------------------------------------
    | Top Selling Products Period
    |----------------------------------------------------------------------
    */

        $topProductsPeriod = $request->input(
            'top_products_period',
            'this_month'
        );

        $topProductsRequest = Request::create(
            '',
            'GET',
            [
                'period' => $topProductsPeriod,
            ]
        );

        $topProductsRange = $this->resolveDateRange(
            $topProductsRequest
        );


        /*
    |----------------------------------------------------------------------
    | Dashboard
    |----------------------------------------------------------------------
    */

        $data =
            $dashboardReportService->dashboard(
                $range['from'],
                $range['to'],
                $topProductsRange['from'],
                $topProductsRange['to']
            );


        return response()->json([
            'message' =>
            'Dashboard report retrieved successfully.',

            'filters' => [
                'period' =>
                $request->input('period'),

                'from' =>
                $range['from'],

                'to' =>
                $range['to'],

                'top_products_period' =>
                $topProductsPeriod,

                'top_products_from' =>
                $topProductsRange['from'],

                'top_products_to' =>
                $topProductsRange['to'],
            ],

            'data' =>
            $data,
        ]);
    }




    /**
     * Sales trend report.
     */
    public function salesTrend(
        Request $request,
        SalesReportService $salesReportService
    ): JsonResponse {

        $range = $this->resolveDateRange(
            $request
        );

        return response()->json([

            'message' =>
            'Sales trend retrieved successfully.',

            'filters' => [

                'period' =>
                $request->input('period'),

                'from' =>
                $range['from'],

                'to' =>
                $range['to'],

            ],

            'data' =>
            $salesReportService->salesTrend(
                $range['from'],
                $range['to']
            ),

        ]);
    }
}
