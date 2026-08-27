<?php

namespace App\Services;

use App\Models\BirSetting;
use App\Models\Sale;

class InvoiceService
{
    public function getInvoiceData(Sale $sale): array
    {
        $sale->load([
            'customer',
            'user',
            'items.product',
        ]);

        $business = BirSetting::where('is_active', true)->first();

        return [
            'business' => $business ? [
                'tin' => $business->tin,
                'branch_code' => $business->branch_code,
                'registered_name' => $business->registered_name,
                'business_name' => $business->business_name,
                'business_address' => $business->business_address,
                'vat_registered' => (bool) $business->vat_registered,
                'permit_number' => $business->permit_number,
                'permit_date' => $business->permit_date?->format('Y-m-d'),
                'accreditation_number' => $business->accreditation_number,
                'accreditation_date' => $business->accreditation_date?->format('Y-m-d'),
            ] : null,

            'invoice' => [
                'invoice_number' => $sale->invoice_number,
                'sale_number' => $sale->sale_number,
                'date' => $sale->sale_date?->format('Y-m-d'),
                'status' => $sale->status,
            ],

            'customer' => [
                'name' => $sale->customer?->name,
            ],

            'items' => $sale->items->map(function ($item) {
                return [
                    'product' => $item->product?->name,
                    'sku' => $item->product?->sku,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'discount' => $item->discount,
                    'total' => $item->total,
                ];
            })->values()->all(),

            'totals' => [
                'subtotal' => $sale->subtotal,
                'discount' => $sale->discount,
                'tax' => $sale->tax,
                'total' => $sale->total,
                'amount_paid' => $sale->amount_paid,
                'change' => $sale->change_amount,
            ],
        ];
    }
}
