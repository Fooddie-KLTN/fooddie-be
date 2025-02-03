<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\RestaurantController;

// This route will create all the necessary routes for a RESTful API resource controller for 'restaurants'
Route::apiResource('restaurants', RestaurantController::class);