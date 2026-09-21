<?php

namespace App\Services;

class DashboardReportService
{
    public function __construct(
        private SalesReportService $salesReportService,
        private InventoryReportService $inventoryReportService
    ) {}


    /**
     * Get dashboard report for a date range.
     */
    public function dashboard(
        ?string $from = null,
        ?string $to = null,
        ?string $topProductsFrom = null,
        ?string $topProductsTo = null
    ): array {

        /*
        |--------------------------------------------------------------------------
        | Sales
        |--------------------------------------------------------------------------
        */

        $sales =
            $this->salesReportService->summary(
                $from,
                $to
            );


        /*
        |--------------------------------------------------------------------------
        | Inventory Movement
        |--------------------------------------------------------------------------
        */

        $inventory =
            $this->inventoryReportService->summary(
                $from,
                $to
            );


        /*
        |--------------------------------------------------------------------------
        | Low Stock / Out of Stock
        |--------------------------------------------------------------------------
        */

        $lowStock =
            $this->inventoryReportService
            ->lowStock();


        /*
        |--------------------------------------------------------------------------
        | Top Selling Products
        |--------------------------------------------------------------------------
        */

        $topProducts =
            $this->salesReportService
            ->topSellingProducts(
                $topProductsFrom ?? $from,
                $topProductsTo ?? $to
            )
            ->take(5)
            ->values();


        /*
        |--------------------------------------------------------------------------
        | Void & Refund
        |--------------------------------------------------------------------------
        */

        $voidRefund =
            $this->salesReportService
            ->voidRefundHistory(
                $from,
                $to
            )
            ->take(10)
            ->values();


        return [

            'sales' =>
            $sales,

            'inventory' =>
            $inventory,

            'low_stock' =>
            $lowStock,

            'top_products' =>
            $topProducts,

            'void_refund' =>
            $voidRefund,
        ];
    }
}
