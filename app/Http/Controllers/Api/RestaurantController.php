<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RestaurantController extends Controller
{
    /**
     * Display a listing of the restaurants.
     */
    public function index()
    {
        return response()->json(Restaurant::all(), 200);
    }

    /**
     * Store a newly created restaurant in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:15|unique:restaurants,phone',
            'email' => 'nullable|string|email|max:255|unique:restaurants,email',
            'avatar' => 'nullable|string',
            'cover' => 'nullable|string',
            'description' => 'nullable|string',
            'address' => 'nullable|string|max:255',
            'license_number' => 'nullable|string|max:255|unique:restaurants,license_number',
            'status' => 'nullable|string|in:active,inactive',
            'open_time' => 'nullable|date_format:H:i', 
            'close_time' => 'nullable|date_format:H:i|after:open_time',
        ]);
    
        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }
    
        // Đặt giá trị mặc định nếu không có trong request
        $data = $request->all();
        $data['open_time'] = $data['open_time'] ?? '07:00';
        $data['close_time'] = $data['close_time'] ?? '22:00';
    
        $restaurant = Restaurant::create($data);
    
        return response()->json($restaurant, 201);
    }
        /**
     * Display the specified restaurant.
     */
    public function show($id)
    {
        $restaurant = Restaurant::find($id);

        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant not found'], 404);
        }

        return response()->json($restaurant, 200);
    }

    /**
     * Update the specified restaurant in storage.
     */
    public function update(Request $request, $id)
    {
        $restaurant = Restaurant::find($id);

        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:15|unique:restaurants,phone,' . $id,
            'email' => 'nullable|string|email|max:255|unique:restaurants,email,' . $id,
            'avatar' => 'nullable|string',
            'cover' => 'nullable|string',
            'description' => 'nullable|string',
            'address' => 'nullable|string|max:255',
            'license_number' => 'nullable|string|max:255|unique:restaurants,license_number,' . $id,
            'status' => 'nullable|string|in:active,inactive',
            'open_time' => 'required|date_format:H:i',  
            'close_time' => 'required|date_format:H:i|after:open_time', 
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $restaurant->update($request->all());

        return response()->json($restaurant, 200);
    }

    /**
     * Remove the specified restaurant from storage.
     */
    public function destroy($id)
    {
        $restaurant = Restaurant::find($id);

        if (!$restaurant) {
            return response()->json(['message' => 'Restaurant not found'], 404);
        }

        $restaurant->delete();

        return response()->json(['message' => 'Restaurant deleted successfully'], 200);
    }
}
