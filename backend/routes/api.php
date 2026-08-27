<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BirSettingController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\InventoryAdjustmentController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\ReportController;


/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);


/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);


    /*
    |--------------------------------------------------------------------------
    | Admin Only
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:admin')->group(function () {

        /*
        |----------------------------------------------------------------------
        | BIR Settings
        |----------------------------------------------------------------------
        */

        Route::get(
            '/bir-settings',
            [BirSettingController::class, 'show']
        );

        Route::post(
            '/bir-settings',
            [BirSettingController::class, 'store']
        );

        Route::put(
            '/bir-settings/{birSetting}',
            [BirSettingController::class, 'update']
        );

        /* 
        |-------------------------------------------------------------------------
        | Daily Report 
        |-------------------------------------------------------------------------- */
        Route::get('/reports/sales/daily', [ReportController::class, 'dailySales']);

        /*
        |----------------------------------------------------------------------
        | Sales Reports
        |----------------------------------------------------------------------
        */

        Route::get(
            '/reports/sales/summary',
            [ReportController::class, 'salesSummary']
        );

        Route::get(
            '/reports/sales',
            [ReportController::class, 'sales']
        );

        Route::get(
            '/reports/sales/daily',
            [ReportController::class, 'dailySales']
        );

        Route::get('/reports/products', [ReportController::class, 'productSales']);

        Route::get(
            '/reports/products/top-selling',
            [ReportController::class, 'topSellingProducts']
        );

        Route::get(
            '/reports/inventory/low-stock',
            [ReportController::class, 'lowStock']
        );


        Route::get(
            '/reports/inventory/transactions',
            [ReportController::class, 'inventoryTransactions']
        );
    });


    /*
    |--------------------------------------------------------------------------
    | Admin and Manager
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:admin,manager')->group(function () {

        /*
        |----------------------------------------------------------------------
        | Suppliers
        |----------------------------------------------------------------------
        */

        Route::apiResource(
            'suppliers',
            SupplierController::class
        );


        /*
        |----------------------------------------------------------------------
        | Products
        |----------------------------------------------------------------------
        */

        Route::apiResource(
            'products',
            ProductController::class
        );

        Route::post(
            '/products/{product}/suppliers',
            [ProductController::class, 'syncSuppliers']
        );


        /*
        |----------------------------------------------------------------------
        | Categories
        |----------------------------------------------------------------------
        */

        Route::apiResource(
            'categories',
            CategoryController::class
        );


        /*
        |----------------------------------------------------------------------
        | Purchases
        |----------------------------------------------------------------------
        */

        Route::post(
            '/purchases',
            [PurchaseController::class, 'store']
        );


        /*
        |----------------------------------------------------------------------
        | Inventory
        |----------------------------------------------------------------------
        */

        Route::get(
            '/inventory',
            [InventoryController::class, 'index']
        );

        Route::get(
            '/inventory/{product}',
            [InventoryController::class, 'show']
        );

        Route::get(
            '/inventory/{product}/transactions',
            [InventoryController::class, 'transactions']
        );

        Route::post(
            '/inventory/adjust',
            [InventoryAdjustmentController::class, 'store']
        );
    });


    /*
    |--------------------------------------------------------------------------
    | Admin, Manager, and Cashier
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:admin,manager,cashier')->group(function () {

        /*
        |----------------------------------------------------------------------
        | Customers
        |----------------------------------------------------------------------
        */

        Route::apiResource(
            'customers',
            CustomerController::class
        );


        /*
        |----------------------------------------------------------------------
        | Sales
        |----------------------------------------------------------------------
        */

        Route::get(
            '/sales',
            [SaleController::class, 'index']
        );

        Route::get(
            '/sales/{sale}',
            [SaleController::class, 'show']
        );

        Route::post(
            '/sales',
            [SaleController::class, 'store']
        );

        Route::get(
            '/sales/{sale}/invoice',
            [SaleController::class, 'invoice']
        );

        Route::get('/reports/sales/void-refund', [ReportController::class, 'voidRefundHistory']);

        Route::get('/reports/inventory/movement', [ReportController::class, 'inventoryMovement']);

        Route::get(
            '/reports/inventory/movement/summary',
            [ReportController::class, 'inventoryMovementSummary']
        );

        Route::get('/reports/dashboard', [ReportController::class, 'dashboard']);
    });


    /*
    |--------------------------------------------------------------------------
    | Admin and Manager - Sensitive Sales Actions
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:admin,manager')->group(function () {

        Route::post(
            '/sales/{sale}/void',
            [SaleController::class, 'void']
        );

        Route::post(
            '/sales/{sale}/refund',
            [SaleController::class, 'refund']
        );
    });
});
