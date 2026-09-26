<?php

namespace App\Exports;

use Illuminate\Database\Eloquent\Builder;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PurchasesCsvExport
{
    protected int $batchSize = 500;

    public function __construct(
        protected Builder $purchaseQuery,
    ) {}

    public function download(): StreamedResponse
    {
        return response()->streamDownload(
            function () {
                $handle = fopen('php://output', 'w');

                fputcsv($handle, [
                    'Purchase #',
                    'Purchase Date',
                    'Supplier',
                    'Reference',
                    'Status',
                    'Subtotal',
                    'Discount',
                    'Tax',
                    'Total',
                    'Notes',
                ]);

                $purchases = $this->purchaseQuery
                    ->clone()
                    ->with('supplier')
                    ->lazy($this->batchSize);

                foreach ($purchases as $purchase) {
                    fputcsv($handle, [
                        $purchase->purchase_number,
                        $purchase->purchase_date,
                        $purchase->supplier?->name ?? '—',
                        $purchase->reference_number ?? '—',
                        $purchase->status,
                        (float) $purchase->subtotal,
                        (float) $purchase->discount,
                        (float) $purchase->tax,
                        (float) $purchase->total,
                        $purchase->notes ?? '—',
                    ]);
                }

                fclose($handle);
            },
            'purchases.csv',
            [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' =>
                'attachment; filename="purchases.csv"',
                'Cache-Control' =>
                'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0',
            ]
        );
    }
}
