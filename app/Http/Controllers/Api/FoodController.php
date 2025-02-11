<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Food;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FoodController extends Controller
{
    /**
     * Lấy danh sách tất cả các món ăn
     */
    public function index()
    {
        return response()->json(Food::all(), 200);
    }

    /**
     * Tạo một món ăn mới
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'restaurant_id' => 'required|exists:restaurants,id',
            'image' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'status' => 'nullable|string|in:available,unavailable',
            'quantity' => 'nullable|integer|min:0',
            'discount' => 'nullable|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $food = Food::create($request->all());

        return response()->json($food, 201);
    }

    /**
     * Hiển thị thông tin của một món ăn theo ID
     */
    public function show($id)
    {
        $food = Food::find($id);

        if (!$food) {
            return response()->json(['message' => 'Food not found'], 404);
        }

        return response()->json($food, 200);
    }

    /**
     * Cập nhật thông tin một món ăn
     */
    public function update(Request $request, $id)
    {
        $food = Food::find($id);

        if (!$food) {
            return response()->json(['message' => 'Food not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'restaurant_id' => 'sometimes|required|exists:restaurants,id',
            'image' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'description' => 'nullable|string',
            'category_id' => 'sometimes|required|exists:categories,id',
            'status' => 'nullable|string|in:available,unavailable',
            'quantity' => 'nullable|integer|min:0',
            'discount' => 'nullable|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $food->update($request->all());

        return response()->json($food, 200);
    }

    /**
     * Xóa một món ăn theo ID
     */
    public function destroy($id)
    {
        $food = Food::find($id);

        if (!$food) {
            return response()->json(['message' => 'Food not found'], 404);
        }

        $food->delete();

        return response()->json(['message' => 'Food deleted successfully'], 200);
    }
}
