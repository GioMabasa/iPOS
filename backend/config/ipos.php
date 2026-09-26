<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Inventory Export
    |--------------------------------------------------------------------------
    */

    'inventory_export_max_products' => env(
        'IPOS_INVENTORY_EXPORT_MAX_PRODUCTS',
        10000
    ),

    /*
    |--------------------------------------------------------------------------
    | Purchases Export
    |--------------------------------------------------------------------------
    */

    'purchases_export_max_records' => env(
        'IPOS_PURCHASES_EXPORT_MAX_RECORDS',
        10000
    ),

];
