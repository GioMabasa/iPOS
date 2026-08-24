<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\SaleController;

Route::post('/purchases', [
    PurchaseController::class,
    'store',
]);

Route::apiResource('suppliers', SupplierController::class);

Route::apiResource('products', ProductController::class);

Route::apiResource('categories', CategoryController::class);

Route::apiResource('customers', CustomerController::class);

Route::post('/sales', [SaleController::class, 'store']);
Route::get('/sales', [SaleController::class, 'index']);
Route::get('/sales/{sale}', [SaleController::class, 'show']);
Route::post('/sales', [SaleController::class, 'store']);
Route::post('/sales/{sale}/void', [SaleController::class, 'void']);


Route::post(
    '/products/{product}/suppliers',
    [ProductController::class, 'syncSuppliers']
);
