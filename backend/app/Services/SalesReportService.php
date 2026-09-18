<?php

namespace App\Services;

use App\Models\Sale;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use App\Models\SaleItem;

class SalesReportService
{
    /**
     * Get sales summary for a date range.
     *
     * Only completed sales are included by default.
     */
    public function summary(
        ?string $from = null,
        ?string $to = null,
        array $filters = []
    ): array {
        $sales = $this->baseQuery(
            $from,
            $to,
            $filters
        )
            ->with([
                'items.costs',
            ])
            ->get();

        $transactionCount = $sales->count();
        $totalSales = 0.0;
        $totalCOGS = 0.0;

        $productId = $filters['product_id'] ?? null;

        foreach ($sales as $sale) {
            foreach ($sale->items as $item) {

                if (
                    $productId !== null
                    && (int) $item->product_id !== (int) $productId
                ) {
                    continue;
                }

                $totalSales += (float) $item->total;

                $totalCOGS += $this->getItemCOGS(
                    $item
                );
            }
        }

        $totalSales = round($totalSales, 2);
        $totalCOGS = round($totalCOGS, 2);

        $grossProfit = round(
            $totalSales - $totalCOGS,
            2
        );

        $grossMargin = $totalSales > 0
            ? round(
                ($grossProfit / $totalSales) * 100,
                2
            )
            : 0;

        return [
            'transaction_count' => $transactionCount,
            'total_sales' => $totalSales,
            'total_cogs' => $totalCOGS,
            'gross_profit' => $grossProfit,
            'gross_margin' => $grossMargin,
        ];
    }


    /**
     * Get detailed sales report.
     *
     * Only completed sales are included by default.
     */
    public function sales(
        ?string $from = null,
        ?string $to = null,
        array $filters = []
    ): Collection {
        return $this->baseQuery(
            $from,
            $to,
            $filters
        )
            ->with([
                'customer',
                'user',
                'items.product',
                'items.costs.inventoryTransaction',
            ])
            ->latest('id')
            ->get();
    }


    /**
     * Get paginated detailed sales report.
     *
     * Only completed sales are included by default.
     */
    public function salesPaginated(
        ?string $from = null,
        ?string $to = null,
        array $filters = [],
        int $perPage = 20
    ): LengthAwarePaginator {
        return $this->baseQuery(
            $from,
            $to,
            $filters
        )
            ->with([
                'customer',
                'user',
                'items.product',
                'items.costs.inventoryTransaction',
            ])
            ->latest('id')
            ->paginate($perPage);
    }


    /**
     * Get today's sales report.
     */
    public function dailySales(): array
    {
        $date = \Carbon\Carbon::now('Asia/Manila')->toDateString();

        return [
            'date' => $date,

            'summary' => $this->summary(
                $date,
                $date
            ),

            'sales' => $this->sales(
                $date,
                $date
            ),
        ];
    }


    /**
     * Get product sales report.
     *
     * Groups completed sales by product.
     */
    public function productSales(
        ?string $from = null,
        ?string $to = null
    ): Collection {
        $sales = $this->baseQuery($from, $to)
            ->with([
                'items.product',
                'items.costs',
            ])
            ->orderBy('sale_date')
            ->orderBy('id')
            ->get();

        $products = collect();

        foreach ($sales as $sale) {
            foreach ($sale->items as $item) {
                $product = $item->product;

                if (!$product) {
                    continue;
                }

                $productId = $product->id;

                if (!$products->has($productId)) {
                    $products->put($productId, [
                        'product_id' => $productId,
                        'product_name' => $product->name,
                        'sku' => $product->sku,
                        'unit' => $product->unit,

                        'quantity_sold' => 0.0,
                        'sales' => 0.0,
                        'cogs' => 0.0,
                    ]);
                }

                $data = $products->get($productId);

                $data['quantity_sold'] +=
                    (float) $item->quantity;

                $data['sales'] +=
                    (float) $item->total;

                $data['cogs'] +=
                    $this->getItemCOGS($item);

                $products->put(
                    $productId,
                    $data
                );
            }
        }

        return $products
            ->map(function (array $data) {

                $data['quantity_sold'] = round(
                    $data['quantity_sold'],
                    3
                );

                $data['sales'] = round(
                    $data['sales'],
                    2
                );

                $data['cogs'] = round(
                    $data['cogs'],
                    2
                );

                $data['gross_profit'] = round(
                    $data['sales']
                        - $data['cogs'],
                    2
                );

                $data['gross_margin'] =
                    $data['sales'] > 0
                    ? round(
                        (
                            $data['gross_profit']
                            / $data['sales']
                        ) * 100,
                        2
                    )
                    : 0;

                return $data;
            })
            ->sortByDesc('sales')
            ->values();
    }


