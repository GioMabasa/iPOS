<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Inventory Export
    |--------------------------------------------------------------------------
    |
    | Maximum number of products allowed for the standard XLSX inventory
    | export. Larger exports will be handled by a future large-export
    | strategy instead of starting a potentially memory-intensive XLSX job.
    |
    */

    'inventory_export_max_products' => env(
        'IPOS_INVENTORY_EXPORT_MAX_PRODUCTS',
        10000
    ),

];
