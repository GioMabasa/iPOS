<?php

namespace App\Services;

use App\Models\BirSetting;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class InvoiceNumberService
{
    public function generate(): string
    {
        return DB::transaction(function () {

            $setting = BirSetting::where('is_active', true)
                ->lockForUpdate()
                ->first();

            if (!$setting) {
                throw new RuntimeException(
                    'Active BIR settings have not been configured.'
                );
            }

            $setting->invoice_current++;

            $number = $setting->invoice_current;

            $setting->save();

            return $setting->invoice_prefix .
                str_pad(
                    $number,
                    6,
                    '0',
                    STR_PAD_LEFT
                );
        });
    }
}
