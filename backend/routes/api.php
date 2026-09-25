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
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\POSProductController;
use App\Http\Controllers\Api\ReceivableController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ExpenseCategoryController;


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

    Route::post('/sales/{sale}/void-request', [SaleController::class, 'voidRequest']);
    Route::post('/sales/{sale}/refund-request', [SaleController::class, 'refundRequest']);
    Route::get('/sales/action-requests', [SaleController::class, 'actionRequests']);

    Route::post(
        '/sales/action-requests/{actionRequest}/approve',
        [SaleController::class, 'approveActionRequest']
    );

    Route::post(
        '/sales/action-requests/{actionRequest}/reject',
        [SaleController::class, 'rejectActionRequest']
    );

    Route::get('/pos/products', [POSProductController::class, 'index']);


    Route::get(
        '/bir-settings',
        [BirSettingController::class, 'show']
    );


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
        |--------------------------------------------------------------------------
        | Receivables
        |--------------------------------------------------------------------------
        */

        Route::get('/receivables', [ReceivableController::class, 'index']);
        Route::get('/receivables/{id}', [ReceivableController::class, 'show']);
        Route::post('/receivables/{id}/payments', [ReceivableController::class, 'storePayment']);


        /*
        |--------------------------------------------------------------------------
        | BIR Settings
        |--------------------------------------------------------------------------
        */

        Route::post(
            '/bir-settings',
            [BirSettingController::class, 'store']
        );

        Route::put(
            '/bir-settings/{birSetting}',
            [BirSettingController::class, 'update']
        );


        /*
        |--------------------------------------------------------------------------
        | System Settings
        |--------------------------------------------------------------------------
        */

        Route::put(
            '/settings',
            [SettingController::class, 'update']
        );
    });


    /*
    |--------------------------------------------------------------------------
    | Admin and Manager
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:admin,manager')->group(function () {

        /*
        |--------------------------------------------------------------------------
        | status
        |--------------------------------------------------------------------------
        */

        Route::patch(
            '/inventory/{product}/status',
            [InventoryController::class, 'updateStatus']
        );


        /*
        |--------------------------------------------------------------------------
        | Users
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/users',
            [UserController::class, 'index']
        );


        /*
        |--------------------------------------------------------------------------
        | Suppliers
        |--------------------------------------------------------------------------
        */

        Route::apiResource(
            'suppliers',
            SupplierController::class
        );


        /*
        |--------------------------------------------------------------------------
        | Products
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/products/export',
            [ProductController::class, 'export']
        );

        Route::apiResource(
            'products',
            ProductController::class
        );

        Route::post(
            '/products/{product}/suppliers',
            [ProductController::class, 'syncSuppliers']
        );


        /*
        |--------------------------------------------------------------------------
        | Categories
        |--------------------------------------------------------------------------
        */

        Route::apiResource(
            'categories',
            CategoryController::class
        );


        /*
        |--------------------------------------------------------------------------
        | Purchases
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/purchases',
            [PurchaseController::class, 'index']
        );

        Route::get(
            '/purchases/export',
            [PurchaseController::class, 'export']
        );


        Route::get(
            '/purchases/{purchase}',
            [PurchaseController::class, 'show']
        );

        Route::post(
            '/purchases',
            [PurchaseController::class, 'store']
        );


        /*
        |--------------------------------------------------------------------------
        | Inventory
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/inventory',
            [InventoryController::class, 'index']
        );

        Route::get(
            '/inventory/history',
            [InventoryController::class, 'history']
        );

        Route::get(
            '/inventory/export',
            [InventoryController::class, 'export']
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


        /*
        |--------------------------------------------------------------------------
        | Sales Reports
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/reports/sales/export',
            [ReportController::class, 'export']
        );

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

        Route::get(
            '/reports/products',
            [ReportController::class, 'productSales']
        );

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


        /*
        |--------------------------------------------------------------------------
        | Expenses
        |--------------------------------------------------------------------------
        */

        Route::apiResource(
            'expense-categories',
            ExpenseCategoryController::class
        );

        Route::get(
            '/expenses',
            [ExpenseController::class, 'index']
        );

        Route::post(
            '/expenses',
            [ExpenseController::class, 'store']
        );

        Route::get(
            '/expenses/summary',
            [ExpenseController::class, 'summary']
        );

        Route::get(
            '/expenses/export',
            [ExpenseController::class, 'export']
        );

        Route::get(
            '/expenses/{expense}',
            [ExpenseController::class, 'show']
        );

        Route::put(
            '/expenses/{expense}',
            [ExpenseController::class, 'update']
        );

        Route::patch(
            '/expenses/{expense}',
            [ExpenseController::class, 'update']
        );

        Route::post(
            '/expenses/{expense}/void',
            [ExpenseController::class, 'void']
        );
    });


    /*
    |--------------------------------------------------------------------------
    | Admin, Manager, and Cashier
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:admin,manager,cashier')->group(function () {

        /*
        |--------------------------------------------------------------------------
        | System Settings
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/settings',
            [SettingController::class, 'show']
        );


        /*
        |--------------------------------------------------------------------------
        | Inventory
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/inventory',
            [InventoryController::class, 'index']
        );

        Route::get(
            '/inventory/{product}',
            [InventoryController::class, 'show']
        );


        /*
        |--------------------------------------------------------------------------
        | Customers
        |--------------------------------------------------------------------------
        */

        Route::apiResource(
            'customers',
            CustomerController::class
        );


        /*
        |--------------------------------------------------------------------------
        | Sales
        |--------------------------------------------------------------------------
        */

        Route::get(
            '/sales/export',
            [SaleController::class, 'export']
        );

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

        Route::get(
            '/reports/sales/void-refund',
            [ReportController::class, 'voidRefundHistory']
        );

        Route::get(
            '/reports/inventory/movement',
            [ReportController::class, 'inventoryMovement']
        );

        Route::get(
            '/reports/inventory/movement/summary',
            [ReportController::class, 'inventoryMovementSummary']
        );

        Route::get(
            '/reports/dashboard',
            [ReportController::class, 'dashboard']
        );

        Route::get(
            '/reports/sales-trend',
            [ReportController::class, 'salesTrend']
        );
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
