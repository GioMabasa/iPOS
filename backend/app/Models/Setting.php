<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'business_name',
        'business_address',
        'contact_number',
        'email',
        'tin',
        'default_customer',
        'currency',
        'date_format',
        'timezone',
    ];
}
