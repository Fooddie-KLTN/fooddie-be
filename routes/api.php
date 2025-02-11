<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::apiResource('restaurants', 'App\Http\Controllers\API\RestaurantController');
Route::apiResource('reviews', 'App\Http\Controllers\API\ReviewController');
Route::apiResource('foods', 'App\Http\Controllers\API\FoodController');
Route::apiResource('orders', 'App\Http\Controllers\API\OrderController');
Route::apiResource('order-items', 'App\Http\Controllers\API\OrderItemController');
Route::apiResource('promotions', 'App\Http\Controllers\API\PromotionController');