    /**
     * Calculate COGS for one sale item.
     */
    private function getItemCOGS(SaleItem $saleItem): float
    {
        return round(
            $saleItem->costs->sum(
                function ($cost) {

                    $quantity =
                        (float) $cost->quantity;

                    $reversedQuantity =
                        (float) $cost->reversed_quantity;

                    $remainingQuantity = max(
                        0,
                        $quantity - $reversedQuantity
                    );

                    return $remainingQuantity
                        * (float) $cost->unit_cost;
                }
            ),
            2
        );
    }


    /**
     * Base sales query.
     *
     * Only completed sales are included by default.
     *
     * Optional filters:
     * - user_id
     * - product_id
     * - status
     * - sale_number
     * - invoice_number
     */
    private function baseQuery(
        ?string $from = null,
        ?string $to = null,
        array $filters = []
    ): Builder {
        $query = Sale::query();

        /*
         * Keep the existing behavior:
         * completed sales are returned by default.
         *
         * If status is explicitly "all", all sale statuses
         * are included.
         */
        $status = $filters['status'] ?? 'completed';

        if ($status !== 'all') {
            $query->where(
                'status',
                $status
            );
        }

        if ($from !== null) {
            $query->whereDate(
                'sale_date',
                '>=',
                $from
            );
        }

        if ($to !== null) {
            $query->whereDate(
                'sale_date',
                '<=',
                $to
            );
        }

        /*
         * Sold By filter.
         */
        if (
            isset($filters['user_id'])
            && $filters['user_id'] !== null
            && $filters['user_id'] !== ''
        ) {
            $query->where(
                'user_id',
                $filters['user_id']
            );
        }

        /*
         * Product filter.
         */
        if (
            isset($filters['product_id'])
            && $filters['product_id'] !== null
            && $filters['product_id'] !== ''
        ) {
            $query->whereHas(
                'items',
                function ($itemQuery) use ($filters) {
                    $itemQuery->where(
                        'product_id',
                        $filters['product_id']
                    );
                }
            );
        }

        /*
         * Sale Number filter.
         */
        if (
            isset($filters['sale_number'])
            && $filters['sale_number'] !== ''
        ) {
            $query->where(
                'sale_number',
                'like',
                '%' . $filters['sale_number'] . '%'
            );
        }

        /*
         * Invoice Number filter.
         */
        if (
            isset($filters['invoice_number'])
            && $filters['invoice_number'] !== ''
        ) {
            $query->where(
                'invoice_number',
                'like',
                '%' . $filters['invoice_number'] . '%'
            );
        }

        return $query;
    }


    /**
     * Get top selling products.
     *
     * Only completed sales are included.
     */
    public function topSellingProducts(
        ?string $from = null,
        ?string $to = null
    ): Collection {

        $sales = $this->baseQuery($from, $to)
            ->with([
                'items.product',
                'items.costs',
            ])
            ->orderBy('sale_date')
            ->orderBy('id')
            ->get();

        $products = collect();

        foreach ($sales as $sale) {

            foreach ($sale->items as $item) {

                $product = $item->product;

                if (!$product) {
                    continue;
                }

                $productId = $product->id;

                if (!$products->has($productId)) {

                    $products->put($productId, [
                        'product_id' => $productId,
                        'product_name' => $product->name,
                        'sku' => $product->sku,

                        'quantity_sold' => 0.0,
                        'total_sales' => 0.0,
                        'total_cogs' => 0.0,
                        'gross_profit' => 0.0,
                    ]);
                }

                $data = $products->get(
                    $productId
                );

                $data['quantity_sold'] +=
                    (float) $item->quantity;

                $data['total_sales'] +=
                    (float) $item->total;

                $itemCOGS = $this->getItemCOGS(
                    $item
                );

                $data['total_cogs'] +=
                    $itemCOGS;

                $products->put(
                    $productId,
                    $data
                );
            }
        }

        return $products
            ->map(function (array $data) {

                $data['quantity_sold'] =
                    round(
                        $data['quantity_sold'],
                        3
                    );

                $data['total_sales'] =
                    round(
                        $data['total_sales'],
                        2
                    );

                $data['total_cogs'] =
                    round(
                        $data['total_cogs'],
                        2
                    );

                $data['gross_profit'] =
                    round(
                        $data['total_sales']
                            - $data['total_cogs'],
                        2
                    );

                return $data;
            })
            ->sortByDesc('quantity_sold')
            ->values();
    }


