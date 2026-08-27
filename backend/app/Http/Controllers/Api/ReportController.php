<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SalesReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use App\Services\InventoryReportService;
use App\Services\DashboardReportService;

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

                $date = now();

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

                $date = now()->subDay();

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

                return [
                    'from' => now()
                        ->startOfWeek()
                        ->toDateString(),

                    'to' => now()
                        ->endOfWeek()
                        ->toDateString(),
                ];


                /*
            |--------------------------------------------------------------------------
            | This Month
            |--------------------------------------------------------------------------
            */

            case 'this_month':

                return [
                    'from' => now()
                        ->startOfMonth()
                        ->toDateString(),

                    'to' => now()
                        ->endOfMonth()
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
                            . 'this_month, custom.',
                    ],
                ]);
        }
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
            ],

            'data' =>
            $salesReportService->sales(
                $range['from'],
                $range['to']
            ),
        ]);
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
            ],

            'data' =>
            $salesReportService->summary(
                $range['from'],
                $range['to']
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

        $range = $this->resolveDateRange(
            $request
        );


        $data =
            $dashboardReportService->dashboard(
                $range['from'],
                $range['to']
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
