<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BirSetting extends Model
{
    protected $fillable = [
        'tin',
        'branch_code',
        'registered_name',
        'business_name',
        'business_address',
        'vat_registered',
        'tax_type',
        'vat_rate',
        'invoice_prefix',
        'invoice_current',
        'permit_number',
        'permit_date',
        'accreditation_number',
        'accreditation_date',
        'is_active',
    ];

    protected $casts = [
        'vat_registered' => 'boolean',
        'is_active' => 'boolean',
        'permit_date' => 'date',
        'accreditation_date' => 'date',
        'invoice_current' => 'integer',
        'vat_rate' => 'decimal:2',
    ];
}