    /**
     * Get void and refund history.
     *
     * Includes both voided and refunded sales.
     */
    public function voidRefundHistory(
        ?string $from = null,
        ?string $to = null
    ): Collection {

        $sales = Sale::query()
            ->whereIn(
                'status',
                [
                    'voided',
                    'refunded',
                ]
            )
            ->with([
                'customer',
                'user',
                'items.product',
                'items.costs',
            ])
            ->when(
                $from !== null,
                function ($query) use ($from) {
                    $query->whereDate(
                        'updated_at',
                        '>=',
                        $from
                    );
                }
            )
            ->when(
                $to !== null,
                function ($query) use ($to) {
                    $query->whereDate(
                        'updated_at',
                        '<=',
                        $to
                    );
                }
            )
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->get();

        return $sales->map(function (Sale $sale) {

            $items = $sale->items->map(
                function ($item) {

                    $cogs = $this->getItemCOGS(
                        $item
                    );

                    return [
                        'sale_item_id' =>
                        $item->id,

                        'product_id' =>
                        $item->product_id,

                        'product_name' =>
                        $item->product?->name,

                        'sku' =>
                        $item->product?->sku,

                        'quantity' =>
                        round(
                            (float) $item->quantity,
                            3
                        ),

                        'unit_price' =>
                        round(
                            (float) $item->unit_price,
                            2
                        ),

                        'total' =>
                        round(
                            (float) $item->total,
                            2
                        ),

                        'cogs' =>
                        $cogs,

                        'gross_profit' =>
                        round(
                            (float) $item->total - $cogs,
                            2
                        ),
                    ];
                }
            )->values();

            return [
                'sale_id' =>
                $sale->id,

                'sale_number' =>
                $sale->sale_number,

                'invoice_number' =>
                $sale->invoice_number,

                'status' =>
                $sale->status,

                'action' =>
                $sale->status === 'voided'
                    ? 'void'
                    : 'refund',

                'customer' =>
                $sale->customer?->name,

                'user' =>
                $sale->user?->name,

                'sale_date' =>
                $sale->sale_date,

                'action_date' =>
                $sale->updated_at,

                'total' =>
                round(
                    (float) $sale->total,
                    2
                ),

                'notes' =>
                $sale->notes,

                'items' =>
                $items,
            ];
        });
    }


    /**
     * Get daily sales trend for a date range.
     *
     * Only completed sales are included.
     */
    public function salesTrend(
        string $from,
        string $to
    ): Collection {

        $sales = $this->baseQuery($from, $to)
            ->select([
                'id',
                'sale_date',
                'total',
            ])
            ->orderBy('sale_date')
            ->orderBy('id')
            ->get();

        $fromDate = \Carbon\Carbon::parse($from);
        $toDate = \Carbon\Carbon::parse($to);

        $trend = collect();

        /*
     * Create every date in the requested range first.
     *
     * This ensures dates with zero sales are also returned.
     */
        for (
            $date = $fromDate->copy();
            $date->lte($toDate);
            $date->addDay()
        ) {

            $dateString = $date->toDateString();

            $trend->put($dateString, [
                'date' => $dateString,
                'sales' => 0.0,
                'transaction_count' => 0,
            ]);
        }


        /*
         * Add completed sales to their corresponding date.
         */
        foreach ($sales as $sale) {

            $date = \Carbon\Carbon::parse(
                $sale->sale_date
            )->toDateString();

            if (!$trend->has($date)) {
                continue;
            }

            $data = $trend->get($date);

            $data['sales'] +=
                (float) $sale->total;

            $data['transaction_count']++;

            $trend->put(
                $date,
                $data
            );
        }


        /*
         * Format numeric values.
         */
        return $trend
            ->map(function (array $data) {

                $data['sales'] = round(
                    $data['sales'],
                    2
                );

                return $data;
            })
            ->values();
    }
}
